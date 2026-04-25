import { describe, expectTypeOf, it } from 'vitest';

import type { Parser } from '../src/core/parser.ts';
import type { Result, Success } from '../src/core/result.ts';
import { digit } from '../src/parser/character/digit.ts';
import { epsilon, epsilonWith } from '../src/parser/misc/epsilon.ts';
import { failure } from '../src/parser/misc/failure.ts';
import { position } from '../src/parser/misc/position.ts';

describe('type-level', () => {
  it('digit().parse(input).value narrows to string', () => {
    const result = digit().parse('1');
    expectTypeOf(result).toEqualTypeOf<Result<string>>();
    if (result.kind === 'success') {
      expectTypeOf(result.value).toEqualTypeOf<string>();
    }
  });

  it('epsilon() is Parser<undefined>', () => {
    expectTypeOf(epsilon()).toEqualTypeOf<Parser<undefined>>();
  });

  it('epsilonWith<T>() infers the result type from the value', () => {
    expectTypeOf(epsilonWith(42)).toEqualTypeOf<Parser<number>>();
    expectTypeOf(epsilonWith('hello')).toEqualTypeOf<Parser<string>>();
  });

  it('failure() is Parser<never>', () => {
    expectTypeOf(failure('boom')).toEqualTypeOf<Parser<never>>();
  });

  it('position() is Parser<number>', () => {
    expectTypeOf(position()).toEqualTypeOf<Parser<number>>();
  });

  it('Success<R> narrowing exposes value: R', () => {
    const r = digit().parse('1');
    if (r.kind === 'success') {
      expectTypeOf(r).toMatchTypeOf<Success<string>>();
    }
  });
});
