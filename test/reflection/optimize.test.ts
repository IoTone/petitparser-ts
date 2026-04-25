import { describe, expect, it } from 'vitest';

import '../../src/parser/_fluent/index.ts';

import { char } from '../../src/parser/character/char.ts';
import { ChoiceParser } from '../../src/parser/combinator/choice.ts';
import { or } from '../../src/parser/combinator/or.ts';
import { FlattenChoice, optimize } from '../../src/reflection/optimize.ts';

describe('optimize() + FlattenChoice', () => {
  it('collapses a deeply nested choice tree (Phase 5 exit criterion)', () => {
    // Build `Choice(a, Choice(b, Choice(c, Choice(d, e))))`.
    const a = char('a');
    const b = char('b');
    const c = char('c');
    const d = char('d');
    const e = char('e');
    const nested = or(a, or(b, or(c, or(d, e))));

    // Pre-optimization: top-level Choice has 2 children (a, inner Choice).
    expect((nested as ChoiceParser<string>).parsers).toHaveLength(2);

    const optimized = optimize(nested, { rules: [FlattenChoice] });

    // Post-optimization: top-level Choice has 5 children, one per leaf.
    expect(optimized).toBeInstanceOf(ChoiceParser);
    const flat = optimized as ChoiceParser<string>;
    expect(flat.parsers).toHaveLength(5);
    expect(flat.parsers[0]).toBe(a);
    expect(flat.parsers[4]).toBe(e);
  });

  it('preserves parsing semantics', () => {
    const nested = or(char('a'), or(char('b'), or(char('c'), char('d'))));
    const optimized = optimize(nested);
    for (const ch of ['a', 'b', 'c', 'd']) {
      const r = optimized.parse(ch);
      expect(r.kind).toBe('success');
      if (r.kind === 'success') expect(r.value).toBe(ch);
    }
    expect(optimized.parse('z').kind).toBe('failure');
  });

  it('is a no-op when no nested choices exist', () => {
    const flat = or(char('a'), char('b'), char('c'));
    const optimized = optimize(flat);
    expect((optimized as ChoiceParser<string>).parsers).toHaveLength(3);
  });
});
