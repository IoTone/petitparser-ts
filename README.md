# petitparser-ts

> TypeScript port of [PetitParser](https://github.com/petitparser/dart-petitparser), a dynamic parser combinator framework.

This is a **modernized fork** of the 2013–2014 TypeScript port by Rasmus Schultz, tracking the design of modern Dart PetitParser **7.0.2** (Feb 2026). It is maintained as a private fork by iotone — there is no upstream relationship beyond cross-referencing the Dart sources for API parity.

## Status

> **Pre-1.0 — under active modernization.** Not yet published to npm. Not API-stable.

| Phase | Scope | Status |
| --- | --- | :-: |
| 0 | Foundation: tooling, build, test, CI | ✅ |
| 1 | Core rewrite: `Parser<R>`, primitives, character parsers | ⏳ |
| 2 | Combinators & repeaters (typed `seq2..seq9`, `starSeparated`) | ⏳ |
| 3 | Actions, matcher, `GrammarDefinition` | ⏳ |
| 4 | `ExpressionBuilder<T>` | ⏳ |
| 5 | Reflection, optimizer, linter, debug helpers | ⏳ |
| 6 | Examples (JSON, URI, Math, Regexp, Lisp, Prolog) | ⏳ |
| 7 | Unicode, indent-sensitive, polish, v1.0.0 | ⏳ |

See [`modernize-petit-parser-ts-port.md`](./modernize-petit-parser-ts-port.md) for the full plan.

## Development

Requires Node 20+ and pnpm.

```sh
pnpm install
pnpm verify       # lint + typecheck + test + build
pnpm test:watch   # vitest in watch mode
```

## Layout

```
src/      # modern TS source (target: mirror upstream `lib/src/<area>/<concept>.dart`)
test/     # vitest tests
legacy/   # 2014 source — kept for cross-checking behavior, not built
docs/     # tutorial + API reference
examples/ # ports of dart-petitparser-examples
```

## Attribution

- **Lukas Renggli** — original author of PetitParser (Smalltalk, Java, Dart). The Dart implementation at <https://github.com/petitparser/dart-petitparser> is the canonical reference for this port.
- **Rasmus Schultz** — original 2013 TypeScript port (now under [`legacy/`](./legacy)).
- **iotone** — 2026 modernization.

## License

MIT — see [`LICENSE`](./LICENSE).
