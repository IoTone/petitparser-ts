import { expect } from 'vitest';

import type { Parser } from '../src/core/parser.ts';

/** Asserts the parser succeeds on `input` with `expected` value at `position`. */
export function expectSuccess<R>(
  parser: Parser<R>,
  input: string,
  expected: R,
  position?: number,
): void {
  const result = parser.parse(input);
  expect(result.kind).toBe('success');
  if (result.kind !== 'success') return;
  expect(result.value).toEqual(expected);
  expect(result.position).toBe(position ?? input.length);
}

/** Asserts the parser fails on `input` at `position` with optional `message`. */
export function expectFailure(
  parser: Parser<unknown>,
  input: string,
  position = 0,
  message?: string,
): void {
  const result = parser.parse(input);
  expect(result.kind).toBe('failure');
  if (result.kind !== 'failure') return;
  expect(result.position).toBe(position);
  if (message != null) expect(result.message).toBe(message);
}
