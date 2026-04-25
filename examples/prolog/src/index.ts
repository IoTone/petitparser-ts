export { PrologGrammar, parseQuery } from './grammar.ts';
export {
  EMPTY_LIST,
  atom,
  compound,
  cons,
  list,
  num,
  show,
  variable,
  type Bindings,
  type Clause,
  type Database,
  type Term,
} from './types.ts';
export { unify, walk, walkDeep } from './unify.ts';
export { renameClause, solve } from './solver.ts';
