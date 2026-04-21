# MoodCast — Requirements

## Problem Statement
People are tired of repetitive audio content: the same playlists, recycled meditations, cookie-cutter podcasts. There is no tool that generates a unique, personalized audio experience tailored to your mood — different every time.

## Target User
Anyone who listens to podcasts, meditations, or ambient music for focus/relaxation/sleep. Especially: remote workers, students, people with anxiety.

## Solution
A web app where the user picks a mood → AI generates a unique short story → narrates it with voice → adds background music and atmospheric sound effects. The result is a personal audio track of 1–2 minutes, unique every time.

## User Stories

### US-1: Mood Selection
GIVEN the user opens the app
WHEN they see the mood selection screen
THEN 4 cards are displayed: Focus, Relax, Energy, Sleep
AND each card has an icon and a short description

### US-2: Audio Story Generation
GIVEN the user has selected a mood
WHEN they tap on a card
THEN the system generates in parallel:
  - A short story/script text via LLM (OpenAI or built-in prompt)
  - Background music via ElevenLabs Music API
  - An atmospheric sound effect via ElevenLabs Sound Effects API
AND shows generation progress

### US-3: Story Narration
GIVEN the story text has been generated
WHEN the system receives the text
THEN it narrates it via ElevenLabs TTS API with an appropriate voice and settings
AND the voice is matched to the mood (calm for Relax/Sleep, energetic for Energy)

### US-4: Playback
GIVEN all audio components are ready
WHEN generation is complete
THEN the user sees a player with a Play button
AND can listen to the final mix (voice + music + effects)
AND can download the result

## Non-Functional Requirements
- Generation time: < 30 seconds
- Support: modern browsers (Chrome, Firefox, Safari)
- No registration required
- Mobile-responsive UI

## Tech Stack
- Frontend: HTML + CSS + Vanilla JS (minimal stack for hackathon)
- Backend: Node.js (Express)
- APIs: ElevenLabs (TTS, Music, Sound Effects)
- Story text: pre-written templates with variations (no OpenAI dependency)

## ElevenLabs API Usage
- **TTS**: `eleven_flash_v2_5` model, voices matched to mood
- **Music**: `client.music.compose()` with mood-specific prompts
- **Sound Effects**: `POST /v1/sound-generation` with atmospheric prompts

## Differentiation
- Combination of 3 ElevenLabs APIs in one product (TTS + Music + SFX)
- Every result is unique — no repetitions
- Instant wow-effect in demo
