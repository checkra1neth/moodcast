// MoodCast — Client
const $ = (s) => document.querySelector(s);
const screens = { select: $("#mood-select"), loading: $("#loading"), player: $("#player") };

let audioVoice, audioMusic;
let audioCues = []; // { at, src, audio, fired }
let cueVolume = 0.7;
let isPlaying = false;
let selectedMood = null;
let selectedDuration = "medium";
let selectedVoice = null;
let animFrameId = null;
let currentMode = "random";
let loopEnabled = false;
let customSeconds = 120;

const MOOD_THEMES = {
  relax:  { h: 160, s: "60%", l: "55%", name: "Relax" },
  focus:  { h: 220, s: "70%", l: "60%", name: "Focus" },
  energy: { h: 40,  s: "85%", l: "55%", name: "Energy" },
  sleep:  { h: 260, s: "65%", l: "60%", name: "Sleep" },
};
const MOOD_EMOJI = { relax: "🌿", focus: "🎯", energy: "⚡", sleep: "🌙" };

// Material Symbols icon names for moods (matches mood pills)
const MOOD_ICON = {
  relax: "spa",
  focus: "center_focus_strong",
  energy: "bolt",
  sleep: "bedtime",
};

function moodIconHTML(mood, filled = false) {
  const fill = filled ? 1 : 0;
  return `<span class="material-symbols-outlined" style="font-variation-settings:'FILL' ${fill},'wght' 300,'GRAD' 0,'opsz' 24">${MOOD_ICON[mood]}</span>`;
}
const MOOD_DEFAULT_VOICE = {
  relax: "EXAVITQu4vr4xnSDxMaL",   // Sarah
  focus: "onwK4e9ZLuTAKqWW03F9",    // Daniel
  energy: "JBFqnCBsd6RMkjVDRZzb",   // George
  sleep: "XB0fDUnXU5powFXDhCwa",    // Charlotte
};

let voicesData = [];
let libraryResults = [];
let voiceSearchQuery = "";
let voiceGenderFilter = "all";
let voiceCategory = "all";
let voiceLang = "all";
let searchTimeout = null;
let voiceFiltersOpen = false;
let filterSubTab = "type";

async function loadVoices() {
  try {
    const res = await fetch("/api/voices");
    voicesData = await res.json();
    renderVoices();
  } catch (e) { console.warn("Could not load voices", e); }
}

const LANG_MAP = {
  en: "en", uk: "uk", es: "es", fr: "fr", de: "de", ja: "ja",
};

async function searchLibrary(query, browse = false) {
  if (!query && !browse) { libraryResults = []; return; }
  if (query && query.length < 2 && !browse) { libraryResults = []; return; }
  try {
    const p = new URLSearchParams();
    if (query && query.length >= 2) p.set("q", query);
    if (voiceGenderFilter !== "all") p.set("gender", voiceGenderFilter);
    if (voiceCategory !== "all") p.set("useCase", voiceCategory);
    if (voiceLang !== "all") p.set("language", voiceLang);
    if (!p.toString()) { libraryResults = []; return; }
    const res = await fetch(`/api/voices/search?${p}`);
    const data = await res.json();
    libraryResults = data.voices || [];
  } catch (e) { libraryResults = []; }
}

const isBrowsing = () => voiceCategory !== "all" || voiceLang !== "all";

async function applyFilter() {
  await searchLibrary(voiceSearchQuery, isBrowsing());
  renderVoices();
}

function renderVoices() {
  const container = $("#voice-options");
  if (!container) return;

  // Preserve scroll position of the voice grid
  const oldGrid = container.querySelector(".vs-grid");
  const scrollTop = oldGrid ? oldGrid.scrollTop : 0;

  const q = voiceSearchQuery.toLowerCase();
  let local = voicesData;
  if (q) local = local.filter((v) => v.name.toLowerCase().includes(q));
  if (voiceGenderFilter !== "all") local = local.filter((v) => v.gender === voiceGenderFilter);

  const ids = new Set(local.map((v) => v.key));
  const lib = libraryResults.filter((v) => !ids.has(v.key));
  const browsing = isBrowsing();

  const lShow = browsing ? [] : local.slice(0, 12);
  const rShow = lib.slice(0, 15);
  const empty = lShow.length === 0 && rShow.length === 0;

  const pill = (key, val, label, attr) =>
    `<button class="vp${val === key ? " on" : ""}" ${attr}="${key}">${label}</button>`;

  container.innerHTML = `
    <div class="vs-top-row">
      <div class="vs-search-wrap">
        <span class="material-symbols-outlined">search</span>
        <input type="text" class="vs-input" id="voice-search" placeholder="Search voices..." value="${voiceSearchQuery}" />
      </div>
      <button class="vs-filter-btn" id="vs-filter-toggle" aria-label="Filters">
        <span class="material-symbols-outlined">tune</span>
        ${(voiceGenderFilter !== "all" || voiceCategory !== "all" || voiceLang !== "all") ? '<span class="vs-filter-dot"></span>' : ''}
      </button>
    </div>
    <div class="vs-bar ${voiceFiltersOpen ? '' : 'vs-bar-hidden'}" id="vs-filter-bar">
      <div class="vs-subtabs">
        <button class="vs-subtab${filterSubTab === 'type' ? ' on' : ''}" data-subtab="type">Type</button>
        <button class="vs-subtab${filterSubTab === 'lang' ? ' on' : ''}" data-subtab="lang">Lang</button>
        <button class="vs-subtab${filterSubTab === 'gender' ? ' on' : ''}" data-subtab="gender">Gender</button>
      </div>
      <div class="vs-subpills">
        ${filterSubTab === 'type' ? [
          {k:"all",l:"All"},{k:"narrative_story",l:"Story"},{k:"social_media",l:"Social"},{k:"conversational",l:"Chat"},{k:"informative_educational",l:"Edu"}
        ].map(f => pill(f.k, voiceCategory, f.l, "data-cat")).join("") : ''}
        ${filterSubTab === 'lang' ? [
          {k:"all",l:"All"},{k:"en",l:"EN"},{k:"uk",l:"UA"},{k:"es",l:"ES"},{k:"fr",l:"FR"},{k:"de",l:"DE"},{k:"ja",l:"JA"}
        ].map(f => pill(f.k, voiceLang, f.l, "data-lang")).join("") : ''}
        ${filterSubTab === 'gender' ? [
          {k:"all",l:"All"},{k:"female",l:"♀"},{k:"male",l:"♂"}
        ].map(f => pill(f.k, voiceGenderFilter, f.l, "data-gf")).join("") : ''}
      </div>
    </div>
    ${lShow.length ? `<div class="vs-grid">${lShow.map(vChip).join("")}</div>` : ""}
    ${rShow.length ? `${lShow.length ? '<div class="vs-lbl">Library</div>' : ''}<div class="vs-grid">${rShow.map(vChip).join("")}</div>` : ""}
    ${empty && browsing ? '<div class="vs-msg">No voices found</div>' : ""}
  `;

  container.querySelector("#voice-search").addEventListener("input", (e) => {
    voiceSearchQuery = e.target.value;
    renderVoices();
    clearTimeout(searchTimeout);
    if (voiceSearchQuery.length >= 2 || browsing) {
      searchTimeout = setTimeout(async () => {
        await searchLibrary(voiceSearchQuery, browsing);
        renderVoices();
        const n = container.querySelector("#voice-search");
        if (n) { n.focus(); n.selectionStart = n.selectionEnd = n.value.length; }
      }, 300);
    } else { libraryResults = []; }
    const n = container.querySelector("#voice-search");
    if (n) { n.focus(); n.selectionStart = n.selectionEnd = n.value.length; }
  });

  const filterToggle = container.querySelector("#vs-filter-toggle");
  if (filterToggle) {
    filterToggle.addEventListener("click", () => {
      voiceFiltersOpen = !voiceFiltersOpen;
      const bar = container.querySelector("#vs-filter-bar");
      if (bar) bar.classList.toggle("vs-bar-hidden", !voiceFiltersOpen);
    });
  }

  container.querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => { voiceCategory = b.dataset.cat; applyFilter(); }));
  container.querySelectorAll("[data-lang]").forEach(b => b.addEventListener("click", () => { voiceLang = b.dataset.lang; applyFilter(); }));
  container.querySelectorAll("[data-gf]").forEach(b => b.addEventListener("click", () => { voiceGenderFilter = b.dataset.gf; applyFilter(); }));

  container.querySelectorAll("[data-subtab]").forEach(b => b.addEventListener("click", () => {
    filterSubTab = b.dataset.subtab;
    renderVoices();
  }));

  container.querySelectorAll(".vc").forEach(btn => {
    btn.addEventListener("click", (e) => {
      if (e.target.classList.contains("vc-pv")) { togglePreview(btn.dataset.voice, btn.dataset.preview); return; }
      selectedVoice = btn.dataset.voice;
      container.querySelectorAll(".vc").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
      if (btn.dataset.preview) togglePreview(btn.dataset.voice, btn.dataset.preview);
    });
  });

  // Restore scroll position of the voice grid
  const newGrid = container.querySelector(".vs-grid");
  if (newGrid && scrollTop) newGrid.scrollTop = scrollTop;
}

function getPreviewUrl(v) {
  // If a non-English language is selected, try to find a matching verified language preview
  if (voiceLang !== "all" && voiceLang !== "en" && v.verifiedLanguages?.length) {
    const match = v.verifiedLanguages.find(vl => vl.language === voiceLang);
    if (match?.preview) return match.preview;
  }
  return v.preview || null;
}

function vChip(v) {
  const nm = v.name.split(" - ")[0];
  const pv = window._previewingVoice === v.key;
  const isSelected = v.key === selectedVoice;
  const desc = v.labels ? Object.values(v.labels).slice(0, 2).join(", ") : (v.gender || "");
  const previewUrl = getPreviewUrl(v);
  return `<button class="vc${isSelected ? " on" : ""}${pv ? " pv" : ""}" data-voice="${v.key}"${previewUrl ? ` data-preview="${previewUrl}"` : ''}>
    <span class="vc-avatar"><span class="material-symbols-outlined">record_voice_over</span></span>
    <span class="vc-info">
      <span class="vc-nm-row"><span class="vc-nm">${nm}</span>${isSelected ? '<span class="vc-selected-badge">Selected</span>' : ''}</span>
      ${desc ? `<span class="vc-desc">${desc}</span>` : ''}
    </span>
    ${previewUrl ? `<span class="vc-pv"><span class="material-symbols-outlined">${pv ? "pause" : "play_arrow"}</span></span>` : ""}
  </button>`;
}

function togglePreview(voiceKey, url) {
  if (!url) return;
  if (window._voicePreview) { window._voicePreview.pause(); window._voicePreview = null; }
  if (window._previewingVoice === voiceKey) { window._previewingVoice = null; renderVoices(); return; }
  window._previewingVoice = voiceKey;
  window._voicePreview = new Audio(url);
  window._voicePreview.volume = 0.6;
  window._voicePreview.play().catch(() => {});
  window._voicePreview.addEventListener("ended", () => { window._previewingVoice = null; renderVoices(); });
  setTimeout(() => { if (window._previewingVoice === voiceKey) { if (window._voicePreview) window._voicePreview.pause(); window._previewingVoice = null; renderVoices(); } }, 12000);
  renderVoices();
}

loadVoices();

// ── Background particles ──
const canvas = $("#bg-canvas");
const ctx = canvas.getContext("2d");
let particles = [];

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function initParticles(count = 35) {
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    dx: (Math.random() - 0.5) * 0.25, dy: (Math.random() - 0.5) * 0.25,
    alpha: Math.random() * 0.25 + 0.03,
  }));
}
initParticles();

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const h = getComputedStyle(document.documentElement).getPropertyValue("--mood-h").trim() || "260";
  for (const p of particles) {
    p.x += p.dx; p.y += p.dy;
    if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${h}, 60%, 70%, ${p.alpha})`; ctx.fill();
  }
  requestAnimationFrame(drawParticles);
}
drawParticles();

function setMoodTheme(mood) {
  const t = MOOD_THEMES[mood]; const r = document.documentElement;
  r.style.setProperty("--mood-h", t.h);
  r.style.setProperty("--mood-s", t.s);
  r.style.setProperty("--mood-l", t.l);
}

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// ── Mood pill clicks ──
document.querySelectorAll(".mood-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    selectedMood = pill.dataset.mood;
    selectedVoice = MOOD_DEFAULT_VOICE[selectedMood];
    setMoodTheme(selectedMood);
    renderVoices();
    document.querySelectorAll(".mood-pill").forEach((p) => p.classList.remove("selected"));
    pill.classList.add("selected");
    $("#config-panel").classList.remove("hidden");
    setTimeout(() => {
      $("#config-panel").scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  });
});

// ── Tab navigation ──
document.querySelectorAll(".cfg-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".cfg-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".cfg-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    const target = document.getElementById("tab-" + tab.dataset.tab);
    if (target) target.classList.add("active");
  });
});

// ── Mode toggle ──
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentMode = btn.dataset.mode;
    document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    $(".mode-toggle").dataset.active = currentMode;
    if (currentMode === "custom") {
      $("#prompt-input-wrap").classList.remove("hidden");
      $("#prompt-input").focus();
    } else {
      $("#prompt-input-wrap").classList.add("hidden");
    }
  });
});

// ── Prompt input ──
const promptInput = $("#prompt-input");
const charCounter = $("#char-counter");
promptInput.addEventListener("input", () => {
  const remaining = Math.max(0, 200 - promptInput.value.length);
  charCounter.textContent = remaining;
  charCounter.classList.toggle("warn", remaining <= 20 && remaining > 0);
  charCounter.classList.toggle("over", remaining === 0);
});

// ── Duration chips ──
document.querySelectorAll(".chip[data-dur]").forEach((chip) => {
  chip.addEventListener("click", () => {
    selectedDuration = chip.dataset.dur;
    document.querySelectorAll(".chip[data-dur]").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    const customDur = $("#custom-duration");
    if (selectedDuration === "custom") customDur.classList.remove("hidden");
    else customDur.classList.add("hidden");
  });
});

// ── Custom duration slider ──
const customDurSlider = $("#custom-dur-slider");
const customDurValue = $("#custom-dur-value");
function formatDuration(sec) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60); const s = sec % 60;
  return s > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${m}:00`;
}
customDurSlider.addEventListener("input", () => {
  customSeconds = parseInt(customDurSlider.value);
  customDurValue.textContent = formatDuration(customSeconds);
});

// ── Go button ──
$("#btn-go").addEventListener("click", () => {
  if (!selectedMood) return;
  if (currentMode === "custom") {
    const text = $("#prompt-input").value.trim();
    if (text.length < 3) { alert("Describe your scene in a few words"); $("#prompt-input").focus(); return; }
  }
  generate(selectedMood, selectedDuration);
});

// ── Ring progress ──
function setRingProgress(pct) {
  const circle = $("#ring-progress");
  if (!circle) return;
  const c = 2 * Math.PI * 54;
  circle.style.strokeDashoffset = c - (c * pct);
}

// ── Generate ──
async function generate(mood, duration) {
  stopAll();
  setMoodTheme(mood);
  const theme = MOOD_THEMES[mood];
  const isCustom = currentMode === "custom";
  const customPrompt = isCustom ? $("#prompt-input").value.trim() : null;

  $("#gen-emoji").innerHTML = moodIconHTML(mood, false);
  $("#gen-mood-name").textContent = theme.name.toLowerCase() + " experience";

  // Reset all steps
  ["step-enhance", "step-voice", "step-music", "step-cues"].forEach((id) => {
    const el = document.getElementById(id);
    el.classList.remove("done", "step-visible");
    el.classList.add("hidden");
    const badge = el.querySelector(".step-badge");
    if (badge) badge.textContent = "";
    const label = el.querySelector(".step-label");
    if (label) label.dataset.original = label.textContent;
  });

  $("#gen-sub").textContent = isCustom ? "Writing your story..." : "Generating audio layers...";

  setRingProgress(0);
  showScreen("loading");

  const body = { mood, duration };
  if (customPrompt) body.customPrompt = customPrompt;
  if (selectedVoice) body.voice = selectedVoice;
  if (duration === "custom") body.customSeconds = customSeconds;
  if (voiceLang !== "all") body.lang = voiceLang;

  const voiceData = voicesData.find((v) => v.key === selectedVoice);
  const voiceDisplayName = voiceData ? voiceData.name : "";

  let phasesTotal = 3; // voice + music + sfx
  let phasesDone = 0;
  let sfxTotal = 0;
  let sfxDone = 0;
  let resultData = null;

  function updateRing() {
    const enhancePct = isCustom ? 0.25 : 0;
    const audioPct = phasesTotal > 0 ? (phasesDone / phasesTotal) * (1 - enhancePct) : 0;
    setRingProgress(Math.min(enhancePct + audioPct, 0.95));
  }

  function markStep(stepId, status, badgeText) {
    const el = document.getElementById(stepId);
    if (!el) return;
    if (status === "start") {
      el.classList.remove("hidden");
      el.classList.add("step-visible");
      const badge = el.querySelector(".step-badge");
      if (badge) badge.textContent = badgeText || "In progress";
    } else if (status === "done") {
      el.classList.add("done");
      const badge = el.querySelector(".step-badge");
      if (badge) badge.textContent = badgeText || "Done";
    }
  }

  return new Promise((resolve) => {
    // Use fetch + ReadableStream to read SSE from POST
    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (response) => {
      if (!response.ok) {
        alert("Generation failed");
        showScreen("select");
        resolve();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line

        let eventType = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              handleSSE(eventType, data);
            } catch (e) { console.warn("SSE parse error:", e); }
            eventType = null;
          }
        }
      }

      // All done — switch to player
      if (resultData) {
        setRingProgress(1);
        $("#gen-emoji").innerHTML = moodIconHTML(mood, true);
        await new Promise((r) => setTimeout(r, 400));
        setupPlayer(resultData, mood, theme, voiceDisplayName);
      }
      resolve();
    }).catch((err) => {
      alert("Generation failed: " + err.message);
      showScreen("select");
      resolve();
    });

    function handleSSE(event, data) {
      if (event === "phase") {
        const { step, status, count, index, total } = data;

        if (step === "enhance") {
          if (status === "start") {
            markStep("step-enhance", "start", "Writing story...");
            $("#gen-sub").textContent = "AI is writing your story + sound design...";
          } else if (status === "done") {
            markStep("step-enhance", "done", "Story ready");
            setRingProgress(0.25);
          }
        } else if (step === "voice") {
          if (status === "start") markStep("step-voice", "start", "Generating...");
          else if (status === "done") { markStep("step-voice", "done"); phasesDone++; updateRing(); }
        } else if (step === "music") {
          if (status === "start") markStep("step-music", "start", "Composing...");
          else if (status === "done") { markStep("step-music", "done"); phasesDone++; updateRing(); }
        } else if (step === "sfx") {
          if (status === "start") {
            sfxTotal = count || 0;
            markStep("step-cues", "start", `0/${sfxTotal} effects`);
            $("#gen-sub").textContent = "Voice + Music + SFX generating in parallel...";
          } else if (status === "cue-done") {
            sfxDone++;
            const badge = document.querySelector("#step-cues .step-badge");
            if (badge) badge.textContent = `${sfxDone}/${sfxTotal} effects`;
          } else if (status === "done") {
            markStep("step-cues", "done", `${sfxTotal} effects`);
            phasesDone++;
            updateRing();
          }
        }
      } else if (event === "story") {
        // Story text preview available
        console.log(`[MoodCast] Story ready: ${data.text.slice(0, 60)}... (${data.sfxCueCount} SFX cues)`);
      } else if (event === "result") {
        resultData = data;
      } else if (event === "error") {
        alert("Generation failed: " + data.message);
        showScreen("select");
      }
    }
  });
}

function setupPlayer(data, mood, theme, voiceDisplayName) {
  $("#player-emoji").innerHTML = moodIconHTML(mood, true);
  $("#player-title").textContent = theme.name + " · " + data.duration + (voiceDisplayName ? " · " + voiceDisplayName : "");
  $("#story-body").textContent = data.story;
  $("#story-card").classList.add("collapsed");
  if ($("#story-toggle")) $("#story-toggle").classList.remove("active");

  audioVoice = new Audio(data.voice);
  audioMusic = new Audio(data.music);

  audioCues = (data.sfxCues || []).map(cue => ({
    at: cue.at,
    src: cue.src,
    audio: new Audio(cue.src),
    fired: false,
  }));
  audioCues.forEach(c => { c.audio.volume = cueVolume; c.audio.preload = "auto"; });
  console.log(`[MoodCast] Loaded ${audioCues.length} SFX cues:`, audioCues.map(c => `${Math.round(c.at*100)}% → ${c.src}`));

  audioMusic.loop = true;
  audioVoice.volume = parseFloat($("#vol-voice").value);
  audioMusic.volume = parseFloat($("#vol-music").value);

  audioVoice.addEventListener("loadedmetadata", () => {
    $("#time-total").textContent = formatTime(audioVoice.duration);
  });
  audioVoice.addEventListener("timeupdate", () => {
    updateProgress();
  });
  audioVoice.addEventListener("ended", () => {
    if (loopEnabled) {
      audioVoice.currentTime = 0;
      audioVoice.play();
      audioCues.forEach(c => { c.fired = false; });
    }
    else {
        isPlaying = false;
        $("#icon-play").style.display = "block";
        $("#icon-pause").style.display = "none";
        $("#progress-fill").style.width = "100%";
      }
    });

    showScreen("player");
}

function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function updateProgress() {
  if (!audioVoice || !audioVoice.duration) return;
  const pct = (audioVoice.currentTime / audioVoice.duration) * 100;
  $("#progress-fill").style.width = pct + "%";
  $("#time-current").textContent = formatTime(audioVoice.currentTime);
}

// ── Visualizer (fills art-area square) ──
const visCanvas = $("#visualizer");
const visCtx = visCanvas.getContext("2d");

function drawVisualizer() {
  animFrameId = requestAnimationFrame(drawVisualizer);
  const w = visCanvas.width; const h = visCanvas.height;
  visCtx.clearRect(0, 0, w, h);
  if (!isPlaying) return;

  const hue = getComputedStyle(document.documentElement).getPropertyValue("--mood-h").trim() || "260";
  const t = Date.now() / 1000;
  const cx = w / 2; const cy = h / 2;

  // Concentric rings
  for (let ring = 0; ring < 6; ring++) {
    const baseR = 30 + ring * 28;
    const segments = 48;
    visCtx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const wave = Math.sin(t * (1.2 + ring * 0.3) + angle * 3 + ring) * (8 + ring * 3);
      const r = baseR + wave;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) visCtx.moveTo(x, y);
      else visCtx.lineTo(x, y);
    }
    visCtx.closePath();
    const alpha = 0.08 + (1 - ring / 6) * 0.12;
    visCtx.strokeStyle = `hsla(${hue}, 55%, 60%, ${alpha})`;
    visCtx.lineWidth = 1.5;
    visCtx.stroke();
  }

  // Center glow
  const grad = visCtx.createRadialGradient(cx, cy, 0, cx, cy, 60);
  grad.addColorStop(0, `hsla(${hue}, 60%, 65%, 0.12)`);
  grad.addColorStop(1, `hsla(${hue}, 60%, 65%, 0)`);
  visCtx.fillStyle = grad;
  visCtx.fillRect(0, 0, w, h);

  // Floating particles
  for (let i = 0; i < 20; i++) {
    const angle = t * 0.3 + i * 0.314;
    const dist = 40 + Math.sin(t * 0.8 + i * 1.7) * 80;
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;
    const size = 1 + Math.sin(t + i) * 0.5;
    const alpha = 0.15 + Math.sin(t * 1.5 + i * 0.5) * 0.1;
    visCtx.beginPath();
    visCtx.arc(px, py, size, 0, Math.PI * 2);
    visCtx.fillStyle = `hsla(${hue}, 50%, 70%, ${Math.max(0, alpha)})`;
    visCtx.fill();
  }
}
drawVisualizer();

// ── Story toggle ──
const storyToggle = $("#story-toggle");
if (storyToggle) {
  storyToggle.addEventListener("click", () => {
    const card = $("#story-card");
    card.classList.toggle("collapsed");
    storyToggle.classList.toggle("active");
  });
}

// ── Playback ──
$("#btn-play").addEventListener("click", () => { if (isPlaying) pauseAll(); else playAll(); });

$("#btn-loop").addEventListener("click", () => {
  loopEnabled = !loopEnabled;
  $("#btn-loop").classList.toggle("active", loopEnabled);
  if (audioVoice) audioVoice.loop = loopEnabled;
});

function playAll() {
  if (!audioVoice) return;
  audioVoice.play(); audioMusic.play();
  isPlaying = true;
  $("#icon-play").style.display = "none"; $("#icon-pause").style.display = "block";
  startCuePolling();
}

function pauseAll() {
  audioVoice?.pause(); audioMusic?.pause();
  audioCues.forEach(c => c.audio.pause());
  isPlaying = false;
  $("#icon-play").style.display = "block"; $("#icon-pause").style.display = "none";
  stopCuePolling();
}

// Reliable cue triggering via polling (timeupdate can be unreliable at low volume)
let cuePollingId = null;
function startCuePolling() {
  stopCuePolling();
  function poll() {
    if (!isPlaying || !audioVoice || !audioVoice.duration) {
      cuePollingId = requestAnimationFrame(poll);
      return;
    }
    const pct = audioVoice.currentTime / audioVoice.duration;
    for (const cue of audioCues) {
      if (!cue.fired && pct >= cue.at) {
        cue.fired = true;
        cue.audio.volume = cueVolume;
        cue.audio.currentTime = 0;
        console.log(`[MoodCast] 🎬 Cue fired at ${Math.round(pct*100)}%: ${cue.src}`);
        cue.audio.play().catch(e => console.warn("[MoodCast] Cue play failed:", e));
      }
    }
    cuePollingId = requestAnimationFrame(poll);
  }
  cuePollingId = requestAnimationFrame(poll);
}
function stopCuePolling() {
  if (cuePollingId) { cancelAnimationFrame(cuePollingId); cuePollingId = null; }
}

function stopAll() {
  [audioVoice, audioMusic].forEach((a) => { if (a) { a.pause(); a.currentTime = 0; } });
  audioCues.forEach(c => { c.audio.pause(); c.audio.currentTime = 0; c.fired = false; });
  isPlaying = false;
  stopCuePolling();
  if ($("#icon-play")) { $("#icon-play").style.display = "block"; $("#icon-pause").style.display = "none"; }
  $("#progress-fill").style.width = "0%"; $("#time-current").textContent = "0:00";
}

// ── Seek ──
$(".progress-bar-track").addEventListener("click", (e) => {
  if (!audioVoice || !audioVoice.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const seekPct = (e.clientX - rect.left) / rect.width;
  audioVoice.currentTime = seekPct * audioVoice.duration;
  // Reset cue triggers based on new position
  audioCues.forEach(c => {
    c.fired = c.at < seekPct; // Mark past cues as already fired
    if (!c.fired) { c.audio.pause(); c.audio.currentTime = 0; }
  });
});

// ── Volume ──
$("#vol-voice").addEventListener("input", (e) => { if (audioVoice) audioVoice.volume = parseFloat(e.target.value); });
$("#vol-music").addEventListener("input", (e) => { if (audioMusic) audioMusic.volume = parseFloat(e.target.value); });
$("#vol-sfx").addEventListener("input", (e) => { cueVolume = parseFloat(e.target.value); audioCues.forEach(c => { c.audio.volume = cueVolume; }); });

// ── Generate Another ──
$("#btn-back").addEventListener("click", () => {
  stopAll();
  showScreen("select");
});

$("#btn-new").addEventListener("click", () => {
  stopAll();
  setMoodTheme("sleep");
  document.querySelectorAll(".mood-pill").forEach((p) => p.classList.remove("selected"));
  $("#config-panel").classList.add("hidden");
  selectedMood = null; selectedDuration = "medium"; selectedVoice = null;
  voiceSearchQuery = ""; voiceCategory = "all"; voiceGenderFilter = "all"; voiceLang = "all";
  voiceFiltersOpen = false;
  filterSubTab = "type";
  libraryResults = [];
  document.querySelectorAll(".chip[data-dur]").forEach((c) => c.classList.remove("active"));
  document.querySelector('.chip[data-dur="medium"]').classList.add("active");
  $("#custom-duration").classList.add("hidden");
  customSeconds = 120; $("#custom-dur-slider").value = 120; $("#custom-dur-value").textContent = "2:00";
  loopEnabled = false; $("#btn-loop").classList.remove("active");
  currentMode = "random";
  document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector('.mode-btn[data-mode="random"]').classList.add("active");
  $(".mode-toggle").dataset.active = "random";
  $("#prompt-input-wrap").classList.add("hidden");
  $("#prompt-input").value = ""; $("#char-counter").textContent = "200";
  $("#char-counter").classList.remove("warn", "over");
  // Reset tabs
  document.querySelectorAll(".cfg-tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".cfg-content").forEach((c) => c.classList.remove("active"));
  document.querySelector('.cfg-tab[data-tab="story"]').classList.add("active");
  document.getElementById("tab-story").classList.add("active");
  showScreen("select");
});
