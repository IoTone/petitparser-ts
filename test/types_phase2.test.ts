import { describe, expectTypeOf, it } from 'vitest';

// Side-effect: install fluent methods so the type-level assertions can see them.
import '../src/parser/_fluent/index.ts';

import type { Parser } from '../src/core/parser.ts';
import { digit } from '../src/parser/character/digit.ts';
import { letter } from '../src/parser/character/letter.ts';
import { or } from '../src/parser/combinator/or.ts';
import { seq } from '../src/parser/combinator/seq.ts';
import { star } from '../src/parser/repeater/possessive.ts';
import {
  starSeparated,
  type SeparatedList,
} from '../src/parser/repeater/separated.ts';
import { char } from '../src/parser/character/char.ts';

describe('Phase 2 type-level', () => {
  it('seq(digit(), letter()) infers Parser<readonly [string, string]>', () => {
    expectTypeOf(seq(digit(), letter())).toEqualTypeOf<Parser<readonly [string, string]>>();
  });

  it('seq with three elements infers a 3-tuple', () => {
    expectTypeOf(seq(digit(), letter(), digit())).toEqualTypeOf<
      Parser<readonly [string, string, string]>
    >();
  });

  it('or(digit(), letter()) infers Parser<string>', () => {
    expectTypeOf(or(digit(), letter())).toEqualTypeOf<Parser<string>>();
  });

  it('star(digit()) infers Parser<string[]>', () => {
    expectTypeOf(star(digit())).toEqualTypeOf<Parser<string[]>>();
  });

  it('starSeparated(digit, char) infers Parser<SeparatedList<string, string>>', () => {
    expectTypeOf(starSeparated(digit(), char(','))).toEqualTypeOf<
      Parser<SeparatedList<string, string>>
    >();
  });

  it('.seq() instance method matches the variadic free function', () => {
    expectTypeOf(digit().seq(letter())).toEqualTypeOf<Parser<readonly [string, string]>>();
    expectTypeOf(digit().seq(letter(), digit())).toEqualTypeOf<
      Parser<readonly [string, string, string]>
    >();
  });

  it('.or() instance method returns the right union', () => {
    expectTypeOf(digit().or(letter())).toEqualTypeOf<Parser<string>>();
  });

  it('.optional() narrows to R | undefined', () => {
    expectTypeOf(digit().optional()).toEqualTypeOf<Parser<string | undefined>>();
  });

  it('.optional(fallback) narrows to R | typeof fallback', () => {
    expectTypeOf(digit().optional(0)).toEqualTypeOf<Parser<string | number>>();
  });

  it('.star() / .plus() / .times() / .repeat() return Parser<R[]>', () => {
    expectTypeOf(digit().star()).toEqualTypeOf<Parser<string[]>>();
    expectTypeOf(digit().plus()).toEqualTypeOf<Parser<string[]>>();
    expectTypeOf(digit().times(3)).toEqualTypeOf<Parser<string[]>>();
    expectTypeOf(digit().repeat(1, 5)).toEqualTypeOf<Parser<string[]>>();
  });

  it('.end() preserves R', () => {
    expectTypeOf(digit().end()).toEqualTypeOf<Parser<string>>();
  });

  it('.starSeparated() returns Parser<SeparatedList<R, S>>', () => {
    expectTypeOf(digit().starSeparated(char(','))).toEqualTypeOf<
      Parser<SeparatedList<string, string>>
    >();
  });
});
