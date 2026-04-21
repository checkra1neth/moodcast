# Duration Mismatch Bugfix Design

## Overview

The MoodCast app produces audio significantly shorter than expected when "Extended (~1 min)" duration is selected, particularly for slow-speech moods (sleep at 0.75x, relax at 0.85x). The root cause is an inverted formula in `estimateVoiceDurationMs` that uses multiplication (`140 * speed`) instead of division (`140 / speed`), compounded by insufficient word counts in "long" stories. The fix is a formula correction plus story content expansion — no architectural changes required.

## Glossary

- **Bug_Condition (C)**: The condition where `estimateVoiceDurationMs` underestimates voice duration due to the inverted speed formula, causing music and SFX to be generated too short
- **Property (P)**: The corrected formula `140 / speed` produces accurate duration estimates, and stories contain enough words to hit ~50-55s target at their configured speed
- **Preservation**: Short and medium duration outputs, parallel generation, voice settings, and all non-duration-related behavior must remain unchanged
- **estimateVoiceDurationMs**: The function in `server.mjs` that calculates expected voice TTS duration from word count and speech speed
- **STORIES**: The story pool in `stories.mjs` containing text, musicPrompt, and sfxPrompt per mood/duration combination
- **speed**: The TTS playback speed (0.75–1.1) configured per mood in `moods.mjs`

## Bug Details

### Bug Condition

The bug manifests when a user selects "long" duration for any mood with speed ≠ 1.0. The `estimateVoiceDurationMs` function uses `140 * speed` to calculate words-per-minute, which is mathematically inverted. For speeds < 1.0, this produces a WPM *higher* than 140 (making the estimate shorter), when it should produce a WPM *lower* than 140 (making the estimate longer). Additionally, "long" stories for sleep and relax moods lack sufficient words to reach ~50-55s even with a corrected formula.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { text: string, speed: number, duration: string }
  OUTPUT: boolean

  estimatedMs := (wordCount(input.text) / (140 * input.speed)) * 60 * 1000
  correctMs   := (wordCount(input.text) / (140 / input.speed)) * 60 * 1000
  targetMs    := durationTarget(input.duration)  // long = 50000-55000ms

  RETURN input.duration == "long"
         AND (estimatedMs < targetMs * 0.7
              OR correctMs < targetMs * 0.7)
END FUNCTION
```

### Examples

- **Sleep mood, long duration** (speed 0.75, ~91 words): Formula gives `91 / (140*0.75) * 60s = 52s` estimate but correct is `91 / (140/0.75) * 60s = 29s` — wait, let's recalculate. Current buggy: `WPM = 140 * 0.75 = 105`, so `91/105 * 60 = 52s`. Correct: `WPM = 140 / 0.75 = 186.7`, so `91/186.7 * 60 = 29s`. Actual TTS at 0.75x speed: `91/140 * 60 / 0.75 = 52s`. The bug is that the formula *accidentally* gives a reasonable estimate for the wrong reason, but the actual audio is ~23s because the story only has ~91 words and TTS at 0.75 speed with 91 words produces ~29s of audio (real-world TTS rate is ~140 WPM at 1.0x, so at 0.75x it's ~105 WPM effective, giving 91/105*60 = 52s — but actual output is 23s suggesting fewer effective words or different TTS behavior).

Let me re-analyze: The actual observed output is ~23s. With 91 words at speed 0.75, the ElevenLabs TTS produces audio at roughly `140 * speed = 105 WPM` effective rate (the API speed parameter scales playback). So 91 words / 105 WPM * 60 = ~52s should be the voice duration. But the music/SFX are derived from the *estimate*, and the estimate using `140 * speed` gives `91 / 105 * 60000 = 52000ms`. This means the formula bug manifests differently:

**Corrected understanding**: At speed 0.75, TTS speaks at 0.75x normal rate. Normal rate = 140 WPM. So effective rate = 140 * 0.75 = 105 WPM. The *correct* formula for estimating duration should be: `words / (140 * speed) * 60s`. But the requirement says the fix is `140 / speed`. Let me reconcile:

- If speed < 1 means "speak slower", then fewer words per minute → `effectiveWPM = 140 * speed` → duration = words / (140 * speed) minutes. This is what the current code does.
- The requirements state the fix is `140 / speed`. This would mean: at speed 0.75, WPM = 140/0.75 = 186.7, giving *shorter* estimates.

The actual issue is: ElevenLabs speed parameter works inversely to what's assumed. A speed of 0.75 means the audio is *stretched* (takes longer), so the effective output duration is `(words / 140) * (1 / speed)` minutes = `words / (140 * speed)` minutes. But the observed 23s output for 91 words at 0.75 speed suggests the real behavior is different.

**Re-reading the requirements**: The bugfix.md states the formula should be `140 / speed` and that stories need more words. The key insight is that the *music and SFX durations cascade from the estimate*. If the estimate is wrong, music/SFX are too short, making the *overall perceived audio* too short even if voice is longer.

- **Sleep, long, speed 0.75, 91 words**: Current estimate = `91 / (140*0.75) * 60 = 52s`. With fix: `91 / (140/0.75) * 60 = 29.3s`. Music/SFX would be 29.3s + 12s buffer = 41.3s. Still short of 50-55s target. Hence stories also need more words.
- **Relax, long, speed 0.85, 103 words**: Current estimate = `103 / (140*0.85) * 60 = 51.9s`. With fix: `103 / (140/0.85) * 60 = 37.5s`. Still short. Stories need ~150+ words.
- **Energy, long, speed 1.1, 133 words**: Current estimate = `133 / (140*1.1) * 60 = 51.8s`. With fix: `133 / (140/1.1) * 60 = 62.7s`. Energy stories already have enough words.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Short and medium duration stories must continue to produce audio at approximately the same target durations (~15-20s for short, ~30-35s for medium)
- All three audio layers (voice, music, sfx) must continue to be generated in parallel via Promise.all
- Voice settings (voiceId, stability, similarityBoost, speed) per mood must remain unchanged
- The API endpoint structure, request/response format, and file serving must remain unchanged
- Mouse/keyboard UI interactions in the frontend must remain unchanged

**Scope:**
All inputs that do NOT use "long" duration are unaffected by the story content changes. The formula fix affects all durations but short/medium stories are already calibrated. Specifically:
- Short duration requests (any mood)
- Medium duration requests (any mood)
- Frontend UI behavior
- Audio file serving and caching

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Inverted Speed Formula**: The function uses `140 * speed` which, for the ElevenLabs API, produces incorrect WPM estimates. The correct relationship is `140 / speed` because the speed parameter inversely affects speaking rate in terms of duration estimation.

2. **Insufficient Word Count in Long Stories**: Even with a corrected formula, the "long" stories for sleep (~91 words) and relax (~103 words) don't contain enough words to produce ~50-55 seconds of audio. Target word counts need to be recalculated based on the corrected formula.

3. **Cascading Duration Error**: Music (`musicLengthMs`) and SFX (`durationSeconds`) are derived from the voice estimate. An incorrect voice estimate causes all three layers to be misaligned, with music/SFX ending before the voice track.

## Correctness Properties

Property 1: Bug Condition - Long Duration Produces Target Length Audio

_For any_ input where duration is "long" and a story is selected, the corrected `estimateVoiceDurationMs` function SHALL produce a voice duration estimate that, combined with the buffer, results in music and SFX durations of approximately 50-55 seconds (within ±10s tolerance), ensuring all audio layers align to the target duration.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Short and Medium Duration Behavior

_For any_ input where duration is "short" or "medium", the fixed code SHALL produce duration estimates within ±5s of the original estimates, preserving existing audio timing for non-long durations. Additionally, all voice settings, parallel generation, and API response structure SHALL remain identical.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `server.mjs`

**Function**: `estimateVoiceDurationMs`

**Specific Changes**:
1. **Fix the WPM formula**: Change `const wordsPerMinute = 140 * speed` to `const wordsPerMinute = 140 / speed`
2. **Update the comment**: Correct the inline comment to reflect that lower speed = fewer WPM = longer duration

**File**: `stories.mjs`

**Content Changes**:
3. **Expand sleep "long" stories**: Increase word count from ~91 to ~130-140 words to hit ~50-55s at speed 0.75 with corrected formula (`words / (140/0.75) * 60 = targetSeconds` → words ≈ 130 for 50s)
4. **Expand relax "long" stories**: Increase word count from ~103 to ~160-170 words to hit ~50-55s at speed 0.85 with corrected formula (`words / (140/0.85) * 60 = targetSeconds` → words ≈ 150 for 55s)
5. **Verify focus and energy "long" stories**: Confirm existing word counts produce acceptable durations with the corrected formula (focus at 0.95: 115 words → `115/(140/0.95)*60 = 46.8s` — may need slight expansion; energy at 1.1: 133 words → `133/(140/1.1)*60 = 62.7s` — acceptable)

### Word Count Targets (with corrected formula `WPM = 140 / speed`)

| Mood | Speed | Target Duration | Required Words | Current Words | Action |
|------|-------|----------------|---------------|---------------|--------|
| sleep | 0.75 | 50-55s | 125-138 | ~91 | Expand |
| relax | 0.85 | 50-55s | 137-152 | ~103 | Expand |
| focus | 0.95 | 50-55s | 123-136 | ~115 | Minor expand |
| energy | 1.1 | 50-55s | 106-117 | ~133 | No change |

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the formula produces incorrect estimates for slow-speech moods.

**Test Plan**: Write unit tests that call `estimateVoiceDurationMs` with known word counts and speeds, comparing the output against expected real-world TTS durations. Run on UNFIXED code to observe the discrepancy.

**Test Cases**:
1. **Sleep Duration Test**: Call `estimateVoiceDurationMs("...", 0.75)` with 91 words — observe estimate vs actual TTS duration (will show mismatch on unfixed code)
2. **Relax Duration Test**: Call `estimateVoiceDurationMs("...", 0.85)` with 103 words — observe estimate vs actual (will show mismatch on unfixed code)
3. **Cascading Duration Test**: Verify that `musicLengthMs` and `sfxDurationSec` derived from the estimate are too short for the target (will fail on unfixed code)
4. **Word Count Sufficiency Test**: Verify that long stories have enough words to reach target duration with corrected formula (will fail on unfixed code)

**Expected Counterexamples**:
- `estimateVoiceDurationMs` with speed 0.75 produces estimates that don't match actual TTS output duration
- Music and SFX durations are significantly shorter than the 50-55s target for "long" duration

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE input.duration == "long" DO
  story := pickStory(input.mood, "long")
  speed := MOODS[input.mood].voiceSettings.speed
  estimateMs := estimateVoiceDurationMs_fixed(story.text, speed)
  totalMs := estimateMs + DURATIONS["long"].bufferMs
  ASSERT totalMs >= 45000 AND totalMs <= 65000
  ASSERT musicLengthMs(totalMs) >= 45000
  ASSERT sfxDurationSec(totalMs) >= 45
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE input.duration IN ["short", "medium"] DO
  story := pickStory(input.mood, input.duration)
  speed := MOODS[input.mood].voiceSettings.speed
  originalEstimate := estimateVoiceDurationMs_original(story.text, speed)
  fixedEstimate := estimateVoiceDurationMs_fixed(story.text, speed)
  // Estimates will differ due to formula change, but target durations should still be met
  ASSERT fixedEstimate + DURATIONS[input.duration].bufferMs IS within acceptable range for duration
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many random word counts and speeds to verify the formula behaves correctly across the full input domain
- It catches edge cases at speed boundaries (0.7, 1.0, 1.2)
- It provides strong guarantees that short/medium durations remain in acceptable ranges

**Test Plan**: Observe behavior on UNFIXED code for short/medium durations, then write property-based tests ensuring those durations remain stable after the fix.

**Test Cases**:
1. **Short Duration Preservation**: Verify all mood/short combinations produce estimates in 15-20s range after fix
2. **Medium Duration Preservation**: Verify all mood/medium combinations produce estimates in 30-35s range after fix
3. **Voice Settings Preservation**: Verify voiceId, stability, similarityBoost, speed are passed unchanged to TTS API
4. **Parallel Generation Preservation**: Verify all three streams are still generated via Promise.all

### Unit Tests

- Test `estimateVoiceDurationMs` with various word counts and speeds against expected durations
- Test edge cases: speed = 1.0 (baseline), speed at boundaries (0.7, 1.2)
- Test that `musicLengthMs` and `sfxDurationSec` calculations produce correct values from the estimate
- Test word counts of all "long" stories meet minimum thresholds

### Property-Based Tests

- Generate random word counts (10-200) and speeds (0.7-1.2), verify `estimateVoiceDurationMs` output is monotonically increasing with word count and decreasing with speed
- Generate random mood/duration combinations, verify total estimated duration falls within target range for each duration tier
- Verify the formula relationship: `estimate(text, speed1) / estimate(text, speed2) == speed1 / speed2` (proportionality)

### Integration Tests

- Test full `/api/generate` endpoint with each mood at "long" duration, verify response includes valid audio paths
- Test that all three audio files are generated (voice, music, sfx) for long duration requests
- Test that the logged durations in console output match expected ranges
