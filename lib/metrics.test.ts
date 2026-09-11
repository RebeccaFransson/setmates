import { describe, expect, it } from 'vitest';

import { e1rm, lastPerformanceSummary, setVolumeKg } from './metrics';

function expectClose(actual: number | null, expected: number, precision = 2) {
  expect(actual).not.toBeNull();
  expect(actual as number).toBeCloseTo(expected, precision);
}

describe('e1rm', () => {
  it('matches the required examples', () => {
    expect(e1rm(100, 1)).toBe(100);
    expectClose(e1rm(100, 5), 114.5833);
    expectClose(e1rm(100, 10), 133.3333);
    expect(e1rm(100, 13)).toBeNull();
    expect(e1rm(0, 5)).toBeNull();
  });

  it('is monotonic in weight and reps up to 12 reps', () => {
    for (let reps = 1; reps <= 12; reps += 1) {
      const lowerWeight = e1rm(80, reps);
      const higherWeight = e1rm(100, reps);
      expect(lowerWeight).not.toBeNull();
      expect(higherWeight).not.toBeNull();
      expect(higherWeight as number).toBeGreaterThan(lowerWeight as number);
    }

    for (let reps = 1; reps < 12; reps += 1) {
      const lowerRep = e1rm(100, reps);
      const higherRep = e1rm(100, reps + 1);
      expect(lowerRep).not.toBeNull();
      expect(higherRep).not.toBeNull();
      expect(higherRep as number).toBeGreaterThan(lowerRep as number);
    }
  });
});

describe('setVolumeKg', () => {
  it('clamps assisted weighted bodyweight work to at least 1 kg', () => {
    expect(
      setVolumeKg({
        kind: 'weighted_bodyweight',
        bodyweightKg: 70,
        weightKg: -100,
        reps: 8,
        isCompleted: true,
      }),
    ).toBe(8);
  });

  it('uses the workout bodyweight snapshot for bodyweight reps volume', () => {
    expect(
      setVolumeKg({
        kind: 'bodyweight_reps',
        bodyweightKg: 83.5,
        reps: 12,
        isCompleted: true,
      }),
    ).toBe(1002);
  });

  it('ignores warmups and incomplete sets in volume', () => {
    expect(
      setVolumeKg({
        kind: 'weight_reps',
        weightKg: 100,
        reps: 5,
        setType: 'warmup',
        isCompleted: true,
      }),
    ).toBe(0);
    expect(
      setVolumeKg({
        kind: 'weight_reps',
        weightKg: 100,
        reps: 5,
        isCompleted: false,
      }),
    ).toBe(0);
  });
});

describe('lastPerformanceSummary', () => {
  it('formats weight and bodyweight summaries for the placeholder header', () => {
    expect(
      lastPerformanceSummary('weight_reps', 4, [{ reps: 7, weightKg: 70 }]),
    ).toBe('Last: 4 days ago · 1×7 @ 70 kg');
    expect(lastPerformanceSummary('bodyweight_reps', 2, [{ reps: 15 }])).toBe(
      'Last: 2 days ago · 1×15',
    );
  });

  it('formats duration and distance summaries', () => {
    expect(
      lastPerformanceSummary('duration', 3, [{ durationSeconds: 90 }]),
    ).toBe('Last: 3 days ago · 1×90 s');
    expect(
      lastPerformanceSummary('distance_duration', 6, [
        { distanceM: 1000, durationSeconds: 300 },
      ]),
    ).toBe('Last: 6 days ago · 1000 m in 300 s');
  });
});
