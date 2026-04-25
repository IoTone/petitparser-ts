# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (Phase 0 — foundation)
- Modern TypeScript scaffold: strict `tsconfig.json` (ES2022, ESM, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- Build via `tsup` (dual ESM/CJS + `.d.ts`).
- Tests via `vitest`.
- Lint via `eslint` flat config + `typescript-eslint` (type-checked rules).
- Format via `prettier`.
- GitHub Actions CI on Node 20 / 22.
- Stub `src/core/{parser,context,result}.ts` with generic `Parser<R>`, discriminated-union `Result<R>`, immutable `Context`, and a trivial `EpsilonParser` proof of life.
- First vitest test asserting `EpsilonParser` returns `Success<undefined>` at position 0.

### Changed
- 2014 source moved to `legacy/` for cross-checking behavior during the rewrite.

### Removed
- Grunt build pipeline.
- QUnit-in-browser test harness.
- Bundled `vendor/qunit-1.15.0.*` files.

## Notes

This project is a fork-only modernization of the 2013–2014 TypeScript port by
Rasmus Schultz, tracking modern Dart PetitParser (currently 7.0.2) for design
reference. Pre-1.0 versions are not API-stable. See `modernize-petit-parser-ts-port.md`
for the phased roadmap.
