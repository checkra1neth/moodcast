# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Long Duration Estimate Mismatch
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the formula produces incorrect estimates for slow-speech moods
  - **Scoped PBT Approach**: Scope the property to long-duration stories with speed < 1.0 (sleep at 0.75, relax at 0.85)
  - Test that `estimateVoiceDurationMs(text, speed)` with corrected formula (`140 / speed`) produces estimates where `estimate + bufferMs` falls within 45000-65000ms for all long stories
  - Import `estimateVoiceDurationMs` from server.mjs (or replicate the formula logic in test) and STORIES from stories.mjs
  - For each mood's long stories, calculate: `wordCount / (140 / speed) * 60 * 1000 + bufferMs` and assert result >= 45000ms
  - Run test on UNFIXED code - expect FAILURE (current formula uses `140 * speed` and stories have insufficient words)
  - Document counterexamples: sleep long stories (~91 words) at speed 0.75 produce estimate + buffer ≈ 64s with buggy formula but only ~41s with correct formula (insufficient words)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 2.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Short and Medium Duration Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: For all mood/short combinations on unfixed code, `estimateVoiceDurationMs` + buffer produces values in acceptable short-duration range
  - Observe: For all mood/medium combinations on unfixed code, `estimateVoiceDurationMs` + buffer produces values in acceptable medium-duration range
  - Write property-based test: for all moods at short duration, total estimate (voice + buffer) is between 10000ms and 30000ms
  - Write property-based test: for all moods at medium duration, total estimate (voice + buffer) is between 25000ms and 50000ms
  - Verify voice settings (voiceId, stability, similarityBoost, speed) are unchanged in MOODS config
  - Verify tests pass on UNFIXED code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix duration mismatch bug

  - [x] 3.1 Fix `estimateVoiceDurationMs` formula in server.mjs
    - Change `const wordsPerMinute = 140 * speed` to `const wordsPerMinute = 140 / speed`
    - Update the comment to: "speed < 1 = slower speech = fewer WPM = longer duration"
    - _Bug_Condition: isBugCondition(input) where speed ≠ 1.0 and duration == "long"_
    - _Expected_Behavior: estimateVoiceDurationMs produces accurate estimates where lower speed = longer duration_
    - _Preservation: Short/medium durations remain in acceptable ranges_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Expand sleep "long" stories in stories.mjs (~91 → ~130 words each)
    - Expand both sleep long stories to approximately 130-140 words
    - Maintain the same tone, imagery, and narrative style
    - Keep musicPrompt and sfxPrompt unchanged
    - Target: `130 / (140/0.75) * 60 + 12 = ~54s` total with buffer
    - _Requirements: 2.3_

  - [x] 3.3 Expand relax "long" stories in stories.mjs (~103 → ~150 words each)
    - Expand both relax long stories to approximately 150-160 words
    - Maintain the same tone, imagery, and narrative style
    - Keep musicPrompt and sfxPrompt unchanged
    - Target: `150 / (140/0.85) * 60 + 12 = ~67s` — adjust to ~137-150 words for 50-55s target
    - _Requirements: 2.4_

  - [x] 3.4 Expand focus "long" stories in stories.mjs (~115 → ~130 words each)
    - Expand both focus long stories to approximately 125-135 words
    - Maintain the same tone, imagery, and narrative style
    - Keep musicPrompt and sfxPrompt unchanged
    - Target: `130 / (140/0.95) * 60 + 12 = ~65s` — adjust to ~123-130 words for 50-55s
    - _Requirements: 2.4_

  - [ ] 3.5 Verify energy "long" stories need no changes (~133 words)
    - Confirm energy long stories at speed 1.1: `133 / (140/1.1) * 60 + 12 = ~75s` — already exceeds target
    - No content changes needed for energy mood
    - _Requirements: 3.2_

  - [ ] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Long Duration Produces Target Length Audio
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the formula fix + story expansion produces correct estimates
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Short and Medium Duration Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all short/medium durations still produce acceptable estimates after formula change

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run full test suite and confirm all property tests pass
  - Manually verify with `node -e` that estimateVoiceDurationMs produces correct values for each mood/long combination
  - Ensure all tests pass, ask the user if questions arise
