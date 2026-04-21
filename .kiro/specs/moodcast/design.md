# MoodCast — Design

## Architecture

```
┌─────────────────────────────────────┐
│           Browser (Client)          │
│  ┌───────────┐  ┌────────────────┐  │
│  │ Mood Cards│  │  Audio Player  │  │
│  └─────┬─────┘  └───────▲────────┘  │
│        │                │           │
│        ▼                │           │
│  POST /api/generate     │           │
│        │          GET /api/audio    │
└────────┼────────────────┼───────────┘
         │                │
┌────────▼────────────────┼───────────┐
│        Express Server               │
│  ┌─────────────────────────────┐    │
│  │    /api/generate endpoint   │    │
│  │                             │    │
│  │  1. Pick story template     │    │
│  │  2. Parallel API calls:     │    │
│  │     ├─ ElevenLabs TTS       │    │
│  │     ├─ ElevenLabs Music     │    │
│  │     └─ ElevenLabs SFX       │    │
│  │  3. Return audio URLs       │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## API Endpoints

### POST /api/generate
Request:
```json
{ "mood": "relax" | "focus" | "energy" | "sleep" }
```

Response:
```json
{
  "story": "story text",
  "voice": "/audio/voice-{id}.mp3",
  "music": "/audio/music-{id}.mp3",
  "sfx": "/audio/sfx-{id}.mp3"
}
```

The server generates 3 audio files in parallel (Promise.all), saves them to /public/audio/, and returns the paths.

### GET /audio/:filename
Static serving of generated audio files.

## Mood Configurations

| Mood | Voice ID | Voice Style | Music Prompt | SFX Prompt |
|------|----------|-------------|--------------|------------|
| Relax | EXAVITQu4vr4xnSDxMaL (Sarah) | stability: 0.7, speed: 0.85 | "Gentle ambient piano with soft pads and warm reverb" | "Soft rain falling on leaves with distant thunder" |
| Focus | onwK4e9ZLuTAKqWW03F9 (Daniel) | stability: 0.8, speed: 0.95 | "Minimal lo-fi beats with soft Rhodes piano" | "Quiet coffee shop ambience with soft murmur" |
| Energy | JBFqnCBsd6RMkjVDRZzb (George) | stability: 0.5, speed: 1.1 | "Upbeat electronic track with driving synth bass" | "City morning sounds with birds and distant traffic" |
| Sleep | XB0fDUnXU5powFXDhCwa (Charlotte) | stability: 0.9, speed: 0.75 | "Dreamy ambient soundscape with slow evolving pads" | "Gentle ocean waves on a calm night beach" |

## Story Templates
5 short story templates per mood (3–5 sentences each). The server randomly picks one. This removes the OpenAI dependency and speeds up generation.

## Frontend UI Flow

1. **Landing** — "MoodCast" heading + subtitle + 4 mood cards
2. **Generating** — card expands, shows 3 progress indicators (Voice, Music, SFX)
3. **Player** — custom audio player with 3 layers (voice, music, sfx), Play/Pause button, Download button
4. **New** — "Generate Another" button returns to selection

## Audio Playback Strategy
The browser plays 3 audio elements simultaneously:
- Voice: volume 1.0
- Music: volume 0.3
- SFX: volume 0.2

All three start synchronously on Play press.

## File Structure
```
├── server.mjs              # Express server + API
├── public/
│   ├── index.html          # SPA
│   ├── style.css           # Styles
│   ├── app.js              # Client logic
│   └── audio/              # Generated files (gitignored)
├── stories.mjs             # Story templates by mood
├── moods.mjs               # Mood configurations (voices, prompts)
├── package.json
```
