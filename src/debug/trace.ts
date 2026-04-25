import type { Context } from '../core/context.ts';
import { Parser } from '../core/parser.ts';
import type { Result } from '../core/result.ts';
import { transformParser } from '../reflection/transform.ts';

/** A single trace entry — emitted on every `parseOn` enter and exit. */
export interface TraceEvent {
  readonly kind: 'enter' | 'exit';
  /** Indentation level, equal to recursion depth. */
  readonly depth: number;
  readonly parser: Parser<unknown>;
  readonly position: number;
  /** On exit only — the result of the call. */
  readonly result?: Result<unknown>;
}

export interface TraceOptions {
  predicate?: (parser: Parser<unknown>) => boolean;
  output?: (event: TraceEvent) => void;
}

/**
 * Wraps every parser in the graph with a tracing proxy that emits a
 * `TraceEvent` on call enter and exit. Useful for understanding why a parser
 * succeeded or failed at a specific position.
 *
 * Returns the wrapped root. To enable tracing, parse with the wrapped parser;
 * to disable, parse with the original.
 */
export function trace<R>(root: Parser<R>, options: TraceOptions = {}): Parser<R> {
  const predicate = options.predicate ?? (() => true);
  const sink = options.output ?? defaultOutput;
  const depth = { value: 0 };
  return transformParser(root, (parser) => {
    if (!predicate(parser)) return parser;
    return new TracingParser(parser, depth, sink);
  });
}

class TracingParser<R> extends Parser<R> {
  readonly delegate: Parser<R>;
  readonly #depth: { value: number };
  readonly #sink: (event: TraceEvent) => void;

  constructor(delegate: Parser<R>, depth: { value: number }, sink: (event: TraceEvent) => void) {
    super();
    this.delegate = delegate;
    this.#depth = depth;
    this.#sink = sink;
  }

  override parseOn(context: Context): Result<R> {
    this.#sink({
      kind: 'enter',
      depth: this.#depth.value,
      parser: this.delegate,
      position: context.position,
    });
    this.#depth.value++;
    const result = this.delegate.parseOn(context);
    this.#depth.value--;
    this.#sink({
      kind: 'exit',
      depth: this.#depth.value,
      parser: this.delegate,
      position: context.position,
      result,
    });
    return result;
  }

  override get children(): readonly Parser<unknown>[] {
    return [this.delegate];
  }
}

function defaultOutput(event: TraceEvent): void {
  const indent = '  '.repeat(event.depth);
  const arrow = event.kind === 'enter' ? '→' : '←';
  const tag = event.kind === 'exit' && event.result
    ? event.result.kind === 'success'
      ? `success @ ${String(event.result.position)}`
      : `failure @ ${String(event.result.position)}: ${event.result.message}`
    : `pos ${String(event.position)}`;
   
  console.log(`${indent}${arrow} ${event.parser.constructor.name} (${tag})`);
}
