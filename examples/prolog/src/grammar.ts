import type { Parser } from '../../../src/core/parser.ts';
import { GrammarDefinition } from '../../../src/definition/grammar.ts';
import { char } from '../../../src/parser/character/char.ts';
import { digit } from '../../../src/parser/character/digit.ts';
import { letter } from '../../../src/parser/character/letter.ts';
import { lowercase } from '../../../src/parser/character/lowercase.ts';
import { noneOf } from '../../../src/parser/character/noneOf.ts';
import { uppercase } from '../../../src/parser/character/uppercase.ts';
import { whitespace } from '../../../src/parser/character/whitespace.ts';
import { string } from '../../../src/parser/predicate/string.ts';

import { cons, EMPTY_LIST, type Clause, type Term } from './types.ts';

import '../../../src/parser/_fluent/index.ts';

/* eslint-disable @typescript-eslint/unbound-method */

/**
 * Prolog grammar — small but capable. Supports:
 *
 *   parent(tom, bob).                         a fact
 *   grandparent(X, Z) :- parent(X, Y), parent(Y, Z).   a rule
 *   append([], L, L).                          a list-using fact
 *   append([H|T], L, [H|R]) :- append(T, L, R).        a list-using rule
 *   ?- parent(tom, X).                         a query (returns Term[])
 *
 * `parseProgram(input)` returns `Clause[]`. `parseQuery(input)` returns the
 * goal list (one or more terms separated by `,`, terminated by `.`).
 *
 * Out of scope (intentional): operator declarations, arithmetic (`is/2`),
 * cut (`!`), assert/retract, modules, character escapes in quoted atoms.
 */
export class PrologGrammar extends GrammarDefinition<Clause[]> {
  override start(): Parser<Clause[]> {
    return this.ref0(this.program).end();
  }

  /** A program is a sequence of clauses. */
  program(): Parser<Clause[]> {
    return this.ref0(this.spacing).seq(this.ref0(this.clause).star()).map(([, clauses]) => clauses);
  }

  /** `head.` (fact) or `head :- body.` (rule). */
  clause(): Parser<Clause> {
    return this.ref0(this.term)
      .seq(this.tok(string(':-')).seq(this.ref0(this.commaList)).optional(), this.tok(char('.')))
      .map(([head, body]) => ({
        head,
        body: body === undefined ? [] : body[1],
      }));
  }

  /** Comma-separated list of terms (used for clause bodies and queries). */
  commaList(): Parser<Term[]> {
    return this.ref0(this.term)
      .plusSeparated(this.tok(char(',')))
      .map((sep) => [...sep.elements]);
  }

  term(): Parser<Term> {
    return this.tok(
      this.ref0(this.numberLit).or(
        this.ref0(this.variableLit),
        this.ref0(this.listLit),
        this.ref0(this.compoundLit),
        this.ref0(this.atomLit),
        this.tok(char('('))
          .seq(this.ref0(this.term), this.tok(char(')')))
          .map(([, t]) => t),
      ),
    );
  }

  /** Integer numbers (no decimal in this dialect). */
  numberLit(): Parser<Term> {
    return char('-')
      .optional('')
      .seq(digit().plus().flatten())
      .flatten()
      .map((s) => ({ kind: 'number' as const, value: Number(s) }));
  }

  /** Variables: uppercase first letter, or starting with `_`. */
  variableLit(): Parser<Term> {
    const idTail = letter().or(digit(), char('_')).star();
    const upper = uppercase().seq(idTail).flatten();
    const underscore = char('_').seq(idTail).flatten();
    return upper.or(underscore).map((name) => ({ kind: 'variable' as const, name }));
  }

  /** `[]`, `[a, b, c]`, `[H | T]` — desugars to nested `.`/2 compounds. */
  listLit(): Parser<Term> {
    const empty = char('[').seq(this.tok(char(']'))).constant(EMPTY_LIST);
    const filled = char('[')
      .seq(
        this.ref0(this.term).plusSeparated(this.tok(char(','))),
        this.tok(char('|')).seq(this.ref0(this.term)).optional(),
        this.tok(char(']')),
      )
      .map(([, items, tail]) => {
        let result: Term = tail !== undefined ? tail[1] : EMPTY_LIST;
        for (let i = items.elements.length - 1; i >= 0; i--) {
          result = cons(items.elements[i]!, result);
        }
        return result;
      });
    return empty.or(filled);
  }

  /** `functor(arg1, arg2, ...)`. The functor is a lowercase identifier. */
  compoundLit(): Parser<Term> {
    return this.ref0(this.lowercaseId)
      .seq(char('('), this.ref0(this.commaList), this.tok(char(')')))
      .map(([functor, , args]) => ({
        kind: 'compound' as const,
        functor,
        args,
      }));
  }

  /** Bare atom (lowercase identifier with no parens). */
  atomLit(): Parser<Term> {
    return this.ref0(this.lowercaseId).map((name) => ({ kind: 'atom' as const, name }));
  }

  /** A lowercase-leading identifier — used by both atoms and compound functors. */
  lowercaseId(): Parser<string> {
    return lowercase().seq(letter().or(digit(), char('_')).star()).flatten();
  }

  /** Whitespace + `%` line comments. */
  spacing(): Parser<unknown> {
    const comment = char('%').seq(noneOf('\n').star()).flatten();
    return whitespace().or(comment).star();
  }

  /**
   * Wrap a token-level parser so leading and trailing whitespace AND `%`-line
   * comments are skipped. Plain `.trim()` only eats whitespace; we need this
   * helper anywhere comments could legitimately appear between tokens.
   */
  tok<R>(p: Parser<R>): Parser<R> {
    return p.trim(this.ref0(this.spacing));
  }
}

/** Convenience: parse a `?- goal1, goal2.` style query into a goal list. */
export function parseQuery(input: string): Term[] {
  const grammar = new PrologGrammar();
  const queryParser = grammar
    .buildFrom(grammar.ref0(grammar.commaList).seq(grammar.tok(char('.'))).end())
    .map(([goals]) => goals);
  const r = queryParser.parse(input.replace(/^\s*\?-\s*/, ''));
  if (r.kind !== 'success') {
    throw new Error(`query parse failed: ${r.message} at ${String(r.position)}`);
  }
  return r.value;
}
