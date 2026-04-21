# Bugfix Requirements Document

## Introduction

When a user selects the "Extended (~1 min)" duration option in MoodCast, the generated audio is only ~23 seconds instead of the expected ~50-60 seconds. This is caused by two compounding issues: (1) the `estimateVoiceDurationMs` function uses an inverted speed formula (`140 * speed` instead of `140 / speed`), causing duration underestimation for slow-speech moods, and (2) the "long" stories have insufficient word counts to produce ~1 minute of audio at the configured speech speeds.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN speed < 1.0 (e.g., relax at 0.85, sleep at 0.75) THEN the system calculates a SHORTER estimated duration than actual TTS output because `wordsPerMinute = 140 * speed` incorrectly reduces WPM for slow speech, yielding an underestimated voice duration

1.2 WHEN the voice duration estimate is too low THEN the system requests music and sound effects with durations that are too short (musicLengthMs and sfxDurationSec are derived from the underestimated voice duration)

1.3 WHEN duration "long" is selected for sleep mood (speed 0.75, ~91 words) THEN the system produces only ~23 seconds of audio instead of the target ~50-55 seconds because the story text does not contain enough words for the target duration at that speech speed

1.4 WHEN duration "long" is selected for relax mood (speed 0.85, ~103 words) THEN the system produces audio significantly shorter than the target ~50-55 seconds due to insufficient word count combined with the inverted formula

### Expected Behavior (Correct)

2.1 WHEN speed < 1.0 THEN the system SHALL calculate voice duration using `wordsPerMinute = 140 / speed` so that slower speech correctly results in a LONGER estimated duration

2.2 WHEN the voice duration estimate is corrected THEN the system SHALL request music and sound effects with durations that match the corrected voice duration plus buffer

2.3 WHEN duration "long" is selected for sleep mood THEN the system SHALL produce audio of approximately 50-55 seconds by using stories with sufficient word count (~70 words at speed 0.75 yields ~36s, so stories need ~100-110 words to reach target)

2.4 WHEN duration "long" is selected for relax mood THEN the system SHALL produce audio of approximately 50-55 seconds by using stories with sufficient word count for the configured speech speed

### Unchanged Behavior (Regression Prevention)

3.1 WHEN speed = 1.0 (no mood currently uses this, but as a baseline) THEN the system SHALL CONTINUE TO calculate voice duration as `words / 140` minutes

3.2 WHEN speed > 1.0 (energy mood at 1.1) THEN the system SHALL CONTINUE TO produce correctly-timed audio (the formula change from `140 * speed` to `140 / speed` affects fast speech too, but energy stories are already calibrated with enough words)

3.3 WHEN duration "short" or "medium" is selected THEN the system SHALL CONTINUE TO produce audio at approximately the same target durations (~15-20s for short, ~30-35s for medium)

3.4 WHEN any mood is selected THEN the system SHALL CONTINUE TO generate all three audio layers (voice, music, sfx) in parallel and return valid audio file paths

3.5 WHEN any mood is selected THEN the system SHALL CONTINUE TO use the correct voice ID, stability, similarity boost, and speed settings from the mood configuration
