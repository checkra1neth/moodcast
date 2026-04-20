import express from "express";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createWriteStream, mkdirSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MOODS, DURATIONS, VOICES } from "./moods.mjs";
import { STORIES } from "./stories.mjs";
import { enhancePrompt } from "./enhance.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const client = new ElevenLabsClient();

const AUDIO_DIR = path.join(__dirname, "public", "audio");
if (!existsSync(AUDIO_DIR)) mkdirSync(AUDIO_DIR, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Estimate voice duration from text + speech speed
// ElevenLabs TTS: speed parameter stretches/compresses the audio output.
// At speed=0.85, the audio is stretched (slower), so duration = words / (140/speed) minutes.
// speed < 1 → longer audio; speed > 1 → shorter audio
function estimateVoiceDurationMs(text, speed = 1.0) {
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 140 / speed;
  const minutes = words / wordsPerMinute;
  return Math.round(minutes * 60 * 1000);
}

function streamToFile(stream, filePath) {
  return new Promise(async (resolve, reject) => {
    try {
      const ws = createWriteStream(filePath);
      if (stream.pipe) {
        // Node.js Readable stream
        stream.pipe(ws);
        ws.on("finish", resolve);
        ws.on("error", reject);
      } else {
        // Web ReadableStream or async iterable (e.g. SFX API returns ReadableStream)
        for await (const chunk of stream) {
          ws.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        ws.end();
        ws.on("finish", resolve);
        ws.on("error", reject);
      }
    } catch (err) {
      reject(err);
    }
  });
}

app.get("/api/voices", async (_req, res) => {
  try {
    const response = await client.voices.getAll();
    const voices = response.voices || [];
    const defaultIds = new Set(Object.values(VOICES).map((v) => v.id));
    const list = voices.map((v) => ({
      key: v.voiceId, name: v.name,
      gender: v.labels?.gender || "unknown",
      style: v.labels?.description || v.labels?.use_case || "",
      isDefault: defaultIds.has(v.voiceId),
      preview: v.previewUrl || null, category: v.category || "premade",
    }));
    list.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
    res.json(list);
  } catch (err) {
    console.warn("[voices] API fetch failed, using fallback:", err.message);
    const list = Object.entries(VOICES).map(([, v]) => ({
      key: v.id, name: v.name, gender: v.gender, style: v.style,
      isDefault: true, preview: null, category: "premade",
    }));
    res.json(list);
  }
});

// Search Voice Library (shared/community voices)
app.get("/api/voices/search", async (req, res) => {
  const { q, gender, useCase, language, page = 0 } = req.query;
  if (!q && !useCase && !language) return res.json({ voices: [], hasMore: false });
  try {
    const params = {
      pageSize: 24, page: Number(page),
      ...(q ? { search: q } : {}),
      ...(gender && gender !== "all" ? { gender } : {}),
      ...(useCase && useCase !== "all" ? { useCases: useCase } : {}),
      ...(language && language !== "all" ? { language } : {}),
    };
    const response = await client.voices.getShared(params);
    const voices = response.voices || [];
    console.log(`[voices/search] found ${voices.length} voices`);
    const list = voices.map((v) => ({
      key: v.voiceId, name: v.name,
      gender: v.gender || "unknown", style: v.description || "",
      preview: v.previewUrl || null, category: "library",
      verifiedLanguages: (v.verifiedLanguages || []).map(vl => ({
        language: vl.language, locale: vl.locale,
        accent: vl.accent, preview: vl.previewUrl || null,
      })),
    }));
    res.json({ voices: list, hasMore: response.hasMore || false });
  } catch (err) {
    console.error("[voices/search] Error:", err.message);
    res.status(500).json({ voices: [], hasMore: false, error: err.message });
  }
});

app.post("/api/generate", async (req, res) => {
  const { mood, duration = "medium", customSeconds: rawCustomSec } = req.body;

  const config = MOODS[mood];
  if (!config) return res.status(400).json({ error: "Invalid mood" });

  const durConfig = DURATIONS[duration];
  if (!durConfig) return res.status(400).json({ error: "Invalid duration" });

  const customSeconds = (duration === "custom" && rawCustomSec)
    ? Math.max(15, Math.min(600, Number(rawCustomSec)))
    : null;

  const { customPrompt, voice: voiceKey } = req.body;
  const requestedLang = req.body.lang || null;

  const selectedVoice = voiceKey
    ? { id: voiceKey, name: voiceKey }
    : VOICES[config.defaultVoice];

  const knownVoice = Object.values(VOICES).find((v) => v.id === voiceKey);
  if (knownVoice) selectedVoice.name = knownVoice.name;

  console.log(`[api] Request: mood=${mood}, duration=${duration}${customSeconds ? ` (${customSeconds}s)` : ""}, voice=${selectedVoice.name}, customPrompt=${customPrompt ? `"${customPrompt}"` : "none"}, lang=${requestedLang || "auto"}, mode=${customPrompt ? "custom" : "random"}`);

  // SSE setup
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let story, musicPrompt, storyLang = requestedLang || "en", sfxCues = [];

  // ── Phase 1: Enhance / Story ──
  const needsEnhance = customPrompt || (requestedLang && requestedLang !== "en");
  if (needsEnhance) send("phase", { step: "enhance", status: "start" });

  try {
    if (customPrompt) {
      const storyObj = await enhancePrompt(customPrompt, mood, duration, customSeconds);
      story = storyObj.text;
      musicPrompt = storyObj.musicPrompt;
      sfxCues = storyObj.sfxCues || [];
      storyLang = storyObj.lang || requestedLang || "en";
    } else if (requestedLang && requestedLang !== "en") {
      const LANG_NAMES = { uk: "Ukrainian", es: "Spanish", fr: "French", de: "German", ja: "Japanese" };
      const langName = LANG_NAMES[requestedLang] || requestedLang;
      const storyObj = await enhancePrompt(`Generate a ${config.label.toLowerCase()} mood story in ${langName} language`, mood, duration, customSeconds);
      story = storyObj.text;
      musicPrompt = storyObj.musicPrompt;
      sfxCues = storyObj.sfxCues || [];
      storyLang = requestedLang;
    } else {
      const storyKey = customSeconds
        ? (customSeconds <= 25 ? "short" : customSeconds <= 45 ? "medium" : "long")
        : durConfig.storyLen;
      const storyPool = STORIES[mood]?.[storyKey];
      if (!storyPool?.length) { send("error", { message: "No stories" }); res.end(); return; }
      const storyObj = pick(storyPool);
      story = storyObj.text;
      musicPrompt = storyObj.musicPrompt;
      sfxCues = storyObj.sfxCues || [];
    }
  } catch (err) {
    console.error(`[enhance] Error:`, err);
    send("error", { message: err.message });
    res.end();
    return;
  }

  if (needsEnhance) send("phase", { step: "enhance", status: "done" });

  // Send story preview immediately so client can show it
  send("story", { text: story, sfxCueCount: sfxCues.length });

  if (!musicPrompt.toLowerCase().includes("no vocal")) {
    musicPrompt += ". Instrumental only, no vocals, no singing, no lyrics";
  }

  const voiceEstMs = estimateVoiceDurationMs(story, config.voiceSettings.speed);
  const targetMs = customSeconds ? customSeconds * 1000 : durConfig.seconds * 1000;
  // Music should match the target duration (voice is already word-calibrated to fill it)
  const musicLengthMs = Math.min(Math.max(targetMs, 15000), 600000);

  const id = randomUUID().slice(0, 8);
  console.log(`[${id}] mood=${mood} dur=${duration}`);
  console.log(`[${id}] ${story.split(/\s+/).length} words, speed=${config.voiceSettings.speed}, voice ~${Math.round(voiceEstMs/1000)}s, target=${Math.round(targetMs/1000)}s`);
  console.log(`[${id}] music=${musicLengthMs}ms`);
  console.log(`[${id}] sfxCues: ${sfxCues.length} cinematic cues`);
  sfxCues.forEach((c, i) => console.log(`[${id}]   cue[${i}] @${Math.round(c.at*100)}%: "${c.prompt.slice(0, 50)}..." (${c.duration}s) ← "${c.reason || '?'}"`));

  try {
    const voicePath = path.join(AUDIO_DIR, `voice-${id}.mp3`);
    const musicPath = path.join(AUDIO_DIR, `music-${id}.mp3`);
    const cuePaths = sfxCues.map((_, i) => path.join(AUDIO_DIR, `cue-${id}-${i}.mp3`));

    // ── Phase 2: Generate all audio in parallel, report each completion ──
    send("phase", { step: "voice", status: "start" });
    send("phase", { step: "music", status: "start" });
    if (sfxCues.length) send("phase", { step: "sfx", status: "start", count: sfxCues.length });

    // Track individual completions
    const voicePromise = client.textToSpeech.convert(selectedVoice.id, {
      text: story,
      modelId: "eleven_v3",
      languageCode: storyLang !== "en" ? storyLang : undefined,
      voiceSettings: {
        stability: config.voiceSettings.stability,
        similarityBoost: config.voiceSettings.similarityBoost,
        style: config.voiceSettings.style,
        useSpeakerBoost: config.voiceSettings.useSpeakerBoost,
        speed: config.voiceSettings.speed,
      },
    }).then(async (stream) => {
      await streamToFile(stream, voicePath);
      send("phase", { step: "voice", status: "done" });
      console.log(`[${id}] ✓ Voice done`);
    });

    const musicPromise = client.music.compose({
      prompt: musicPrompt,
      musicLengthMs: musicLengthMs,
      forceInstrumental: true,
    }).then(async (stream) => {
      await streamToFile(stream, musicPath);
      send("phase", { step: "music", status: "done" });
      console.log(`[${id}] ✓ Music done`);
    });

    // Generate SFX in batches of 3 to stay within concurrent request limits
    // (voice + music use 2 slots, so 3 SFX = 5 total max)
    const SFX_BATCH = 3;
    const sfxBatchPromise = (async () => {
      for (let b = 0; b < sfxCues.length; b += SFX_BATCH) {
        const batch = sfxCues.slice(b, b + SFX_BATCH);
        await Promise.all(batch.map((cue, j) => {
          const i = b + j;
          return client.textToSoundEffects.convert({
            text: cue.prompt,
            durationSeconds: cue.duration,
            promptInfluence: 0.6,
            loop: false,
          }).then(async (stream) => {
            await streamToFile(stream, cuePaths[i]);
            send("phase", { step: "sfx", status: "cue-done", index: i, total: sfxCues.length });
            console.log(`[${id}] ✓ SFX cue[${i}] done`);
          });
        }));
      }
    })();

    await Promise.all([voicePromise, musicPromise, sfxBatchPromise]);

    if (sfxCues.length) send("phase", { step: "sfx", status: "done" });

    console.log(`[${id}] Done! Voice + Music + ${sfxCues.length} SFX cues`);

    // ── Final result ──
    send("result", {
      story,
      mood: config.label,
      duration: durConfig.label,
      voiceName: selectedVoice.name,
      voice: `/audio/voice-${id}.mp3`,
      music: `/audio/music-${id}.mp3`,
      sfxCues: sfxCues.map((cue, i) => ({
        at: cue.at,
        prompt: cue.prompt,
        src: `/audio/cue-${id}-${i}.mp3`,
      })),
    });
    res.end();
  } catch (err) {
    console.error(`[${id}] Error:`, err);
    send("error", { message: err.message });
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎧 MoodCast running at http://localhost:${PORT}`);
});
