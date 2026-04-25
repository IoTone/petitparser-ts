import type { Context } from '../core/context.ts';
import { Parser } from '../core/parser.ts';
import type { Result } from '../core/result.ts';
import { transformParser } from '../reflection/transform.ts';

/**
 * One frame of a backtracking visualization: where in the input each parser
 * call entered, and how it ended up.
 */
export interface ProgressFrame {
  readonly parser: Parser<unknown>;
  /** Position the parser was called at. */
  readonly enteredAt: number;
  /** Position after the call ended (`-1` for failures). */
  readonly leftAt: number;
  readonly ok: boolean;
}

export interface ProgressOptions {
  predicate?: (parser: Parser<unknown>) => boolean;
  output?: (frame: ProgressFrame) => void;
}

/**
 * Wraps every parser in the graph with a probe that emits a `ProgressFrame`
 * after each call. Lets you see backtracking in action — useful when a
 * grammar tries many alternatives and you want to spot which one(s) actually
 * advance the cursor.
 */
export function progress<R>(root: Parser<R>, options: ProgressOptions = {}): Parser<R> {
  const predicate = options.predicate ?? (() => true);
  const sink = options.output ?? defaultOutput;
  return transformParser(root, (parser) => {
    if (!predicate(parser)) return parser;
    return new ProgressParser(parser, sink);
  });
}

class ProgressParser<R> extends Parser<R> {
  readonly delegate: Parser<R>;
  readonly #sink: (frame: ProgressFrame) => void;

  constructor(delegate: Parser<R>, sink: (frame: ProgressFrame) => void) {
    super();
    this.delegate = delegate;
    this.#sink = sink;
  }

  override parseOn(context: Context): Result<R> {
    const enteredAt = context.position;
    const result = this.delegate.parseOn(context);
    this.#sink({
      parser: this.delegate,
      enteredAt,
      leftAt: result.kind === 'success' ? result.position : -1,
      ok: result.kind === 'success',
    });
    return result;
  }

  override get children(): readonly Parser<unknown>[] {
    return [this.delegate];
  }
}

function defaultOutput(frame: ProgressFrame): void {
  const arrow = frame.ok ? '✓' : '✗';
  const range = frame.ok
    ? `${String(frame.enteredAt)}→${String(frame.leftAt)}`
    : `${String(frame.enteredAt)} (failed)`;
   
  console.log(`${arrow} ${frame.parser.constructor.name}: ${range}`);
}
