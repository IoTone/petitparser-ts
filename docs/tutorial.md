# petitparser-ts tutorial

A walkthrough of `petitparser-ts`, building up from a one-line "hello, world" parser to a full JSON parser. Every snippet is real, runnable code; copy any of it into a Node 20+ ESM project that has `@iotone/petitparser` installed.

> If you've used the [Dart PetitParser](https://github.com/petitparser/dart-petitparser) tutorial, you'll find this one structurally similar. The TypeScript port matches the upstream design closely enough that translating between the two is mostly mechanical — see the modernization plan for the few places where TS forced different choices.

---

## 1. What is a parser combinator?

A *parser* is a function that, given some input text and a position, either succeeds (returning a value and a new position) or fails. A *parser combinator* is a function that takes parsers and returns a new parser. So you build a parser for a complex language by composing parsers for smaller pieces — no separate lexer, no parser-generator step, just regular code.

In this library every parser is a `Parser<R>`, where `R` is the type of the value it produces on success. The base shape:

```ts
abstract class Parser<R> {
  parse(input: string): Result<R>;
}

type Result<R> =
  | { kind: 'success'; buffer: string; position: number; value: R }
  | { kind: 'failure'; buffer: string; position: number; message: string };
```

The result is a discriminated union, so TypeScript narrows it for you:

```ts
const result = digit().parse('5');
if (result.kind === 'success') {
  // here `result.value` is `string`
  console.log(result.value); // → "5"
}
```

---

## 2. Hello, parser

The smallest interesting parser is `epsilon()` — it always succeeds, consumes nothing, and returns `undefined`. Useful as an identity element when composing.

```ts
import { epsilon } from '@iotone/petitparser';

epsilon().parse('whatever');
// { kind: 'success', position: 0, value: undefined }
```

To match an actual character, use `char()`:

```ts
import { char } from '@iotone/petitparser';

const a = char('a');
a.parse('a'); // success, value 'a', position 1
a.parse('b'); // failure: '"a" expected' at position 0
```

To match any single character, `any()`. To match a single digit, `digit()`. To match a single ASCII letter, `letter()`. There's also `lowercase`, `uppercase`, `whitespace`, `word` (letters/digits/underscore), `range('a', 'z')`, `anyOf('+-*/')`, `noneOf('"\\')`, and `pattern('a-zA-Z0-9_')` (a regex-like character class without surrounding brackets).

To match a literal multi-character string, `string()`:

```ts
import { string } from '@iotone/petitparser';

string('hello').parse('hello world'); // success, value 'hello'
string('hello', { ignoreCase: true }).parse('HELLO');
```

---

## 3. Combinators

Parsers compose into new parsers. Three patterns are foundational:

```ts
import { char, digit, letter } from '@iotone/petitparser';

// Sequence — A then B then C, value is a tuple.
const ab = char('a').seq(char('b'));
ab.parse('ab'); // success, value ['a', 'b']

// Choice — try A, fall back to B.
const ab_or = char('a').or(char('b'));
ab_or.parse('a'); // 'a'
ab_or.parse('b'); // 'b'

// Repetition — zero or more (`star`), one or more (`plus`).
const digits = digit().plus();
digits.parse('123'); // value ['1', '2', '3']
```

The variadic forms also exist as free functions:

```ts
import { seq, or } from '@iotone/petitparser';

const triple = seq(digit(), letter(), digit()); // Parser<readonly [string, string, string]>
const ax = or(char('a'), char('x')); // Parser<string>
```

A few more useful combinators:

| Method | Purpose |
| --- | --- |
| `.optional()` | succeed with `undefined` if the inner doesn't match |
| `.optional(fallback)` | succeed with `fallback` instead of `undefined` |
| `.times(n)` | exactly `n` matches |
| `.repeat(min, max)` | between `min` and `max` matches |
| `.starSeparated(sep)` | zero or more, separator-delimited |
| `.plusSeparated(sep)` | one or more, separator-delimited |
| `.and()` | positive lookahead — succeed without consuming |
| `.not()` | negative lookahead — succeed if inner fails, consuming nothing |
| `.neg()` | char-level negation: consume one char iff inner fails |
| `.end()` | wrap so the parser must consume the entire input |

---

## 4. Actions: shaping the result

Combinators give you the structure; actions transform the values.

```ts
import { digit } from '@iotone/petitparser';

// `.map` — apply a function to the parsed value.
const number = digit().plus().map((digits) => parseInt(digits.join(''), 10));
number.parse('42'); // value 42

// `.flatten` — return the substring of input that the parser consumed,
// instead of whatever structured value it produced. Faster than `.map(join)`.
const numberStr = digit().plus().flatten();
numberStr.parse('42'); // value '42'

// `.trim` — skip whitespace before and after.
number.trim().parse('  42  '); // value 42

// `.token` — wrap the result in a Token with start/stop/line/column metadata.
const tokenized = number.trim().token();
const t = tokenized.parse('  42  ');
if (t.kind === 'success') {
  t.value.value; // 42
  t.value.start; // 2
  t.value.line;  // 1
}
```

A few more actions:

- `.pick(n)` — pick the n-th element of an array result (negative indexes count from end).
- `.permute([1, 0, 2])` — reorder array result.
- `.cast<T>()` / `.castList<T>()` — type-only narrowing escape hatch.
- `.where(predicate)` — semantic predicate; fail if `predicate(value)` returns false.
- `.constant(value)` — replace the value (e.g. `string('true').constant(true)`).
- `.labeled(name)` — tag with a debug name (visible in linter / trace output).

---

## 5. Recursive grammars: `GrammarDefinition`

Most real grammars have recursive productions: an expression can contain another expression, a JSON value can contain other values. To define those, subclass `GrammarDefinition` and reference your own methods through `this.ref0(...)`:

```ts
import { GrammarDefinition, char, digit, or } from '@iotone/petitparser';

class ArithGrammar extends GrammarDefinition<number> {
  start() { return this.ref0(this.expr).end(); }

  expr() {
    return this.ref0(this.term).seq(
      char('+').trim().seq(this.ref0(this.expr)).optional(),
    ).map(([left, rest]) => rest === undefined ? left : left + rest[1]);
  }

  term() {
    return digit().plus().flatten().trim().map(Number).or(
      char('(').trim().seq(this.ref0(this.expr), char(')').trim()).map(([, e]) => e),
    );
  }
}

const arith = new ArithGrammar().build();
arith.parse('1 + (2 + 3)'); // value 6
```

The `ref0(this.method)` form (and `ref1`..`ref5` for productions that take args) memoizes per-grammar so each production is built exactly once, even when productions recursively reference each other. Behind the scenes it pre-installs a `SettableParser` placeholder so a production can refer to itself before it's fully constructed.

> The `eslint-disable @typescript-eslint/unbound-method` comment you'll see in the JSON example exists because passing a method as a value (`this.ref0(this.value)`) inherently triggers an ESLint warning. The pattern is correct — the `ref` machinery rebinds via `.call(this)` — but ESLint can't tell. Add a file-level disable for grammars.

---

## 6. Building JSON, step by step

This is essentially the [`examples/json/`](../examples/json) parser, broken down. Start with the boring atoms:

```ts
class Json extends GrammarDefinition<JsonValue> {
  start() { return this.ref0(this.value).end(); }

  value() {
    return this.ref0(this.objectValue).or(
      this.ref0(this.arrayValue),
      this.ref0(this.stringValue),
      this.ref0(this.numberValue),
      string('true').constant(true),
      string('false').constant(false),
      string('null').constant(null),
    ).trim();
  }

  numberValue() {
    return char('-').optional('')
      .seq(char('0').or(pattern('1-9').seq(digit().star()).flatten()))
      .seq(char('.').seq(digit().plus().flatten()).flatten().optional(''))
      .seq(pattern('eE').seq(pattern('+-').optional(''), digit().plus().flatten()).flatten().optional(''))
      .flatten()
      .map(Number);
  }
  // ...
}
```

The recursive bits — objects holding values that may themselves be objects — fall out for free because every `this.ref0(this.value)` resolves to the same memoized parser:

```ts
  arrayValue() {
    return char('[').trim()
      .seq(this.ref0(this.value).starSeparated(char(',').trim()), char(']').trim())
      .map(([, items]) => [...items.elements]);
  }

  objectMember() {
    return this.ref0(this.stringValue)
      .seq(char(':').trim(), this.ref0(this.value))
      .map(([k, , v]) => [k, v] as const);
  }

  objectValue() {
    return char('{').trim()
      .seq(this.ref0(this.objectMember).starSeparated(char(',').trim()), char('}').trim())
      .map(([, members]) => Object.fromEntries(members.elements));
  }
```

Result: a parser that produces output structurally identical to `JSON.parse`. See the test suite under [`examples/json/test/`](../examples/json/test) for the byte-identical comparison cases.

---

## 7. Operator precedence: `ExpressionBuilder`

For arithmetic, function application, or any operator-heavy DSL, the manual `expr := term ('+' expr)?` recursive layering above gets repetitive fast. Use `ExpressionBuilder`:

```ts
import { ExpressionBuilder, char, digit } from '@iotone/petitparser';

const builder = new ExpressionBuilder<number>();
builder.primitive(digit().plus().flatten().trim().map(Number));

// Lowest precedence first.
builder.group()
  .left(char('+').trim(), (l, _, r) => l + r)
  .left(char('-').trim(), (l, _, r) => l - r);
builder.group()
  .left(char('*').trim(), (l, _, r) => l * r)
  .left(char('/').trim(), (l, _, r) => l / r);
builder.group()
  .right(char('^').trim(), (l, _, r) => l ** r);  // right-associative
builder.group()
  .prefix(char('-').trim(), (_, v) => -v)
  .wrapper(char('(').trim(), char(')').trim(), (_, v, __) => v);

const expr = builder.build();
expr.parse('1 + 2 * 3').value;     // 7
expr.parse('2^3^2').value;          // 512 — right-associative
expr.parse('-(1 + 2) * 3').value;   // -9
```

Each `.group()` adds a higher-precedence level. Within a group, the application order is fixed (prefix → postfix → left → right), and `wrapper` adds an alternative at the level that re-enters the topmost parser — that's how `()` works.

---

## 8. Reflection and debugging

When a grammar misbehaves, the reflection layer helps you see what's going on:

```ts
import { allParser, linter, optimize, profile, trace } from '@iotone/petitparser';

// Walk every parser reachable from the root.
for (const p of allParser(myGrammar)) console.log(p.constructor.name);

// Catch left recursion, unresolved settables, etc.
const issues = linter(myGrammar);
for (const issue of issues) console.error(`[${issue.type}] ${issue.title}`);

// Flatten nested choices and other rewrites.
const optimized = optimize(myGrammar);

// Wrap every parser with a counting + timing proxy.
const { parser, output } = profile(myGrammar);
parser.parse(largeInput);
output(); // logs per-parser activation counts

// Or a hierarchical call trace:
const traced = trace(myGrammar);
traced.parse(troublesomeInput); // streams enter/exit events
```

There's also `progress()` for backtracking visualization, and `transformParser(root, fn)` if you want to roll your own graph rewrite.

---

## 9. Going further

- **Examples** — see [`examples/`](../examples) for full grammars (JSON, URI, Math, Lisp, Prolog).
- **Modernization plan** — [`modernize-petit-parser-ts-port.md`](../modernize-petit-parser-ts-port.md) tracks design decisions and what's still on the roadmap.
- **API reference** — generated by TypeDoc into `docs/api/index.html` (run `pnpm docs` locally).
- **Upstream Dart docs** — many of the design choices are inherited from [petitparser/dart-petitparser](https://github.com/petitparser/dart-petitparser); their tutorial covers the same ground from a Dart perspective.

If you're new to parser combinators in general, the JSON example is the best starting point — it's small enough to read in one sitting and shows nearly the whole API in one place.
