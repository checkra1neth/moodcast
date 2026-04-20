// Mood configurations: voice settings + voice options
// Each mood has a default voice and an alternative voice for user choice

export const DURATIONS = {
  short:  { label: "Short",  seconds: 20,  storyLen: "short",  bufferMs: 5000 },
  medium: { label: "Medium", seconds: 35,  storyLen: "medium", bufferMs: 8000 },
  long:   { label: "Long",   seconds: 60,  storyLen: "long",   bufferMs: 12000 },
  custom: { label: "Custom", seconds: null, storyLen: null,     bufferMs: 10000 },
};

// Available voices for user selection
export const VOICES = {
  sarah:     { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah",     gender: "female", style: "Soft & gentle" },
  charlotte: { id: "XB0fDUnXU5powFXDhCwa",  name: "Charlotte", gender: "female", style: "Warm & dreamy" },
  daniel:    { id: "onwK4e9ZLuTAKqWW03F9",  name: "Daniel",    gender: "male",   style: "Clear & steady" },
  george:    { id: "JBFqnCBsd6RMkjVDRZzb",  name: "George",    gender: "male",   style: "Bold & narrative" },
};

export const MOODS = {
  relax: {
    label: "Relax",
    emoji: "🌿",
    defaultVoice: "sarah",
    voiceSettings: {
      stability: 0.6,
      similarityBoost: 0.75,
      style: 0.25,
      useSpeakerBoost: true,
      speed: 0.85,
    },
  },
  focus: {
    label: "Focus",
    emoji: "🎯",
    defaultVoice: "daniel",
    voiceSettings: {
      stability: 0.75,
      similarityBoost: 0.8,
      style: 0.1,
      useSpeakerBoost: true,
      speed: 0.95,
    },
  },
  energy: {
    label: "Energy",
    emoji: "⚡",
    defaultVoice: "george",
    voiceSettings: {
      stability: 0.3,
      similarityBoost: 0.7,
      style: 0.55,
      useSpeakerBoost: true,
      speed: 1.1,
    },
  },
  sleep: {
    label: "Sleep",
    emoji: "🌙",
    defaultVoice: "charlotte",
    voiceSettings: {
      stability: 0.85,
      similarityBoost: 0.8,
      style: 0.1,
      useSpeakerBoost: true,
      speed: 0.75,
    },
  },
};
