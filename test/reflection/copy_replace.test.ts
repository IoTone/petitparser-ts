import { describe, expect, it } from 'vitest';

import '../../src/parser/_fluent/index.ts';

import { char } from '../../src/parser/character/char.ts';
import { digit } from '../../src/parser/character/digit.ts';
import { letter } from '../../src/parser/character/letter.ts';
import type { ChoiceParser } from '../../src/parser/combinator/choice.ts';
import { or } from '../../src/parser/combinator/or.ts';
import { seq } from '../../src/parser/combinator/seq.ts';
import type { SequenceParser } from '../../src/parser/combinator/sequence.ts';
import { plus } from '../../src/parser/repeater/possessive.ts';
import type { PossessiveRepeatingParser } from '../../src/parser/repeater/possessive.ts';

describe('copy() + replace() semantics', () => {
  it('leaf parsers default copy() returns the same instance', () => {
    const d = digit();
    expect(d.copy()).toBe(d);
  });

  it('SequenceParser.copy() returns a fresh instance with a fresh parsers array', () => {
    const original = seq(digit(), char('-'), letter()) as unknown as SequenceParser<string>;
    const copy = original.copy();
    expect(copy).not.toBe(original);
    expect(copy.parsers).not.toBe(original.parsers);
    expect([...copy.parsers]).toEqual([...original.parsers]); // same children
  });

  it('SequenceParser.replace() swaps a child by reference', () => {
    const a = char('a');
    const b = char('b');
    const c = char('c');
    const seqP = seq(a, b, c) as unknown as SequenceParser<string>;
    const copy = seqP.copy();
    const z = char('z');
    copy.replace(b, z);
    expect(copy.parsers[1]).toBe(z);
    // Original is untouched.
    expect(seqP.parsers[1]).toBe(b);
  });

  it('ChoiceParser.replace() swaps every matching alternative', () => {
    const a = char('a');
    const choice = or(a, a, char('b')) as ChoiceParser<string>;
    const copy = choice.copy();
    const z = char('z');
    copy.replace(a, z);
    expect(copy.parsers[0]).toBe(z);
    expect(copy.parsers[1]).toBe(z);
    // Original untouched.
    expect(choice.parsers[0]).toBe(a);
  });

  it('PossessiveRepeatingParser.copy() + replace() round-trips', () => {
    const inner = char('a');
    const star = plus(inner) as PossessiveRepeatingParser<string>;
    const copy = star.copy();
    expect(copy).not.toBe(star);
    expect(copy.delegate).toBe(inner);
    const z = char('z');
    copy.replace(inner, z);
    expect(copy.delegate).toBe(z);
    expect(star.delegate).toBe(inner);
  });
});
