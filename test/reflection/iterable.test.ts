import { describe, expect, it } from 'vitest';

import '../../src/parser/_fluent/index.ts';

import { allParser } from '../../src/reflection/iterable.ts';
import { char } from '../../src/parser/character/char.ts';
import { digit } from '../../src/parser/character/digit.ts';
import { letter } from '../../src/parser/character/letter.ts';
import { seq } from '../../src/parser/combinator/seq.ts';
import { settable } from '../../src/parser/combinator/settable.ts';

describe('allParser()', () => {
  it('yields a single leaf parser', () => {
    const p = digit();
    const all = [...allParser(p)];
    expect(all).toHaveLength(1);
    expect(all[0]).toBe(p);
  });

  it('yields parents and children, deduplicated by reference', () => {
    const d = digit();
    const l = letter();
    const p = seq(d, l, d); // d appears twice
    const all = [...allParser(p)];
    // p (1) + d (1, deduped) + l (1) = 3 unique
    expect(all).toHaveLength(3);
    expect(all).toContain(p);
    expect(all).toContain(d);
    expect(all).toContain(l);
  });

  it('terminates on cycles via SettableParser', () => {
    const expr = settable<unknown>();
    expr.set(seq(char('('), expr, char(')')));
    const all = [...allParser(expr)];
    // Should not infinite-loop. Should include expr, the SequenceParser,
    // and the two char('(' / ')') parsers.
    expect(all.length).toBeGreaterThan(2);
    expect(all.length).toBeLessThan(20); // sanity
  });
});
