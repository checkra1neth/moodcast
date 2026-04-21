# MoodCast — Tasks

## Task 1: Project Setup and Dependencies
- [x] Update package.json: add express
- [x] Create folder structure: public/, public/audio/
- [x] Create .gitignore for public/audio/

## Task 2: Mood Configurations and Stories
- [x] Create moods.mjs with 4 mood configurations (voices, music and SFX prompts)
- [x] Create stories.mjs with 5 story templates per mood

## Task 3: Backend — Express Server and API
- [x] Create server.mjs with Express
- [x] Implement POST /api/generate:
  - Accepts { mood }
  - Picks a random story
  - Calls ElevenLabs TTS, Music, SFX in parallel
  - Saves files to public/audio/
  - Returns file paths and story text
- [x] Static serving of public/

## Task 4: Frontend — UI
- [x] Create public/index.html with markup (mood cards, player, states)
- [x] Create public/style.css (dark theme, cards, animations, responsiveness)
- [x] Create public/app.js (selection logic, API requests, player management)

## Task 5: Audio Player with 3 Layers
- [x] Implement synchronized playback of 3 audio tracks (voice + music + sfx)
- [x] Volume control: voice 1.0, music 0.3, sfx 0.2
- [x] Play/Pause and Stop buttons
- [x] "Generate Another" button
