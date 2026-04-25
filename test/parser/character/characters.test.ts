import { describe, it } from 'vitest';

import { any } from '../../../src/parser/character/any.ts';
import { char } from '../../../src/parser/character/char.ts';
import { digit } from '../../../src/parser/character/digit.ts';
import { letter } from '../../../src/parser/character/letter.ts';
import { lowercase } from '../../../src/parser/character/lowercase.ts';
import { range } from '../../../src/parser/character/range.ts';
import { uppercase } from '../../../src/parser/character/uppercase.ts';
import { whitespace } from '../../../src/parser/character/whitespace.ts';
import { word } from '../../../src/parser/character/word.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('any()', () => {
  it('accepts any single character', () => {
    expectSuccess(any(), 'a', 'a');
    expectSuccess(any(), 'b', 'b');
    expectFailure(any(), '', 0, 'input expected');
  });
});

describe('char()', () => {
  it('matches the exact character', () => {
    const p = char('a');
    expectSuccess(p, 'a', 'a');
    expectFailure(p, 'b', 0, '"a" expected');
    expectFailure(p, '', 0, '"a" expected');
  });

  it('throws on multi-character input', () => {
    // expectError shape — vitest's expect().toThrow handles this
    let threw = false;
    try {
      char('ab');
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('expected char("ab") to throw');
  });
});

describe('digit()', () => {
  it('matches one ASCII digit', () => {
    const p = digit();
    expectSuccess(p, '0', '0');
    expectSuccess(p, '9', '9');
    expectFailure(p, 'a', 0, 'digit expected');
    expectFailure(p, '', 0, 'digit expected');
  });
});

describe('letter()', () => {
  it('matches one ASCII letter', () => {
    const p = letter();
    expectSuccess(p, 'a', 'a');
    expectSuccess(p, 'X', 'X');
    expectFailure(p, '0', 0, 'letter expected');
    expectFailure(p, '', 0, 'letter expected');
  });
});

describe('lowercase()', () => {
  it('matches a..z only', () => {
    const p = lowercase();
    expectSuccess(p, 'a', 'a');
    expectSuccess(p, 'z', 'z');
    expectFailure(p, 'A', 0, 'lowercase letter expected');
    expectFailure(p, '0', 0, 'lowercase letter expected');
  });
});

describe('uppercase()', () => {
  it('matches A..Z only', () => {
    const p = uppercase();
    expectSuccess(p, 'A', 'A');
    expectSuccess(p, 'Z', 'Z');
    expectFailure(p, 'a', 0, 'uppercase letter expected');
    expectFailure(p, '0', 0, 'uppercase letter expected');
  });
});

describe('whitespace()', () => {
  it('matches ASCII whitespace', () => {
    const p = whitespace();
    expectSuccess(p, ' ', ' ');
    expectSuccess(p, '\t', '\t');
    expectSuccess(p, '\r', '\r');
    expectSuccess(p, '\n', '\n');
    expectSuccess(p, '\f', '\f');
    expectFailure(p, 'z', 0, 'whitespace expected');
  });

  it('matches selected Unicode whitespace', () => {
    const p = whitespace();
    expectSuccess(p, ' ', ' '); // NBSP
    expectSuccess(p, ' ', ' '); // EM SPACE
    expectSuccess(p, '　', '　'); // IDEOGRAPHIC SPACE
  });
});

describe('word()', () => {
  it('matches letters, digits, underscore', () => {
    const p = word();
    expectSuccess(p, 'a', 'a');
    expectSuccess(p, 'Z', 'Z');
    expectSuccess(p, '0', '0');
    expectSuccess(p, '9', '9');
    expectSuccess(p, '_', '_');
    expectFailure(p, '-', 0, 'letter or digit expected');
  });
});

describe('range()', () => {
  it('matches inclusive', () => {
    const p = range('e', 'o');
    expectSuccess(p, 'e', 'e');
    expectSuccess(p, 'i', 'i');
    expectSuccess(p, 'o', 'o');
    expectFailure(p, 'd', 0, 'e..o expected');
    expectFailure(p, 'p', 0, 'e..o expected');
  });

  it('collapses single-char range to single predicate', () => {
    const p = range('z', 'z');
    expectSuccess(p, 'z', 'z');
    expectFailure(p, 'a', 0, 'z..z expected');
  });
});
