/**
 * AST types matching what `JSON.parse` returns. The grammar in `grammar.ts`
 * produces values of type `JsonValue` directly, so consumers can drop our
 * parser into anything that already speaks plain JSON.
 */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };
