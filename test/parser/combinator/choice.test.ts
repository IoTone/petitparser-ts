import { describe, expect, it } from 'vitest';

// Fluent surface needed for `.seq()` chaining inside the strategy tests.
import '../../../src/parser/_fluent/index.ts';

import { char } from '../../../src/parser/character/char.ts';
import { digit } from '../../../src/parser/character/digit.ts';
import { letter } from '../../../src/parser/character/letter.ts';
import {
  selectFarthest,
  selectFarthestJoined,
  selectLast,
} from '../../../src/parser/combinator/choice.ts';
import { or, orWith } from '../../../src/parser/combinator/or.ts';
import { string } from '../../../src/parser/predicate/string.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('or() — variadic free function', () => {
  it('returns the first matching alternative', () => {
    const p = or(char('a'), char('b'));
    expectSuccess(p, 'a', 'a');
    expectSuccess(p, 'b', 'b');
    expectFailure(p, 'c');
    expectFailure(p, '');
  });

  it('chains transparently for three or more alternatives', () => {
    const p = or(char('a'), char('b'), char('c'));
    expectSuccess(p, 'a', 'a');
    expectSuccess(p, 'b', 'b');
    expectSuccess(p, 'c', 'c');
    expectFailure(p, 'd');
  });

  it('infers the union of result types', () => {
    // Type-level: or(digit(), letter()) is Parser<string>; or(p<number>, p<string>) is Parser<string|number>.
    // Run-time spot check.
    const p = or(digit(), letter());
    expectSuccess(p, '5', '5');
    expectSuccess(p, 'X', 'X');
  });
});

describe('FailureJoiner strategies', () => {
  it('selectLast (default) reports the last alternative failure', () => {
    const p = or(string('foo'), string('bar'));
    const result = p.parse('xxx');
    expect(result.kind).toBe('failure');
    if (result.kind === 'failure') expect(result.message).toContain('bar');
  });

  it('selectFarthest reports whichever alternative consumed more', () => {
    const p = orWith(selectFarthest, string('axe'), string('byz'));
    // 'axe' consumes 1 (a) before failing at position 1; 'byz' consumes 0 before failing at 0.
    // selectFarthest should report the 'axe' failure (further into the input).
    const result = p.parse('axx');
    expect(result.kind).toBe('failure');
    if (result.kind === 'failure') expect(result.position).toBe(0);
    // Both fail at position 0 because string() doesn't advance on partial mismatch.
    // Use a more telling case:
    const longer = orWith(selectFarthest, string('foo').seq(string('bar')), string('zzz'));
    const r2 = longer.parse('foo!');
    expect(r2.kind).toBe('failure');
    if (r2.kind === 'failure') expect(r2.position).toBe(3); // farthest progress was after 'foo'
  });

  it('selectFarthestJoined fuses messages on tie', () => {
    const p = orWith(selectFarthestJoined, string('foo'), string('bar'));
    const result = p.parse('xxx');
    expect(result.kind).toBe('failure');
    if (result.kind === 'failure') {
      expect(result.message).toContain('foo');
      expect(result.message).toContain('bar');
      expect(result.message).toContain('OR');
    }
  });

  it('selectLast / selectFarthest / selectFarthestJoined are exported', () => {
    expect(typeof selectLast).toBe('function');
    expect(typeof selectFarthest).toBe('function');
    expect(typeof selectFarthestJoined).toBe('function');
  });
});
