import type { Context } from '../core/context.ts';
import { Parser } from '../core/parser.ts';
import type { Result } from '../core/result.ts';
import { transformParser } from '../reflection/transform.ts';

/**
 * One-line profile entry: how often a parser was invoked and how long it
 * spent (in milliseconds, summed across calls).
 */
export interface ProfileFrame {
  readonly parser: Parser<unknown>;
  /** Number of times `parseOn` was called on this parser. */
  readonly count: number;
  /** Total time across all calls, in milliseconds (uses `performance.now()`). */
  readonly elapsedMs: number;
}

export interface ProfileOptions {
  /** Filter — only wrap parsers for which this returns true. Default: all parsers. */
  predicate?: (parser: Parser<unknown>) => boolean;
  /** Where to send the per-parser frames once `output()` is called. Default: `console.log`. */
  output?: (frames: readonly ProfileFrame[]) => void;
}

/**
 * Wraps every parser in the graph with a counting+timing proxy. Returns a
 * pair: a profiled root parser and an `output()` function that flushes the
 * collected frames to the configured sink.
 *
 * Usage:
 *
 *     const { parser, output } = profile(myGrammar);
 *     for (const input of corpus) parser.parse(input);
 *     output();   // logs per-parser activation counts + total ms
 */
export function profile<R>(
  root: Parser<R>,
  options: ProfileOptions = {},
): { parser: Parser<R>; output: () => void } {
  const predicate = options.predicate ?? (() => true);
  const sink = options.output ?? defaultOutput;
  const stats = new Map<Parser<unknown>, { count: number; elapsedMs: number }>();

  const profiled = transformParser(root, (parser) => {
    if (!predicate(parser)) return parser;
    const slot = { count: 0, elapsedMs: 0 };
    stats.set(parser, slot);
    return new ProfilingParser(parser, slot);
  });

  return {
    parser: profiled,
    output: () => {
      const frames: ProfileFrame[] = [];
      for (const [parser, slot] of stats) {
        frames.push({ parser, count: slot.count, elapsedMs: slot.elapsedMs });
      }
      sink(frames);
    },
  };
}

class ProfilingParser<R> extends Parser<R> {
  readonly delegate: Parser<R>;
  readonly #slot: { count: number; elapsedMs: number };

  constructor(delegate: Parser<R>, slot: { count: number; elapsedMs: number }) {
    super();
    this.delegate = delegate;
    this.#slot = slot;
  }

  override parseOn(context: Context): Result<R> {
    this.#slot.count++;
    const start = performance.now();
    try {
      return this.delegate.parseOn(context);
    } finally {
      this.#slot.elapsedMs += performance.now() - start;
    }
  }

  override get children(): readonly Parser<unknown>[] {
    return [this.delegate];
  }
}

function defaultOutput(frames: readonly ProfileFrame[]): void {
  const sorted = [...frames].sort((a, b) => b.elapsedMs - a.elapsedMs);
  for (const f of sorted) {
     
    console.log(
      `${f.parser.constructor.name.padEnd(28)} count=${String(f.count).padStart(6)} elapsed=${f.elapsedMs.toFixed(2).padStart(8)}ms`,
    );
  }
}
