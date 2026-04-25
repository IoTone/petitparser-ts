import type { Context } from './context.ts';

/**
 * Parse result — discriminated union of `Success<R>` and `Failure`.
 *
 * Upstream Dart uses a sealed class hierarchy (`Result<R>` with `Success<R>`
 * and `Failure extends Result<Never>`); we use a discriminated union because
 * TS narrows it for free via the `kind` tag and there's no risk of the
 * 2014-port-style "forgot the parens on `result.isSuccess`" bug class.
 */
export type Result<R> = Success<R> | Failure;

export interface Success<R> {
  readonly kind: 'success';
  readonly buffer: string;
  readonly position: number;
  readonly value: R;
}

export interface Failure {
  readonly kind: 'failure';
  readonly buffer: string;
  readonly position: number;
  readonly message: string;
}

export function success<R>(context: Context, value: R, position = context.position): Success<R> {
  return { kind: 'success', buffer: context.buffer, position, value };
}

export function failure(context: Context, message: string, position = context.position): Failure {
  return { kind: 'failure', buffer: context.buffer, position, message };
}
