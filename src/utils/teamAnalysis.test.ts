import { analyzeTeamTypes } from './teamAnalysis';

describe('analyzeTeamTypes', () => {
  it('detecta debilidades compartidas', () => {
    const analysis = analyzeTeamTypes([
      { types: ['fire'] },
      { types: ['fire'] },
      { types: ['fire'] },
    ]);
    expect(analysis.sharedWeaknesses.some((w) => w.count >= 2)).toBe(true);
    expect(analysis.offensiveCoverage.length).toBeGreaterThan(0);
  });
});
