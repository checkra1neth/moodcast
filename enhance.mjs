import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import ConversationPkg from "@elevenlabs/elevenlabs-js/api/resources/conversationalAi/conversation/Conversation.js";
import AudioInterfacePkg from "@elevenlabs/elevenlabs-js/api/resources/conversationalAi/conversation/AudioInterface.js";
import { MOODS } from "./moods.mjs";

const { Conversation } = ConversationPkg;
const { AudioInterface } = AudioInterfacePkg;

// --- Constants ---

const TARGET_DURATIONS = { short: 17, medium: 32, long: 52 };
const BASE_WPM = 140; // ElevenLabs TTS base rate at speed=1.0
// LLMs consistently under-deliver on word count targets.
const LLM_OVERSHOOT = 1.55;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const KEEPALIVE_INTERVAL_MS = 5000; // ping every 5s to prevent timeout

const SYSTEM_PROMPT = `You are a creative story writer for an audio experience app called MoodCast.

The user will send you a message with:
- A short scene description (their prompt) — it may be in ANY language
- A target mood (relax, focus, energy, or sleep)
- A target word count for the story text
- A target number of SFX cues to generate

CRITICAL: Detect the language of the user's scene description and write the story text in THAT SAME LANGUAGE. If the prompt is in Ukrainian, write in Ukrainian. If in English, write in English. If in Spanish, write in Spanish. Etc.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) with exactly these fields:
- "text": the story text matching the mood and EXACTLY the target word count, IN THE SAME LANGUAGE as the user's prompt. ABSOLUTE RULE: The word count MUST be within ±10% of the target. If target is 1000 words, write 900-1100 words. If target is 500 words, write 450-550 words. COUNT YOUR WORDS CAREFULLY — this directly controls audio duration and the user WILL notice if the audio is too short. For long stories (500+ words), break into paragraphs and develop the scene richly with sensory details, dialogue, and emotional progression.
- "lang": the ISO 639-1 language code of the story text (e.g. "en", "uk", "es", "fr", "de", "ja")
- "musicPrompt": a prompt for AI music generation (ALWAYS in English, describe instruments, tempo, atmosphere)
- "sfxCues": an array of timed sound effect cues synced to specific moments in the story. The user message will specify the EXACT number of SFX cues to generate — you MUST generate that exact number.

CRITICAL RULES FOR "text":
The text will be read aloud by ElevenLabs v3 TTS which supports Audio Tags in square brackets.
You MUST include Audio Tags throughout the story text to control emotion and delivery.

Available Audio Tags by mood:
- relax: [calm], [gentle], [softly], [peaceful], [sigh], [breathes deeply], [quietly], [warmly]
- focus: [determined], [confident], [steady], [clear], [focused], [pauses], [deliberately]
- energy: [excited], [energetic], [powerful], [shouting], [passionately], [triumphant], [rushed], [loudly]
- sleep: [whispering], [sleepy], [dreamy], [yawns], [softly], [hushed], [quietly], [drawn out]

Rules for Audio Tags:
- Place 4-8 tags per story, at emotional shift points and before key sentences
- Use CAPS for strong emphasis: [EXCITED], [WHISPERING], [SHOUTING]
- Combine with punctuation: ellipsis (...) for trailing off, dashes (—) for dramatic pauses, exclamation marks for energy
- Layer tags for nuance: "[EXCITED] The sun breaks through! [PASSIONATELY] You feel alive!"
- For sleep/relax: use [WHISPERING] and [softly] liberally, with ellipsis for dreamy trailing
- For energy: use [SHOUTING] and [EXCITED] at peak moments, short punchy sentences with exclamation marks

CRITICAL RULES FOR "musicPrompt":
- ALWAYS include "instrumental only, no vocals, no singing, no lyrics" in the music prompt
- The music MUST match the specific scene described in the story text, not just the mood
- Reference concrete elements from the story: if the story is about a forest walk, the music should evoke nature; if about a city rooftop, it should feel urban
- Describe instruments, tempo, atmosphere, and energy level
- ALWAYS write musicPrompt in English regardless of story language

The story should be immersive, second-person ("you"/"ті"/"ты"), present tense, and match the mood:
- relax: calm, gentle, soothing imagery
- focus: clarity, determination, flow state
- energy: power, excitement, motivation
- sleep: dreamy, soft, lullaby-like

CRITICAL RULES FOR "sfxCues" (cinematic sound design):
- You MUST include EXACTLY the number of SFX cues specified in the user message. No more, no less.
- Each cue is an object: { "at": <number 0.0-1.0>, "prompt": "<English SFX prompt>", "duration": <seconds 2-8>, "reason": "<quote from story text>" }
- "at" is the position in the story as a fraction (0.0 = start, 0.5 = middle, 1.0 = end)
- "reason" MUST be a direct quote (3-8 words) from the story text that this sound effect accompanies
- Space cues EVENLY throughout the story to create a cinematic soundscape. For example, with 10 cues, place them roughly at 0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95
- Each prompt should describe a SHORT, SPECIFIC sound event (not ambient loops, not abstract moods)

CRITICAL: Each SFX cue MUST directly correspond to a CONCRETE ACTION or OBJECT mentioned in the story text.
- If the story says "you open the door" → SFX: "Wooden door creaking open slowly"
- If the story says "rain taps on the window" → SFX: "Raindrops tapping on glass window"
- If the story says "you take a sip of coffee" → SFX: "Hot coffee being sipped from ceramic mug"
- If the story says "birds sing in the trees" → SFX: "Two birds singing a short melodic phrase"
- If the story says "your fingers touch the keyboard" → SFX: "Keyboard keys clicking in a short burst"

DO NOT generate abstract/generic SFX like "warm feeling", "gentle hum", "subtle energy".
EVERY SFX must be a real-world sound that a microphone could record.

- For sleep/relax: match to physical elements (water, wind, fabric, breath, wood, leaves)
- For energy: match to physical actions (footsteps, door, heartbeat, crowd, impact)
- For focus: match to workspace objects (keyboard, pen, paper, clock, cup, chair)

Keep musicPrompt under 100 words.`;

// --- Chunk config ---
const CHUNK_WORDS = 300; // smaller chunks = more reliable agent responses

// --- Cached agent id ---
let cachedAgentId = process.env.ELEVENLABS_AGENT_ID || null;

// --- Public helpers (exported for testing) ---

export function calculateWordBudget(mood, duration, customSeconds = null) {
  const speed = MOODS[mood].voiceSettings.speed;
  const targetSec = customSeconds || TARGET_DURATIONS[duration] || 32;
  // ElevenLabs effective WPM = 140 / speed (speed < 1 = slower = fewer effective WPM)
  const rawWords = Math.round((targetSec * BASE_WPM) / (60 * speed));
  // LLMs consistently produce fewer words than requested (~60-65% of target).
  return Math.round(rawWords * LLM_OVERSHOOT);
}

export function calculateSfxCount(durationSeconds) {
  if (durationSeconds <= 30) return 3;
  if (durationSeconds <= 60) return 5;
  if (durationSeconds <= 120) return 7;
  if (durationSeconds <= 300) return 9;
  return 12;
}

export function parseAgentResponse(rawText) {
  try {
    const obj = JSON.parse(rawText);
    validate(obj);
    return obj;
  } catch (_) { /* fall through */ }

  const match = rawText.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const obj = JSON.parse(match[0]);
      validate(obj);
      return obj;
    } catch (_) { /* fall through */ }
  }

  throw new Error("Failed to parse AI response");
}

// --- Internal helpers ---

function validate(obj) {
  if (
    typeof obj.text !== "string" || !obj.text.trim() ||
    typeof obj.musicPrompt !== "string" || !obj.musicPrompt.trim()
  ) {
    throw new Error("Failed to parse AI response");
  }
  if (!obj.lang) obj.lang = "en";
  if (!Array.isArray(obj.sfxCues)) obj.sfxCues = [];
  obj.sfxCues = obj.sfxCues
    .filter(c => typeof c.at === "number" && typeof c.prompt === "string" && c.prompt.trim())
    .map(c => ({
      at: Math.max(0, Math.min(1, c.at)),
      prompt: c.prompt.trim(),
      duration: Math.max(2, Math.min(8, c.duration || 4)),
      reason: c.reason || "",
    }))
    .sort((a, b) => a.at - b.at);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createAgent() {
  const client = new ElevenLabsClient();
  const agent = await client.conversationalAi.agents.create({
    name: "MoodCast Story Enhancer",
    conversationConfig: {
      agent: {
        firstMessage: "",
        language: "en",
        prompt: {
          prompt: SYSTEM_PROMPT,
          llm: "gemini-2.5-flash",
          temperature: 0.7,
        },
      },
      conversation: {
        textOnly: true,
        maxDurationSeconds: 300,
      },
    },
  });

  console.log(`[enhance] Agent created: ${agent.agentId}`);
  return agent.agentId;
}

async function ensureAgent() {
  if (cachedAgentId) {
    console.log(`[enhance] Reusing agent: ${cachedAgentId}`);
    return cachedAgentId;
  }
  cachedAgentId = await createAgent();
  return cachedAgentId;
}

// No-op audio interface for text-only mode
class SilentAudio extends AudioInterface {
  start(_cb) {}
  stop() {}
  output(_buf) {}
  interrupt() {}
}

async function chatWithAgent(agentId, message) {
  const client = new ElevenLabsClient();

  return new Promise((resolve, reject) => {
    let response = "";
    let done = false;
    let keepaliveTimer = null;

    const finish = (result, error) => {
      if (done) return;
      done = true;
      if (keepaliveTimer) clearInterval(keepaliveTimer);
      try { conversation.endSession(); } catch (_) {}
      if (error) reject(error);
      else resolve(result);
    };

    const conversation = new Conversation({
      client,
      agentId,
      requiresAuth: true,
      audioInterface: new SilentAudio(),
      callbackAgentResponse: (text) => {
        console.log(`[enhance] agent_response (${text.length} chars)`);
        response = text;
      },
      callbackMessageReceived: (msg) => {
        // Log all messages for debugging
        if (msg.type !== "ping") {
          console.log(`[enhance] WS msg: ${msg.type}`);
        }
        if (msg.type === "agent_chat_response_part") {
          const part = msg.text_response_part;
          if (part?.type === "delta" && part.text) {
            response += part.text;
          }
          if (part?.type === "stop") {
            console.log(`[enhance] Chat response complete (${response.length} chars)`);
            finish(response);
          }
        }
      },
    });

    conversation.on("error", (err) => {
      finish(null, new Error(`Agent error: ${err.message || err}`));
    });

    conversation.on("session_ended", (convId, code, reason) => {
      if (!done) {
        if (response) {
          finish(response);
        } else {
          console.error(`[enhance] WebSocket closed: code=${code}, reason=${reason}`);
          finish(null, new Error(`Agent session closed without response (code=${code})`));
        }
      }
    });

    conversation.startSession().then(() => {
      console.log(`[enhance] Session started, sending message (${message.length} chars)`);
      conversation.sendUserMessage(message);

      // Keepalive: ping every 5s to prevent server-side timeout
      keepaliveTimer = setInterval(() => {
        try {
          if (conversation.isSessionActive()) {
            conversation.registerUserActivity();
          } else {
            clearInterval(keepaliveTimer);
          }
        } catch (_) {
          clearInterval(keepaliveTimer);
        }
      }, KEEPALIVE_INTERVAL_MS);
    }).catch((err) => {
      finish(null, err);
    });
  });
}

// Chat with retry — recreates agent on failure
async function chatWithRetry(message) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const agentId = await ensureAgent();
      return await chatWithAgent(agentId, message);
    } catch (err) {
      console.warn(`[enhance] Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      // Only recreate agent if it's not a quota issue
      if (err.message.includes("quota")) {
        throw err; // no point retrying quota errors
      }
      cachedAgentId = null;
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`[enhance] Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
}

// --- Main export ---

export async function enhancePrompt(userPrompt, mood, duration, customSeconds = null) {
  const wordBudget = calculateWordBudget(mood, duration, customSeconds);
  const targetSec = customSeconds || TARGET_DURATIONS[duration] || 32;
  const sfxCount = calculateSfxCount(targetSec);

  // For short stories that fit in one call
  if (wordBudget <= CHUNK_WORDS) {
    const message = `Mood: ${mood}
Target words: ${wordBudget} (STRICT: write EXACTLY ${wordBudget} words ±15%. COUNT CAREFULLY!)
Target SFX cues: ${sfxCount} (generate EXACTLY ${sfxCount} sound effect cues, evenly spaced)
Scene: ${userPrompt}`;
    const raw = await chatWithRetry(message);
    return parseAgentResponse(raw);
  }

  // For long stories — generate in chunks
  const chunks = Math.ceil(wordBudget / CHUNK_WORDS);
  const wordsPerChunk = Math.ceil(wordBudget / chunks);
  console.log(`[enhance] Long story: ${wordBudget} words → ${chunks} chunks of ~${wordsPerChunk} words`);

  const sfxPerChunk = (i) => {
    const base = Math.floor(sfxCount / chunks);
    return i < (sfxCount % chunks) ? base + 1 : base;
  };

  let fullText = "";
  let musicPrompt = "";
  let allSfxCues = [];
  let lang = "en";

  for (let i = 0; i < chunks; i++) {
    const chunkSfx = sfxPerChunk(i);
    const chunkStart = i / chunks;
    const chunkEnd = (i + 1) / chunks;
    const isFirst = i === 0;
    const isLast = i === chunks - 1;

    let message;
    if (isFirst) {
      message = `Mood: ${mood}
Target words: ${wordsPerChunk} (STRICT: write EXACTLY ${wordsPerChunk} words ±15%. COUNT CAREFULLY!)
Target SFX cues: ${chunkSfx} (with "at" values between ${chunkStart.toFixed(2)} and ${chunkEnd.toFixed(2)})
This is PART 1 of ${chunks} of a longer story. Write the BEGINNING — set the scene, introduce the atmosphere. End at a natural pause point so the story can continue.
Scene: ${userPrompt}`;
    } else if (isLast) {
      message = `Mood: ${mood}
Target words: ${wordsPerChunk} (STRICT: write EXACTLY ${wordsPerChunk} words ±15%. COUNT CAREFULLY!)
Target SFX cues: ${chunkSfx} (with "at" values between ${chunkStart.toFixed(2)} and ${chunkEnd.toFixed(2)})
This is the FINAL PART (${i + 1} of ${chunks}). Write a satisfying conclusion that brings closure and peace.
Continue this story SEAMLESSLY (same language, same style, same tone, same person):
"""${fullText.slice(-300)}"""`;
    } else {
      message = `Mood: ${mood}
Target words: ${wordsPerChunk} (STRICT: write EXACTLY ${wordsPerChunk} words ±15%. COUNT CAREFULLY!)
Target SFX cues: ${chunkSfx} (with "at" values between ${chunkStart.toFixed(2)} and ${chunkEnd.toFixed(2)})
This is PART ${i + 1} of ${chunks}. Continue developing the scene with new sensory details and emotional depth. End at a natural pause point.
Continue this story SEAMLESSLY (same language, same style, same tone, same person):
"""${fullText.slice(-300)}"""`;
    }

    const raw = await chatWithRetry(message);
    const result = parseAgentResponse(raw);

    fullText += (fullText ? " " : "") + result.text;
    if (isFirst) {
      musicPrompt = result.musicPrompt;
      lang = result.lang;
    }
    allSfxCues.push(...result.sfxCues);

    const chunkWords = result.text.split(/\s+/).length;
    console.log(`[enhance] Chunk ${i + 1}/${chunks}: ${chunkWords} words, ${result.sfxCues.length} SFX`);
  }

  // --- Word count safety net ---
  const speed = MOODS[mood].voiceSettings.speed;
  const realWordTarget = Math.round((targetSec * BASE_WPM) / (60 * speed));
  const actualWords = fullText.split(/\s+/).length;
  const MIN_RATIO = 0.80;

  if (actualWords < realWordTarget * MIN_RATIO) {
    console.log(`[enhance] Word count too low: ${actualWords}/${realWordTarget} (${Math.round(actualWords/realWordTarget*100)}%). Generating extra chunk...`);
    const deficit = realWordTarget - actualWords;
    const extraSfx = Math.max(1, Math.min(3, Math.round(deficit / 80)));
    const extraStart = actualWords / realWordTarget;

    const extraMessage = `Mood: ${mood}
Target words: ${Math.round(deficit * LLM_OVERSHOOT)} (STRICT: write EXACTLY this many words ±15%. COUNT CAREFULLY!)
Target SFX cues: ${extraSfx} (with "at" values between ${extraStart.toFixed(2)} and 1.00)
This is an EXTRA continuation to make the story longer. Write more scene development with rich sensory details. End with a satisfying conclusion.
Continue this story SEAMLESSLY (same language, same style, same tone, same person):
"""${fullText.slice(-300)}"""`;

    const extraRaw = await chatWithRetry(extraMessage);
    const extraResult = parseAgentResponse(extraRaw);
    fullText += " " + extraResult.text;
    allSfxCues.push(...extraResult.sfxCues);
    console.log(`[enhance] Extra chunk: +${extraResult.text.split(/\s+/).length} words, +${extraResult.sfxCues.length} SFX`);
  }

  console.log(`[enhance] Total: ${fullText.split(/\s+/).length} words, ${allSfxCues.length} SFX cues`);

  return {
    text: fullText,
    lang,
    musicPrompt,
    sfxCues: allSfxCues.sort((a, b) => a.at - b.at),
  };
}
