# Requirements Document: Custom Prompt Enhance

## Introduction

MoodCast currently uses hardcoded stories from `stories.mjs`. The user selects a mood and duration — the server randomly picks a pre-written story. This limits personalization: the user cannot influence the story content.

The "Custom Prompt Enhance" feature adds a "Custom" mode where the user writes a short prompt (e.g., "a walk through rainy Tokyo at night" or "a dragon flying over mountains"), selects a mood and duration, and the server "enhances" this prompt — expanding it into a full story text of the required length and generating matching prompts for music and sound effects. The result then passes through the existing ElevenLabs pipeline (TTS + Music + SFX).

## Glossary

- **Prompt_Input** — text field where the user enters a short prompt for a custom story
- **Enhance_Service** — server module that takes the user's short prompt and expands it into a full story object (text + musicPrompt + sfxPrompt)
- **Story_Object** — object with fields `{ text, musicPrompt, sfxPrompt }` used by the existing generation pipeline
- **Word_Budget** — target word count for the story text, calculated based on the selected duration and mood speech speed
- **Audio_Pipeline** — existing parallel audio generation pipeline via ElevenLabs API (TTS + Music + SFX)
- **Mode_Selector** — UI element for switching between pre-written stories mode and custom mode
- **LLM_Provider** — ElevenLabs Conversational AI Agent in text-only (chat) mode, used by Enhance_Service to expand prompts. The agent is created once via the ElevenLabs API with a system prompt for story generation and uses a built-in LLM (e.g., `gemini-2.0-flash`). The server communicates with the agent via a WebSocket session: opens a connection, sends a text message with the user's prompt, receives a text response, and closes the session. This keeps everything within the ElevenLabs ecosystem without external dependencies.

## Requirements

### Requirement 1: Mode Switching

**User Story:** As a user, I want to switch between pre-written stories mode and custom mode, so I can choose between a quick random experience and a personalized story.

#### Acceptance Criteria

1. THE Mode_Selector SHALL display two modes: "Random Story" and "Custom Prompt"
2. WHEN the user selects "Custom Prompt" mode, THE Mode_Selector SHALL show the Prompt_Input and hide the automatic story selection
3. WHEN the user selects "Random Story" mode, THE Mode_Selector SHALL hide the Prompt_Input and restore the default random story behavior
4. THE Mode_Selector SHALL default to "Random Story" mode

### Requirement 2: User Prompt Input

**User Story:** As a user, I want to write a short prompt describing my desired story, so I can get a personalized audio experience.

#### Acceptance Criteria

1. THE Prompt_Input SHALL accept text between 3 and 200 characters
2. THE Prompt_Input SHALL display a placeholder with an example prompt (e.g., "a walk through rainy Tokyo at night")
3. WHEN the user enters text shorter than 3 characters and clicks "Create", THE Prompt_Input SHALL show a validation message "Prompt is too short — describe your scene in a few words"
4. WHEN the user enters text longer than 200 characters, THE Prompt_Input SHALL truncate input to 200 characters and show a character counter
5. THE Prompt_Input SHALL display a remaining character counter while typing

### Requirement 3: Word Budget Calculation

**User Story:** As a system, I want to calculate the target word count for the story based on the selected mood and duration, so the generated text matches the expected audio length.

#### Acceptance Criteria

1. WHEN Enhance_Service receives a request with mood and duration, THE Enhance_Service SHALL calculate Word_Budget using the formula: `targetWords = (targetDurationSec × wordsPerMinute) / 60`, where `wordsPerMinute = 140 × speed`
2. THE Enhance_Service SHALL use speed values from the MOODS configuration for each mood (relax: 0.85, focus: 0.95, energy: 1.1, sleep: 0.75)
3. THE Enhance_Service SHALL use target durations: short — 17 seconds, medium — 32 seconds, long — 52 seconds

### Requirement 4: ElevenLabs Agent Creation and Configuration for Enhancement

**User Story:** As a system, I want to have a pre-configured ElevenLabs Conversational AI Agent in text-only mode, so I can use it as an LLM for expanding prompts into full stories.

#### Acceptance Criteria

1. THE Server SHALL on startup create (or reuse an existing) ElevenLabs Conversational AI Agent named "MoodCast Story Enhancer"
2. THE Agent SHALL be configured in text-only mode (`conversation.text_only: true`) without TTS
3. THE Agent SHALL use a built-in LLM (e.g., `gemini-2.0-flash`) with temperature 0.7
4. THE Agent SHALL have a system prompt instructing it to generate JSON with fields `text`, `musicPrompt`, `sfxPrompt` based on the user's prompt, mood, and target word count
5. THE Server SHALL cache the `agent_id` after creation to avoid creating a new agent on every restart

### Requirement 5: Prompt Enhancement via Agent Chat Session

**User Story:** As a user, I want my short prompt to be expanded into a full story with matching music and sound effects, so I get a quality audio experience without writing a long text.

#### Acceptance Criteria

1. WHEN Enhance_Service receives a short prompt and Word_Budget, THE Enhance_Service SHALL open a WebSocket text-only session with the ElevenLabs Agent
2. THE Enhance_Service SHALL send the agent a text message containing: the user's prompt, target word count (Word_Budget), selected mood, and an instruction to return JSON
3. THE Enhance_Service SHALL receive the agent's text response and close the WebSocket session
4. THE Enhance_Service SHALL return a Story_Object with fields `text`, `musicPrompt`, and `sfxPrompt`
5. THE Enhance_Service SHALL generate story text with a word count within Word_Budget ± 15%
6. WHEN the agent returns text with a word count outside the acceptable range, THE Enhance_Service SHALL accept the result without re-requesting (best-effort approach for hackathon)

### Requirement 6: Integration with Existing Audio Pipeline

**User Story:** As a system, I want to pass the generated Story_Object to the existing audio generation pipeline, so custom stories are processed the same way as pre-written ones.

#### Acceptance Criteria

1. WHEN Enhance_Service returns a Story_Object, THE Audio_Pipeline SHALL process it identically to objects from `stories.mjs` — generating TTS, music, and SFX in parallel
2. THE Audio_Pipeline SHALL calculate music and SFX durations based on the text from Story_Object, using the existing `estimateVoiceDurationMs` function
3. THE Audio_Pipeline SHALL apply voice settings (voiceId, stability, speed) from the MOODS configuration for the selected mood

### Requirement 7: API Endpoint for Custom Generation

**User Story:** As a client, I want to send a request for custom story generation via the API, so I can get an audio experience based on my prompt.

#### Acceptance Criteria

1. THE Server SHALL accept POST requests to `/api/generate` with an additional `customPrompt` field in the request body
2. WHEN the request contains a `customPrompt` field, THE Server SHALL use Enhance_Service instead of picking a random story from `stories.mjs`
3. WHEN the request does not contain a `customPrompt` field, THE Server SHALL use the existing random story selection logic
4. IF Enhance_Service returns an error, THEN THE Server SHALL return HTTP 500 with an error message and a `details` field
5. THE Server SHALL return the response in the same format as for pre-written stories: `{ story, mood, duration, voice, music, sfx }`

### Requirement 8: Agent Error Handling

**User Story:** As a user, I want to receive a clear error message if custom story generation fails, so I understand what happened and can try again.

#### Acceptance Criteria

1. IF the ElevenLabs Agent is unavailable or the WebSocket session ends with an error, THEN THE Enhance_Service SHALL throw an error with a descriptive message
2. IF the Agent returns a response that cannot be parsed into a Story_Object, THEN THE Enhance_Service SHALL throw an error "Failed to parse AI response"
3. WHEN custom story generation fails, THE Client SHALL display an error message and return the user to the selection screen

### Requirement 9: Agent Response Parsing into Story_Object

**User Story:** As a system, I want to reliably parse the LLM response into a structured Story_Object, so the pipeline receives correct data.

#### Acceptance Criteria

1. THE Enhance_Service SHALL instruct the Agent to return the response in JSON format with fields `text`, `musicPrompt`, `sfxPrompt`
2. WHEN the Agent returns valid JSON with three required fields, THE Enhance_Service SHALL create a Story_Object from this JSON
3. IF the Agent response is not valid JSON, THEN THE Enhance_Service SHALL attempt to extract JSON from the response (searching for `{...}` in the text)
4. IF JSON extraction fails, THEN THE Enhance_Service SHALL throw an error "Failed to parse AI response"
5. FOR ALL valid Story_Objects, parsing then serialization then parsing SHALL produce an equivalent object (round-trip property)

### Requirement 10: Custom Mode UI Indication

**User Story:** As a user, I want to see that generation is based on my prompt, so I understand the system is processing my request.

#### Acceptance Criteria

1. WHEN generation is started in Custom mode, THE Client SHALL display an additional step "Enhancing your prompt" on the loading screen before the three existing steps
2. WHEN Enhance_Service completes, THE Client SHALL mark the "Enhancing your prompt" step as complete and begin showing progress for the three audio steps
3. WHEN generation is complete in Custom mode, THE Client SHALL display the generated story text in the player, same as for pre-written stories
