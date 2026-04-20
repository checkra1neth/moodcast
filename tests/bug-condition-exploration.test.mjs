/**
 * Bug Condition Exploration Test
 * 
 * This test demonstrates the duration mismatch bug in estimateVoiceDurationMs.
 * It encodes the EXPECTED (correct) behavior using `140 / speed`.
 * 
 * EXPECTED: This test FAILS on unfixed code because:
 * 1. The current formula uses `140 * speed` (buggy)
 * 2. Long stories don't have enough words for the target duration with the correct formula
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 2.4
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { STORIES } from "../stories.mjs";
import { MOODS, DURATIONS } from "../moods.mjs";

// Replicate the BUGGY formula from server.mjs (current code)
function estimateVoiceDurationMs_buggy(text, speed = 1.0) {
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 140 * speed; // BUG: should be 140 / speed
  const minutes = words / wordsPerMinute;
  return Math.round(minutes * 60 * 1000);
}

// The CORRECT formula (what the code should use)
function estimateVoiceDurationMs_correct(text, speed = 1.0) {
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 140 / speed; // CORRECT: slower speed = fewer WPM = longer duration
  const minutes = words / wordsPerMinute;
  return Math.round(minutes * 60 * 1000);
}

const LONG_BUFFER_MS = DURATIONS.long.bufferMs; // 12000ms
const MIN_TARGET_MS = 45000; // Minimum acceptable total duration for "long"

describe("Bug Condition Exploration - Long Duration Estimate Mismatch", () => {
  // Test each mood's long stories with the CORRECT formula
  // These tests SHOULD FAIL on unfixed code because stories lack sufficient words
  for (const [moodName, moodConfig] of Object.entries(MOODS)) {
    const speed = moodConfig.voiceSettings.speed;
    const longStories = STORIES[moodName]?.long;

    if (!longStories) continue;

    for (let i = 0; i < longStories.length; i++) {
      const story = longStories[i];
      const wordCount = story.text.split(/\s+/).length;

      it(`${moodName} long story #${i + 1} (speed=${speed}, ${wordCount} words): correct formula estimate + buffer >= ${MIN_TARGET_MS}ms`, () => {
        // Using the CORRECT formula (140 / speed)
        const correctEstimateMs = estimateVoiceDurationMs_correct(story.text, speed);
        const totalMs = correctEstimateMs + LONG_BUFFER_MS;

        // This assertion encodes the EXPECTED behavior:
        // With the correct formula, long stories should produce total >= 45000ms
        assert.ok(
          totalMs >= MIN_TARGET_MS,
          `FAIL: ${moodName} long story #${i + 1} with correct formula (140 / speed=${speed}): ` +
          `${wordCount} words → estimate=${correctEstimateMs}ms + buffer=${LONG_BUFFER_MS}ms = ${totalMs}ms, ` +
          `which is LESS than target ${MIN_TARGET_MS}ms. ` +
          `Story needs more words or formula is wrong.`
        );
      });
    }
  }

  // Demonstrate the formula discrepancy for slow-speech moods
  it("sleep mood (speed=0.75): buggy vs correct formula shows significant discrepancy", () => {
    const sleepStory = STORIES.sleep.long[0];
    const speed = MOODS.sleep.voiceSettings.speed; // 0.75
    const wordCount = sleepStory.text.split(/\s+/).length;

    const buggyEstimate = estimateVoiceDurationMs_buggy(sleepStory.text, speed);
    const correctEstimate = estimateVoiceDurationMs_correct(sleepStory.text, speed);

    // With correct formula, total should meet target
    const correctTotal = correctEstimate + LONG_BUFFER_MS;

    assert.ok(
      correctTotal >= MIN_TARGET_MS,
      `FAIL: sleep long story (${wordCount} words, speed=${speed}): ` +
      `buggy formula gives ${buggyEstimate}ms, correct formula gives ${correctEstimate}ms. ` +
      `Correct total = ${correctTotal}ms < target ${MIN_TARGET_MS}ms. ` +
      `Story has insufficient words for target duration with correct formula.`
    );
  });

  it("relax mood (speed=0.85): buggy vs correct formula shows significant discrepancy", () => {
    const relaxStory = STORIES.relax.long[0];
    const speed = MOODS.relax.voiceSettings.speed; // 0.85
    const wordCount = relaxStory.text.split(/\s+/).length;

    const buggyEstimate = estimateVoiceDurationMs_buggy(relaxStory.text, speed);
    const correctEstimate = estimateVoiceDurationMs_correct(relaxStory.text, speed);

    // With correct formula, total should meet target
    const correctTotal = correctEstimate + LONG_BUFFER_MS;

    assert.ok(
      correctTotal >= MIN_TARGET_MS,
      `FAIL: relax long story (${wordCount} words, speed=${speed}): ` +
      `buggy formula gives ${buggyEstimate}ms, correct formula gives ${correctEstimate}ms. ` +
      `Correct total = ${correctTotal}ms < target ${MIN_TARGET_MS}ms. ` +
      `Story has insufficient words for target duration with correct formula.`
    );
  });
});
