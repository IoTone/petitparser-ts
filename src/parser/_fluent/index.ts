// Side-effect imports — installs every fluent method on Parser.prototype and
// CharacterParser.prototype. Importing this barrel grants access to the full
// chainable surface (`.seq().or().star().trim().map(...)`-style usage).
//
// Users who prefer free functions for tree-shaking should skip this barrel
// and import the individual `combinator/*.ts`, `repeater/*.ts`, `action/*.ts`
// modules directly.
import './combinators.ts';
import './repeaters.ts';
import './separated.ts';
import './strings.ts';
