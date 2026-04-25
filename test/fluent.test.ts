import { describe, expect, it } from 'vitest';

// Pull in the fluent surface as a side-effect import.
import '../src/parser/_fluent/index.ts';

import { char } from '../src/parser/character/char.ts';
import { digit } from '../src/parser/character/digit.ts';
import { letter } from '../src/parser/character/letter.ts';
import { whitespace } from '../src/parser/character/whitespace.ts';
import type { CharacterParser } from '../src/parser/character/character_parser.ts';
import { expectFailure, expectSuccess } from './_helpers.ts';

describe('Parser fluent API (module augmentation)', () => {
  it('.seq() variadic returns tupled value', () => {
    const p = digit().seq(letter(), digit());
    expectSuccess(p, '1a2', ['1', 'a', '2']);
  });

  it('.or() returns first match', () => {
    const p = char('a').or(char('b'), char('c'));
    expectSuccess(p, 'a', 'a');
    expectSuccess(p, 'b', 'b');
    expectSuccess(p, 'c', 'c');
    expectFailure(p, 'd');
  });

  it('.optional() defaults to undefined on miss', () => {
    expectSuccess(char('a').optional(), 'b', undefined, 0);
    expectSuccess(char('a').optional('X'), 'b', 'X', 0);
  });

  it('.and() / .not() / .neg() / .end()', () => {
    expectSuccess(char('a').and(), 'a', 'a', 0);
    expectSuccess(char('a').not({ message: 'no a' }), 'b', undefined, 0);
    expectSuccess(digit().neg({ message: 'no digit' }), 'a', 'a');
    expectSuccess(char('a').end(), 'a', 'a');
    expectFailure(char('a').end(), 'aa', 1, 'end of input expected');
  });

  it('.skip(...) wraps with before/after', () => {
    const p = char('a').skip({ before: whitespace(), after: whitespace() });
    expectSuccess(p, ' a ', 'a');
  });

  it('.star() / .plus() / .times() / .repeat()', () => {
    expectSuccess(char('a').star(), 'aaa', ['a', 'a', 'a']);
    expectSuccess(char('a').plus(), 'aa', ['a', 'a']);
    expectSuccess(char('a').times(3), 'aaa', ['a', 'a', 'a']);
    expectSuccess(char('a').repeat(2, 4), 'aaa', ['a', 'a', 'a']);
  });

  it('.starGreedy() / .plusLazy() with limits', () => {
    const p = char('a').plusGreedy(char('b'));
    expectSuccess(p, 'aaab', ['a', 'a', 'a'], 3);
  });

  it('.starSeparated() / .plusSeparated()', () => {
    const p = digit().starSeparated(char(','));
    const r = p.parse('1,2,3');
    expect(r.kind).toBe('success');
    if (r.kind === 'success') expect(r.value.elements).toEqual(['1', '2', '3']);
  });

  it('.starString() / .plusString() on CharacterParser', () => {
    const d = digit() as CharacterParser;
    expectSuccess(d.starString(), '123', '123');
    expectSuccess(d.plusString(), '12', '12');
    expectFailure(d.plusString(), 'x', 0, 'digit expected');
  });

  it('chains across categories', () => {
    // A digit, optionally followed by another digit, end of input.
    const p = digit().seq(digit().optional()).end();
    expectSuccess(p, '12', ['1', '2']);
    expectSuccess(p, '1', ['1', undefined]);
    expectFailure(p, '123', 2, 'end of input expected');
  });
});
