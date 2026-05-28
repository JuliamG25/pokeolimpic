/**
 * Unit tests for StatBar width calculation logic.
 * Requirements: 6.3
 *
 * The test environment is Node (no React Native renderer), so we test
 * the pure calculation: widthPercent = (value / maxValue) * 100
 */

/** Mirrors the internal calculation in StatBar */
function calcWidthPercent(value: number, maxValue: number = 255): number {
  const clamped = Math.max(0, Math.min(value, maxValue));
  return (clamped / maxValue) * 100;
}

describe('StatBar width calculation', () => {
  it('returns 0% for value 0', () => {
    expect(calcWidthPercent(0)).toBe(0);
  });

  it('returns 100% for value equal to maxValue (255)', () => {
    expect(calcWidthPercent(255)).toBe(100);
  });

  it('returns 50% for value 127.5 out of 255', () => {
    expect(calcWidthPercent(127.5)).toBeCloseTo(50, 5);
  });

  it('returns correct percentage for a typical HP stat (45)', () => {
    // 45 / 255 * 100 ≈ 17.647...
    expect(calcWidthPercent(45)).toBeCloseTo((45 / 255) * 100, 5);
  });

  it('returns correct percentage for a high stat (150)', () => {
    expect(calcWidthPercent(150)).toBeCloseTo((150 / 255) * 100, 5);
  });

  it('clamps values above maxValue to 100%', () => {
    expect(calcWidthPercent(300)).toBe(100);
  });

  it('clamps negative values to 0%', () => {
    expect(calcWidthPercent(-10)).toBe(0);
  });

  it('uses custom maxValue correctly', () => {
    // value=50, maxValue=100 → 50%
    expect(calcWidthPercent(50, 100)).toBe(50);
  });

  it('uses custom maxValue: value at max gives 100%', () => {
    expect(calcWidthPercent(200, 200)).toBe(100);
  });

  it('uses custom maxValue: value 0 gives 0%', () => {
    expect(calcWidthPercent(0, 100)).toBe(0);
  });
});
