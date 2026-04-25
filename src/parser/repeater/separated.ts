import type { Context } from '../../core/context.ts';
import { Parser } from '../../core/parser.ts';
import { failure as makeFailure, success, type Result } from '../../core/result.ts';
import { UNBOUNDED } from './repeating.ts';

/**
 * Result of a `*Separated` parse: parallel `elements` and `separators` arrays
 * preserving both the matched values and the separators between them.
 *
 * Invariant: `separators.length === Math.max(0, elements.length - 1)`.
 */
export class SeparatedList<R, S> {
  readonly elements: readonly R[];
  readonly separators: readonly S[];

  constructor(elements: readonly R[], separators: readonly S[]) {
    if (separators.length !== Math.max(0, elements.length - 1)) {
      throw new Error('SeparatedList invariant violated: separators.length must be elements.length - 1');
    }
    this.elements = elements;
    this.separators = separators;
  }

  /** Yields `[elem, sep, elem, sep, ..., elem]` in source order. */
  *interleaved(): Generator<R | S> {
    for (let i = 0; i < this.elements.length; i++) {
      yield this.elements[i] as R;
      if (i < this.separators.length) yield this.separators[i] as S;
    }
  }

  toString(): string {
    return `SeparatedList[${String(this.elements.length)} elements, ${String(this.separators.length)} separators]`;
  }
}

/**
 * Repeating parser that captures both elements and separators as a typed
 * `SeparatedList<R, S>`. Replaces upstream's older dynamic `separatedBy` API.
 */
export class SeparatedRepeatingParser<R, S> extends Parser<SeparatedList<R, S>> {
  element: Parser<R>;
  separator: Parser<S>;
  readonly min: number;
  readonly max: number;

  constructor(element: Parser<R>, separator: Parser<S>, min: number, max: number) {
    super();
    if (min < 0) throw new Error(`min must be >= 0, got ${String(min)}`);
    if (max < min) throw new Error(`max (${String(max)}) must be >= min (${String(min)})`);
    this.element = element;
    this.separator = separator;
    this.min = min;
    this.max = max;
  }

  override parseOn(context: Context): Result<SeparatedList<R, S>> {
    const elements: R[] = [];
    const separators: S[] = [];
    let cursor: Context = context;

    // First element (if any).
    const first = this.element.parseOn(cursor);
    if (first.kind === 'failure') {
      if (this.min === 0) return success(context, new SeparatedList<R, S>([], []));
      return first;
    }
    elements.push(first.value);
    cursor = { buffer: first.buffer, position: first.position };

    while (elements.length < this.max) {
      // Try a separator. If it fails we stop (without consuming).
      const sep = this.separator.parseOn(cursor);
      if (sep.kind === 'failure') {
        if (elements.length < this.min) return sep;
        break;
      }
      // Try the element after the separator. If it fails AND we've already met
      // `min`, treat the separator as trailing (don't consume it) and stop with
      // what we have. Otherwise propagate the failure.
      const after: Context = { buffer: sep.buffer, position: sep.position };
      const elem = this.element.parseOn(after);
      if (elem.kind === 'failure') {
        if (elements.length >= this.min) break;
        return elem;
      }
      separators.push(sep.value);
      elements.push(elem.value);
      cursor = { buffer: elem.buffer, position: elem.position };
    }

    if (elements.length < this.min) {
      return makeFailure(cursor, `at least ${String(this.min)} elements expected`);
    }
    return success(cursor, new SeparatedList<R, S>(elements, separators), cursor.position);
  }

  override get children(): readonly Parser<unknown>[] {
    return [this.element, this.separator];
  }

  override copy(): this {
    const cloned = Object.create(Object.getPrototypeOf(this) as object) as this;
    Object.assign(cloned, this);
    return cloned;
  }

  override replace(source: Parser<unknown>, target: Parser<unknown>): void {
    if (this.element === source) this.element = target as Parser<R>;
    if (this.separator === source) this.separator = target as Parser<S>;
  }
}

/** Match `element` zero or more times, separated by `separator`. */
export function starSeparated<R, S>(
  element: Parser<R>,
  separator: Parser<S>,
): Parser<SeparatedList<R, S>> {
  return new SeparatedRepeatingParser(element, separator, 0, UNBOUNDED);
}

/** Match `element` one or more times, separated by `separator`. */
export function plusSeparated<R, S>(
  element: Parser<R>,
  separator: Parser<S>,
): Parser<SeparatedList<R, S>> {
  return new SeparatedRepeatingParser(element, separator, 1, UNBOUNDED);
}

/** Match `element` exactly `count` times, separated by `separator`. */
export function timesSeparated<R, S>(
  element: Parser<R>,
  separator: Parser<S>,
  count: number,
): Parser<SeparatedList<R, S>> {
  return new SeparatedRepeatingParser(element, separator, count, count);
}

/** Match `element` between `min` and `max` times, separated by `separator`. */
export function repeatSeparated<R, S>(
  element: Parser<R>,
  separator: Parser<S>,
  min: number,
  max: number,
): Parser<SeparatedList<R, S>> {
  return new SeparatedRepeatingParser(element, separator, min, max);
}
