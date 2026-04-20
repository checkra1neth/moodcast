/**
 * Preservation Property Tests - Short and Medium Duration Behavior
 * 
 * These tests verify that short and medium duration estimates remain within
 * acceptable ranges. They must PASS on both unfixed code (140 * speed) and
 * fixed code (140 / speed).
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { STORIES } from "../stories.mjs";
import { MOODS, DURATIONS } from "../moods.mjs";

// Replicate the formula from server.mjs (current: 140 * speed)
function estimateVoiceDurationMs(text, speed = 1.0) {
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 140 * speed;
  const minutes = words / wordsPerMinute;
  return Math.round(minutes * 60 * 1000);
}

describe("Preservation Property - Short Duration Behavior", () => {
  /**
   * **Validates: Requirements 3.1, 3.2**
   * 
   * For all moods at "short" duration, the total estimate (voice + buffer)
   * must be between 10000ms and 30000ms.
   * 
   * Ranges are wide enough to accommodate both formulas:
   * - 140 * speed (current buggy)
   * - 140 / speed (fixed)
   */
  const SHORT_MIN_MS = 10000;
  const SHORT_MAX_MS = 30000;
  const shortBuffer = DURATIONS.short.bufferMs; // 5000ms

  for (const [moodName, moodConfig] of Object.entries(MOODS)) {
    const speed = moodConfig.voiceSettings.speed;
    const shortStories = STORIES[moodName]?.short;

    if (!shortStories) continue;

    for (let i = 0; i < shortStories.length; i++) {
      const story = shortStories[i];
      const wordCount = story.text.split(/\s+/).length;

      it(`${moodName} short story #${i + 1} (speed=${speed}, ${wordCount} words): total in [${SHORT_MIN_MS}ms, ${SHORT_MAX_MS}ms]`, () => {
        const estimateMs = estimateVoiceDurationMs(story.text, speed);
        const totalMs = estimateMs + shortBuffer;

        assert.ok(
          totalMs >= SHORT_MIN_MS && totalMs <= SHORT_MAX_MS,
          `${moodName} short #${i + 1}: ${wordCount} words, speed=${speed}, ` +
          `estimate=${estimateMs}ms + buffer=${shortBuffer}ms = ${totalMs}ms, ` +
          `expected range [${SHORT_MIN_MS}, ${SHORT_MAX_MS}]`
        );
      });
    }
  }
});

describe("Preservation Property - Medium Duration Behavior", () => {
  /**
   * **Validates: Requirements 3.1, 3.2**
   * 
   * For all moods at "medium" duration, the total estimate (voice + buffer)
   * must be between 20000ms and 50000ms.
   * 
   * Ranges are wide enough to accommodate both formulas:
   * - 140 * speed (current buggy) produces higher estimates for slow speeds
   * - 140 / speed (fixed) produces lower estimates for slow speeds
   * Lower bound accounts for sleep (speed=0.75) medium stories with fixed formula.
   */
  const MEDIUM_MIN_MS = 20000;
  const MEDIUM_MAX_MS = 50000;
  const mediumBuffer = DURATIONS.medium.bufferMs; // 8000ms

  for (const [moodName, moodConfig] of Object.entries(MOODS)) {
    const speed = moodConfig.voiceSettings.speed;
    const mediumStories = STORIES[moodName]?.medium;

    if (!mediumStories) continue;

    for (let i = 0; i < mediumStories.length; i++) {
      const story = mediumStories[i];
      const wordCount = story.text.split(/\s+/).length;

      it(`${moodName} medium story #${i + 1} (speed=${speed}, ${wordCount} words): total in [${MEDIUM_MIN_MS}ms, ${MEDIUM_MAX_MS}ms]`, () => {
        const estimateMs = estimateVoiceDurationMs(story.text, speed);
        const totalMs = estimateMs + mediumBuffer;

        assert.ok(
          totalMs >= MEDIUM_MIN_MS && totalMs <= MEDIUM_MAX_MS,
          `${moodName} medium #${i + 1}: ${wordCount} words, speed=${speed}, ` +
          `estimate=${estimateMs}ms + buffer=${mediumBuffer}ms = ${totalMs}ms, ` +
          `expected range [${MEDIUM_MIN_MS}, ${MEDIUM_MAX_MS}]`
        );
      });
    }
  }
});

describe("Preservation Property - MOODS Voice Settings", () => {
  /**
   * **Validates: Requirements 3.3, 3.4, 3.5**
   * 
   * Verify MOODS config has correct voice settings for each mood.
   * These must remain unchanged after the fix.
   */
  const EXPECTED_MOODS = {
    relax: {
      voiceId: "EXAVITQu4vr4xnSDxMaL",
      voiceSettings: { stability: 0.7, similarityBoost: 0.75, speed: 0.85 },
    },
    focus: {
      voiceId: "onwK4e9ZLuTAKqWW03F9",
      voiceSettings: { stability: 0.8, similarityBoost: 0.8, speed: 0.95 },
    },
    energy: {
      voiceId: "JBFqnCBsd6RMkjVDRZzb",
      voiceSettings: { stability: 0.5, similarityBoost: 0.7, speed: 1.1 },
    },
    sleep: {
      voiceId: "XB0fDUnXU5powFXDhCwa",
      voiceSettings: { stability: 0.9, similarityBoost: 0.8, speed: 0.75 },
    },
  };

  for (const [moodName, expected] of Object.entries(EXPECTED_MOODS)) {
    it(`${moodName}: voiceId is correct`, () => {
      assert.strictEqual(MOODS[moodName].voiceId, expected.voiceId);
    });

    it(`${moodName}: stability is ${expected.voiceSettings.stability}`, () => {
      assert.strictEqual(
        MOODS[moodName].voiceSettings.stability,
        expected.voiceSettings.stability
      );
    });

    it(`${moodName}: similarityBoost is ${expected.voiceSettings.similarityBoost}`, () => {
      assert.strictEqual(
        MOODS[moodName].voiceSettings.similarityBoost,
        expected.voiceSettings.similarityBoost
      );
    });

    it(`${moodName}: speed is ${expected.voiceSettings.speed}`, () => {
      assert.strictEqual(
        MOODS[moodName].voiceSettings.speed,
        expected.voiceSettings.speed
      );
    });
  }
});
