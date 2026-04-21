# Implementation Plan: Custom Prompt Enhance

## Overview

Implementation of the "Custom Prompt" mode for MoodCast. The user enters a short prompt, the system expands it into a full story via an ElevenLabs Conversational AI Agent (text-only WebSocket), then passes the result to the existing Audio Pipeline. Four files: new `enhance.mjs`, changes to `server.mjs`, `public/app.js`, `public/index.html`.

## Tasks

- [x] 1. Create `enhance.mjs` module with core enhancement logic
  - [x] 1.1 Implement `calculateWordBudget(mood, duration)` function
    - Import `MOODS` from `moods.mjs` and target duration table (short=17, medium=32, long=52)
    - Formula: `Math.round((targetDurationSec × 140 × speed) / 60)`
    - Export function for testing
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.2 Implement `parseAgentResponse(rawText)` function
    - Attempt `JSON.parse(rawText)` for clean JSON
    - Fallback: search for `{...}` in text via regex and parse the found fragment
    - Validate presence of fields `text`, `musicPrompt`, `sfxPrompt` (non-empty strings)
    - Throw error "Failed to parse AI response" on failure
    - Export function for testing
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 1.3 Implement `ensureAgent()` function with lazy agent initialization
    - Use `ElevenLabsClient` to create agent via REST API (`client.conversationalAi.agents.create`)
    - Configuration: `text_only: true`, `llm: "gemini-2.0-flash"`, `temperature: 0.7`, system prompt from design
    - Cache `agentId` in module variable
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 1.4 Implement `chatWithAgent(agentId, message)` function via WebSocket
    - Connect to `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=...`
    - Handle `conversation_initiation_metadata` → send `user_message`
    - Collect `agent_response` events, handle `ping/pong`
    - 15-second timeout, close session after receiving response
    - _Requirements: 5.1, 5.2, 5.3, 8.1_

  - [x] 1.5 Implement main `enhancePrompt(userPrompt, mood, duration)` function
    - Call `calculateWordBudget`, `ensureAgent`, format agent message
    - Call `chatWithAgent`, parse response via `parseAgentResponse`
    - Return Story_Object `{ text, musicPrompt, sfxPrompt }`
    - _Requirements: 5.4, 5.5, 5.6, 8.2_

- [x] 2. Checkpoint — verify enhance.mjs
  - Ensure module exports `enhancePrompt`, `calculateWordBudget`, `parseAgentResponse`
  - Ensure no syntax errors
  - Ask user if anything is unclear

- [x] 3. Integrate enhance.mjs into server.mjs
  - [x] 3.1 Add routing by `customPrompt` in `/api/generate` endpoint
    - Import `enhancePrompt` from `./enhance.mjs`
    - If `req.body.customPrompt` is present — call `enhancePrompt()` instead of `pick(storyPool)`
    - If `customPrompt` is absent — leave existing logic unchanged
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 3.2 Add error handling for custom path
    - Wrap `enhancePrompt` call in try/catch
    - On error return HTTP 500 with `{ error, details }`
    - Response format identical to existing: `{ story, mood, duration, voice, music, sfx }`
    - _Requirements: 7.4, 7.5, 6.1, 6.2, 6.3_

- [x] 4. Update UI — index.html and app.js
  - [x] 4.1 Add Mode_Selector and Prompt_Input to `public/index.html`
    - Toggle "Random Story" / "Custom Prompt" after mood-grid
    - Text field with placeholder "a walk through rainy Tokyo at night"
    - Character counter
    - "Enhancing your prompt" step in loading section (before three existing steps)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 10.1_

  - [x] 4.2 Add Mode_Selector and Prompt_Input logic to `public/app.js`
    - Mode switching: show/hide Prompt_Input
    - Validation: minimum 3 characters, maximum 200, truncation, remaining character counter
    - Pass `customPrompt` in POST request in Custom mode
    - Display "Enhancing your prompt" step on loading screen (only in custom mode)
    - Mark step as complete after receiving server response
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 10.1, 10.2, 10.3, 8.3_

- [x] 5. Checkpoint — full integration
  - Ensure all files have no errors
  - Ensure existing Random Story mode is not broken
  - Ask user if anything is unclear

- [x] 6. Tests
  - [x] 6.1 Install fast-check (`npm install --save-dev fast-check`)
    - _Requirements: all property tests_

  - [ ]* 6.2 Property test: prompt length validation
    - **Property 1: Prompt Length Validation**
    - For arbitrary strings: accept 3–200 characters, reject others; whitespace-only strings with < 3 non-whitespace chars — reject
    - **Validates: Requirements 2.1, 2.3, 2.4**

  - [ ]* 6.3 Property test: character counter correctness
    - **Property 2: Character Counter Correctness**
    - For strings 0–300 characters: counter = `max(0, 200 - length)`
    - **Validates: Requirements 2.5**

  - [ ]* 6.4 Property test: Word Budget calculation
    - **Property 3: Word Budget Calculation**
    - For all mood × duration combinations: result = `Math.round((targetDurationSec × 140 × speed) / 60)`
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 6.5 Property test: agent message completeness
    - **Property 4: Agent Message Completeness**
    - For arbitrary prompt, mood, and word budget: message contains all three components
    - **Validates: Requirements 5.2**

  - [ ]* 6.6 Property test: Story_Object round-trip parsing
    - **Property 5: Story_Object Round-Trip Parsing**
    - For arbitrary valid Story_Object: `parseAgentResponse(JSON.stringify(obj))` === obj
    - **Validates: Requirements 9.2, 9.5**

  - [ ]* 6.7 Property test: JSON extraction from wrapped text
    - **Property 6: JSON Extraction from Wrapped Text**
    - For arbitrary Story_Object wrapped in text without `{}`/`}`: parsing succeeds
    - **Validates: Requirements 9.3**

- [x] 7. Final checkpoint
  - Ensure all tests pass
  - Ask user if anything is unclear

## Notes

- Tasks marked with `*` are optional (property tests), can be skipped to speed up MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Implementation language: JavaScript (Node.js, ES modules, .mjs)
- PBT library: fast-check
