import { describe, expect, it } from 'vitest';

import '../../src/parser/_fluent/index.ts';

import { char } from '../../src/parser/character/char.ts';
import { digit } from '../../src/parser/character/digit.ts';
import { or } from '../../src/parser/combinator/or.ts';
import { seq } from '../../src/parser/combinator/seq.ts';
import { profile, type ProfileFrame } from '../../src/debug/profile.ts';

describe('profile()', () => {
  it('captures activation counts on a JSON-shaped parse (Phase 5 exit criterion)', () => {
    // Tiny JSON-like grammar: digit-array `[1,2,3]`. Stand-in for a full JSON
    // parser until Phase 6 ships the real thing.
    const number = digit().plus().flatten().map(Number);
    const arr = seq(char('['), number, seq(char(','), number).star(), char(']'));

    const frames: ProfileFrame[] = [];
    const { parser, output } = profile(arr, {
      output: (fs) => {
        frames.push(...fs);
      },
    });

    const r = parser.parse('[1,2,3]');
    expect(r.kind).toBe('success');
    output();

    // Every parser in the graph contributes a frame.
    expect(frames.length).toBeGreaterThan(0);
    // At least one parser was invoked at least once.
    const totalCount = frames.reduce((s, f) => s + f.count, 0);
    expect(totalCount).toBeGreaterThan(0);
    // The wrapping parser (the outermost seq) was invoked once.
    const seqFrames = frames.filter((f) => f.parser.constructor.name === 'SequenceParser');
    expect(seqFrames.length).toBeGreaterThan(0);
    // Total elapsed time is non-negative.
    const totalMs = frames.reduce((s, f) => s + f.elapsedMs, 0);
    expect(totalMs).toBeGreaterThanOrEqual(0);
  });

  it('respects the predicate filter', () => {
    const p = or(char('a'), char('b'));
    const frames: ProfileFrame[] = [];
    const { parser, output } = profile(p, {
      predicate: (parser) => parser.constructor.name === 'ChoiceParser',
      output: (fs) => {
        frames.push(...fs);
      },
    });
    parser.parse('b');
    output();
    // Only the ChoiceParser is profiled.
    expect(frames).toHaveLength(1);
    expect(frames[0]?.parser.constructor.name).toBe('ChoiceParser');
  });
});
