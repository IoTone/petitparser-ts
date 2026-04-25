# petitparser-ts

> TypeScript port of [PetitParser](https://github.com/petitparser/dart-petitparser), a dynamic parser combinator framework.

This is a **modernized fork** of the 2013–2014 TypeScript port by Rasmus Schultz, tracking the design of modern Dart PetitParser **7.0.2** (Feb 2026). It is maintained as a private fork by iotone — there is no upstream relationship beyond cross-referencing the Dart sources for API parity.

## Status

| Phase | Scope | Status |
| --- | --- | :-: |
| 0 | Foundation: tooling, build, test, CI | ✅ |
| 1 | Core rewrite: `Parser<R>`, primitives, character parsers | ✅ |
| 2 | Combinators & repeaters (variadic typed `seq`/`or`, `starSeparated`) | ✅ |
| 3 | Actions, matcher, `GrammarDefinition` | ✅ |
| 4 | `ExpressionBuilder<T>` | ✅ |
| 5 | Reflection, optimizer, linter, debug helpers | ✅ |
| 6 | Examples (JSON, URI, Math, Lisp, Prolog) | ✅ |
| 7 | Unicode, indent-sensitive, polish | ✅ |

Examples deferred from Phase 6: Regexp, Smalltalk, Pascal, Dart. v1.0.0 publish, gh-pages docs deploy, and a JSON-vs-`JSON.parse` benchmark are pending maintainer action — see the modernization plan.

See [`modernize-petit-parser-ts-port.md`](./modernize-petit-parser-ts-port.md) for the full plan and design decisions.

## Quick start

```ts
import { char, digit, GrammarDefinition } from '@iotone/petitparser';

class Math extends GrammarDefinition<number> {
  start() { return this.ref0(this.expr).end(); }

  expr() {
    return this.ref0(this.term)
      .seq(char('+').trim().seq(this.ref0(this.expr)).optional())
      .map(([l, r]) => r === undefined ? l : l + r[1]);
  }

  term() {
    return digit().plus().flatten().trim().map(Number);
  }
}

new Math().build().parse('1 + 2 + 3').value;  // 6
```

For a deeper walkthrough see [`docs/tutorial.md`](./docs/tutorial.md).

## Development

Requires Node 20+ and pnpm.

```sh
pnpm install
pnpm verify       # lint + typecheck + test + build
pnpm test:watch   # vitest in watch mode
pnpm docs         # generate API reference into docs/api/
```

## Layout

```
src/        modern TS source (mirrors upstream `lib/src/<area>/<concept>.dart`)
test/       vitest tests
legacy/     2014 source — kept for cross-checking behavior, not built
docs/       tutorial + generated API reference (docs/api is gitignored)
examples/   JSON, URI, Math, Lisp, Prolog
```

## Documentation

- **[Tutorial](./docs/tutorial.md)** — building up from "hello, world" to a full JSON parser.
- **[Examples](./examples)** — five real grammars with tests.
- **API reference** — `pnpm docs` generates a TypeDoc site at `docs/api/index.html`.
- **[Modernization plan](./modernize-petit-parser-ts-port.md)** — phase-by-phase roadmap and design decisions.

## Attribution

- **Lukas Renggli** — original author of PetitParser (Smalltalk, Java, Dart). The Dart implementation at <https://github.com/petitparser/dart-petitparser> is the canonical reference for this port.
- **Rasmus Schultz** — original 2013 TypeScript port (now under [`legacy/`](./legacy)).
- **iotone** — 2026 modernization.

## License

MIT — see [`LICENSE`](./LICENSE).
