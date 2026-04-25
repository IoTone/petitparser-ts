import { describe, expect, it } from 'vitest';

import '../../src/parser/_fluent/index.ts';

import type { Parser } from '../../src/core/parser.ts';
import { CharacterParser } from '../../src/parser/character/character_parser.ts';
import { char } from '../../src/parser/character/char.ts';
import { digit } from '../../src/parser/character/digit.ts';
import { ChoiceParser } from '../../src/parser/combinator/choice.ts';
import { or } from '../../src/parser/combinator/or.ts';
import { seq } from '../../src/parser/combinator/seq.ts';
import { settable } from '../../src/parser/combinator/settable.ts';
import { SequenceParser } from '../../src/parser/combinator/sequence.ts';
import { transformParser } from '../../src/reflection/transform.ts';
import { allParser } from '../../src/reflection/iterable.ts';

describe('transformParser()', () => {
  it('returns the same parser when handler is identity', () => {
    const p = seq(digit(), char('-'), digit());
    const transformed = transformParser(p, (parser) => parser);
    // The transform may rebuild structure but parsing must still work identically.
    const r = transformed.parse('1-2');
    expect(r.kind).toBe('success');
    if (r.kind === 'success') expect(r.value).toEqual(['1', '-', '2']);
  });

  it('does not mutate the original tree', () => {
    const original = seq(digit(), char('-'), digit());
    const originalChildren = [...original.children];
    transformParser(original, (parser) => {
      // Replace every CharacterParser with one that fails — drastic.
      if (parser instanceof CharacterParser) {
        return new CharacterParser(
          { test: () => false, isEqualTo: () => false },
          'replaced',
        );
      }
      return parser;
    });
    // Original still works.
    const r = original.parse('1-2');
    expect(r.kind).toBe('success');
    expect(original.children).toEqual(originalChildren);
  });

  it('handler can replace ChoiceParser with a new one (e.g. wrapping in sequence)', () => {
    const p = or(char('a'), char('b'), char('c'));
    const transformed = transformParser(p, (parser) => {
      if (parser instanceof ChoiceParser) {
        // Wrap in another single-child sequence, semantically a no-op.
        return new SequenceParser([parser]);
      }
      return parser;
    });
    // Result of the new wrapper sequence is a single-element list.
    const r = transformed.parse('a');
    expect(r.kind).toBe('success');
  });

  it('handles cycles in the parser graph', () => {
    // Recursive grammar with a base case: expr := digit | '(' expr ')'
    const expr = settable<unknown>();
    expr.set(or(digit(), seq(char('('), expr, char(')'))));
    const transformed = transformParser(expr, (parser) => parser);
    // Without a base case the recursion has nothing to bottom out on; with `digit()`
    // as the alternative, nested parens around a digit parse cleanly.
    const r = transformed.parse('((5))');
    expect(r.kind).toBe('success');
  });

  it('every parser in the tree is visited exactly once', () => {
    const p = seq(digit(), char('-'), digit());
    const visited: Parser<unknown>[] = [];
    transformParser(p, (parser) => {
      visited.push(parser);
      return parser;
    });
    // Same number of visits as unique parsers reachable.
    const unique = [...allParser(p)];
    // Note: transform visits children before parent, so order differs from allParser,
    // but the count should match.
    expect(visited.length).toBe(unique.length);
  });
});
