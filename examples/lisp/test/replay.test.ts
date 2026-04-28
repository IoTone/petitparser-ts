import {readFileSync} from "node:fs"
import {dirname, resolve} from "node:path"
import {fileURLToPath} from "node:url"

import {describe, expect, it} from "vitest"

import {
  defaultEnv,
  Env,
  evaluate,
  evaluateAll,
  isTruthy,
  LispGrammar,
  list as listVar,
  show,
  sym,
  TRUE,
  FALSE,
  type LispValue
} from "../src/index.ts"

import {parseKif, type ParsedKifuMove} from "../../../../kif/KifParser"

// ─────────────────────────────────────────────────────────────────────────
// Test infra (mirrors the patterns used in shogi-spec.test.ts)
// ─────────────────────────────────────────────────────────────────────────

const here = dirname(fileURLToPath(import.meta.url))
const rulesPath = resolve(here, "../../../../shogi-rules.lisp")
const kifDir = resolve(here, "../../../../kif/games")
const rulesSrc = readFileSync(rulesPath, "utf8")

const grammar = new LispGrammar().build()

function parseLisp(src: string): LispValue[] {
  const r = grammar.parse(src)
  if (r.kind !== "success") {
    throw new Error(`parse failed: ${r.message} at ${String(r.position)}`)
  }
  return r.value
}

function L(items: LispValue[]): LispValue {
  return listVar(...items)
}
const n = (x: number): LispValue => ({kind: "number", value: x})
const bool = (x: boolean): LispValue => (x ? TRUE : FALSE)

function quoteIfList(v: LispValue): LispValue {
  return v.kind === "list" ? L([sym("quote"), v]) : v
}
function call(env: Env, fn: string, ...args: LispValue[]): LispValue {
  return evaluate(L([sym(fn), ...args.map(quoteIfList)]), env)
}

// ─────────────────────────────────────────────────────────────────────────
// Game state encoding (FSD §S1)
// ─────────────────────────────────────────────────────────────────────────

type Color = 1 | 2

const E = 0
const sP = 101, sL = 102, sN = 103, sS = 104, sG = 105, sB = 106, sR = 107, sK = 108
const gP = 201, gL = 202, gN = 203, gS = 204, gG = 205, gB = 206, gR = 207, gK = 208

function initialBoard(): number[] {
  const b = new Array<number>(81).fill(0)
  const set = (f: number, r: number, c: number) => {
    b[(f - 1) * 9 + (r - 1)] = c
  }
  for (let f = 1; f <= 9; f++) {
    set(f, 3, gP)
    set(f, 7, sP)
  }
  set(1, 9, sL); set(2, 9, sN); set(3, 9, sS); set(4, 9, sG)
  set(5, 9, sK); set(6, 9, sG); set(7, 9, sS); set(8, 9, sN); set(9, 9, sL)
  set(1, 1, gL); set(2, 1, gN); set(3, 1, gS); set(4, 1, gG)
  set(5, 1, gK); set(6, 1, gG); set(7, 1, gS); set(8, 1, gN); set(9, 1, gL)
  // Standard shogi: Sente Rook 2h, Bishop 8h; Gote mirrors at 8b / 2b.
  set(2, 8, sR); set(8, 8, sB)
  set(8, 2, gR); set(2, 2, gB)
  return b
}

function stateLV(
  board: number[],
  senteHand: number[] = [0, 0, 0, 0, 0, 0, 0],
  goteHand: number[] = [0, 0, 0, 0, 0, 0, 0],
  stm: Color = 1,
  moveNum = 1,
  history: number[] = []
): LispValue {
  return L([
    L(board.map(n)),
    L(senteHand.map(n)),
    L(goteHand.map(n)),
    n(stm),
    n(moveNum),
    L(history.map(n))
  ])
}

function moveLV(f1: number, r1: number, f2: number, r2: number, promote: boolean): LispValue {
  return L([sym("move"), n(f1), n(r1), n(f2), n(r2), bool(promote)])
}

function dropLV(base: number, f: number, r: number): LispValue {
  return L([sym("drop"), n(base), n(f), n(r)])
}


function shogiEnv(): Env {
  const env = defaultEnv()
  evaluateAll(parseLisp(rulesSrc), env)
  // (deferred contracts now live in shogi-rules.lisp via FSD §S7)
  return env
}

// ─────────────────────────────────────────────────────────────────────────
// KIF parser sanity checks
// ─────────────────────────────────────────────────────────────────────────

describe("KIF parser", () => {
  it("parses headers and a handful of moves", () => {
    const src = readFileSync(resolve(kifDir, "yagura-open.kif"), "utf8")
    const k = parseKif(src)
    expect(k.meta["手合割"]).toBe("平手")
    expect(k.meta["先手"]).toBe("Test Sente")
    expect(k.meta["後手"]).toBe("Test Gote")
    expect(k.moves.length).toBe(8)

    const m1 = k.moves[0]
    expect(m1.kind).toBe("move")
    if (m1.kind === "move") {
      expect(m1.fromFile).toBe(7)
      expect(m1.fromRank).toBe(7)
      expect(m1.toFile).toBe(7)
      expect(m1.toRank).toBe(6)
      expect(m1.promote).toBe(false)
      expect(m1.pieceBase).toBe(1) // 歩
    }
  })

  it("understands 同 (same destination)", () => {
    const src = `手数----指手---------消費時間--
   1 ７六歩(77)
   2 ３四歩(33)
   3 ７五歩(76)
   4 同　歩(74)`
    const k = parseKif(src)
    expect(k.moves.length).toBe(4)
    const m4 = k.moves[3]
    if (m4.kind !== "move") throw new Error("expected board move")
    expect(m4.toFile).toBe(7)
    expect(m4.toRank).toBe(5)  // same as move 3's destination
    expect(m4.fromFile).toBe(7)
    expect(m4.fromRank).toBe(4)
  })

  it("parses drops with 打", () => {
    const src = `手数----指手---------消費時間--
   1 ５五歩打`
    const k = parseKif(src)
    const m = k.moves[0]
    expect(m.kind).toBe("drop")
    if (m.kind === "drop") {
      expect(m.toFile).toBe(5)
      expect(m.toRank).toBe(5)
      expect(m.pieceBase).toBe(1)
    }
  })

  it("parses promotion suffix 成", () => {
    const src = `手数----指手---------消費時間--
   1 ２二角成(88)`
    const k = parseKif(src)
    const m = k.moves[0]
    if (m.kind !== "move") throw new Error("expected move")
    expect(m.promote).toBe(true)
    expect(m.pieceBase).toBe(6) // 角
    expect(m.pieceWasPromoted).toBe(false)
  })

  it("parses already-promoted glyph (no fresh promotion)", () => {
    const src = `手数----指手---------消費時間--
   1 ２二馬(88)`
    const k = parseKif(src)
    const m = k.moves[0]
    if (m.kind !== "move") throw new Error("expected move")
    expect(m.promote).toBe(false)
    expect(m.pieceWasPromoted).toBe(true)
    expect(m.pieceBase).toBe(6)
  })
})

// ─────────────────────────────────────────────────────────────────────────
// End-to-end replay: parse KIF → drive the LISP engine move by move
// ─────────────────────────────────────────────────────────────────────────

interface ReplayStats {
  moves: number
  ms: number
  movesPerSecond: number
}

function replay(env: Env, kifSrc: string): ReplayStats {
  const kifu = parseKif(kifSrc)
  let state: LispValue = stateLV(initialBoard())
  env.define("__state", state)

  const t0 = performance.now()
  for (const m of kifu.moves) {
    const moveLisp = toLispMove(m)
    const legalityFn = m.kind === "move" ? "move-legal?" : "drop-legal?"
    const applyFn = m.kind === "move" ? "apply-move-state" : "apply-drop-state"
    // `call()` already quotes any list-typed args; do NOT pre-quote.
    let legality: LispValue
    try {
      legality = call(env, legalityFn, state, moveLisp)
    } catch (e) {
      throw new Error(`legality threw at move ${m.num} (${describeMove(m)}): ${(e as Error).message}`)
    }
    if (!isTruthy(legality)) {
      throw new Error(
        `move ${m.num} rejected by engine: ${describeMove(m)} — got ${show(legality)}`
      )
    }
    try {
      state = call(env, applyFn, state, moveLisp)
    } catch (e) {
      throw new Error(`apply threw at move ${m.num} (${describeMove(m)}): ${(e as Error).message}`)
    }
  }
  const t1 = performance.now()

  return {
    moves: kifu.moves.length,
    ms: t1 - t0,
    movesPerSecond: (kifu.moves.length / (t1 - t0)) * 1000
  }
}

function toLispMove(m: ParsedKifuMove): LispValue {
  if (m.kind === "drop") {
    return dropLV(m.pieceBase, m.toFile, m.toRank)
  }
  return moveLV(m.fromFile, m.fromRank, m.toFile, m.toRank, m.promote)
}

function describeMove(m: ParsedKifuMove): string {
  if (m.kind === "drop") return `drop base=${m.pieceBase} → (${m.toFile},${m.toRank})`
  return `move (${m.fromFile},${m.fromRank}) → (${m.toFile},${m.toRank}) promote=${m.promote}`
}

/**
 * The replay corpus. Each entry pairs a kifu file with the expected move
 * count (cheap regression check that the parser didn't drop any moves)
 * and a one-line note about which engine paths it exercises.
 *
 * These are constructed test fixtures derived from named opening
 * patterns; real famous-game KIFs can replace them as we source
 * verified records (see docs/replay.md §6 roadmap).
 */
const CORPUS: ReadonlyArray<{
  file: string
  moves: number
  exercises: string
}> = [
  {file: "yagura-open.kif",       moves: 8,  exercises: "basic step movements (R-MV.4)"},
  {file: "bishop-trade.kif",      moves: 4,  exercises: "bishop slide + capture + 成 promotion + 同 marker"},
  {file: "drop-bishop.kif",       moves: 6,  exercises: "exchange + 打 drop (R-DR.1, R-DR.2)"},
  {file: "ranging-rook.kif",      moves: 6,  exercises: "rook horizontal slide along rank 8 (Furibisha)"},
  {file: "yagura-extended.kif",   moves: 12, exercises: "12-move Yagura development (throughput)"},
  // Real-game KIFs from lishogi.org — see docs/replay.md §4.
  {file: "sample.kif", moves: 5,
   exercises: "lishogi format — multi-space layout, time annotations, 中断 terminator"},
  {file: "lishogi_game_2025_11_08_pedestrian_vs_Anonymous_t2O34rvK.kif", moves: 13,
   exercises: "lishogi 9×9 game with multiple captures, drops, '* comment' lines"},
  {file: "lishogi_game_2021_09_18_1-kyu_magicshow_vs_6-Dan_Sniper_jYLWr57k.kif", moves: 78,
   exercises: "78-move 平手 game ending in 詰み — full corpus stress test"}
]

// Minishogi (5×5, 手合割：5五将棋) games are NOT in the corpus — our engine
// is 9×9 standard shogi. The two lishogi Minishogi files
// (2025_08_31 and 2026_04_02) sit alongside as raw assets for the future
// when Minishogi support becomes a thing. Attempting to replay them today
// fails on move 1 because their initial position is a 5×5 layout not
// compatible with `initialBoard()`. See docs/replay.md §1 / §6 roadmap.

/**
 * Hard performance floor for replay throughput. Below this = a real
 * regression worth investigating, not just CPU contention.
 *
 * Realistic measurements vary widely by run depending on system load:
 *   - 78-move 平手 game: 20–105 moves/s
 *   - Drop-heavy short games:  9–55 moves/s (uchifuzume? does full
 *     opponent move generation; this is genuinely O(N²) in moves)
 *   - Cold-start short games: 13–90 moves/s, dominated by JIT warmup
 *
 * 5 moves/s catches a ≥10× regression from realistic baselines without
 * false-firing on system noise. Keep this in sync with
 * docs/verification.md §6.
 */
const PERFORMANCE_FLOOR_MOVES_PER_SEC = 5

describe("Replay harness — corpus", () => {
  for (const entry of CORPUS) {
    it(`replays ${entry.file} (${entry.exercises})`, () => {
      const env = shogiEnv()
      const src = readFileSync(resolve(kifDir, entry.file), "utf8")
      const stats = replay(env, src)
      expect(stats.moves).toBe(entry.moves)
      // eslint-disable-next-line no-console
      console.log(
        `[replay] ${entry.file}: ${stats.moves} moves in ${stats.ms.toFixed(1)} ms ` +
          `(${stats.movesPerSecond.toFixed(0)} moves/s)`
      )
      // Performance floor — a regression that drops engine throughput below
      // this number is a failure, not a warning. Keep in sync with
      // docs/verification.md §6.
      expect(stats.movesPerSecond).toBeGreaterThan(PERFORMANCE_FLOOR_MOVES_PER_SEC)
    })
  }
})
