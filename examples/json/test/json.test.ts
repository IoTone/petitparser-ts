import { describe, expect, it } from 'vitest';

import { JsonGrammar } from '../src/index.ts';
import type { JsonValue } from '../src/types.ts';

const json = new JsonGrammar().build();

function parse(input: string): JsonValue {
  const r = json.parse(input);
  if (r.kind !== 'success') throw new Error(`parse failed: ${r.message} at ${String(r.position)}`);
  return r.value;
}

function shouldFail(input: string): void {
  const r = json.parse(input);
  expect(r.kind).toBe('failure');
}

describe('JSON example — primitives', () => {
  it.each<[string, JsonValue]>([
    ['null', null],
    ['true', true],
    ['false', false],
    ['0', 0],
    ['42', 42],
    ['-7', -7],
    ['3.14', 3.14],
    ['-0.5', -0.5],
    ['1e3', 1000],
    ['1.5e-2', 0.015],
    ['2E10', 2e10],
    ['"hello"', 'hello'],
    ['""', ''],
  ])('parses %s', (input, expected) => {
    expect(parse(input)).toEqual(expected);
  });
});

describe('JSON example — strings with escapes', () => {
  it('handles standard escapes', () => {
    expect(parse('"a\\nb"')).toBe('a\nb');
    expect(parse('"\\\\"')).toBe('\\');
    expect(parse('"\\""')).toBe('"');
    expect(parse('"\\t\\r\\b\\f"')).toBe('\t\r\b\f');
    expect(parse('"\\/"')).toBe('/');
  });

  it('handles Unicode escapes', () => {
    expect(parse('"\\u0041"')).toBe('A');
    expect(parse('"\\u00e9"')).toBe('é');
    expect(parse('"\\u4e2d"')).toBe('中');
  });

  it('passes through Unicode characters in source', () => {
    expect(parse('"héllo"')).toBe('héllo');
  });
});

describe('JSON example — arrays', () => {
  it('parses empty array', () => {
    expect(parse('[]')).toEqual([]);
  });

  it('parses flat array', () => {
    expect(parse('[1, 2, 3]')).toEqual([1, 2, 3]);
  });

  it('parses heterogeneous array', () => {
    expect(parse('[1, "two", true, null]')).toEqual([1, 'two', true, null]);
  });

  it('parses nested array', () => {
    expect(parse('[[1, 2], [3, [4, 5]]]')).toEqual([[1, 2], [3, [4, 5]]]);
  });

  it('rejects trailing comma', () => {
    shouldFail('[1, 2, 3,]');
  });
});

describe('JSON example — objects', () => {
  it('parses empty object', () => {
    expect(parse('{}')).toEqual({});
  });

  it('parses flat object', () => {
    expect(parse('{"a": 1, "b": 2}')).toEqual({ a: 1, b: 2 });
  });

  it('parses nested object', () => {
    expect(parse('{"x": {"y": {"z": 42}}}')).toEqual({ x: { y: { z: 42 } } });
  });

  it('mixed object/array', () => {
    expect(parse('{"items": [{"id": 1}, {"id": 2}], "total": 2}')).toEqual({
      items: [{ id: 1 }, { id: 2 }],
      total: 2,
    });
  });

  it('rejects bare keys', () => {
    shouldFail('{a: 1}');
  });

  it('rejects trailing comma', () => {
    shouldFail('{"a": 1,}');
  });
});

describe('JSON example — whitespace tolerance', () => {
  it('accepts arbitrary whitespace', () => {
    expect(parse('  \n[\t1\n,  \t2\n]  ')).toEqual([1, 2]);
  });
});

describe('JSON example — byte-identical to JSON.parse', () => {
  const cases = [
    'null',
    'true',
    '42',
    '"hello\\nworld"',
    '[]',
    '{}',
    '[1, 2, 3]',
    '{"name": "alice", "age": 30, "active": true, "tags": ["a", "b"]}',
    '{"deeply": {"nested": {"object": {"with": [1, 2, [3, [4, [5]]]]}}}}',
    '{"escapes": "\\u00e9 \\n \\t \\\\"}',
    '{"numbers": [0, -0, 1, -1, 1.5, -1.5, 1e10, 1.5E-3]}',
  ];

  it.each(cases)('matches JSON.parse for %s', (input) => {
    const ours = parse(input);
    const native = JSON.parse(input) as JsonValue;
    expect(ours).toEqual(native);
  });
});

describe('JSON example — invalid input', () => {
  it.each([
    '',
    '   ',
    'undefined',
    "{'a': 1}", // single quotes
    '{"a": 1', // missing close
    '[1, 2', // missing close
    '01', // leading zero
    '.5', // missing integer part
    '1.', // missing fraction digit
    '1e', // missing exp digit
    '"unterminated',
    '"bad escape \\x"',
  ])('rejects %j', (input) => {
    shouldFail(input);
  });
});
