// Perft + invariant tests for the AI engine's BoardState.
//
// These are baseline correctness checks that any move-generator /
// king-safety optimization must preserve. The expected counts are
// captured the first time we run; later optimizations must reproduce
// them exactly. Numbers come from the current (king-cache) generator
// and are then locked.
//
// Initial position legal-move count is the well-known shogi value (30
// for the side-to-move from the starting position), which sanity-checks
// the very first number against an external authority.

import {describe, expect, it} from "vitest"
import {
  Action,
  BoardState,
  KIND_MOVE,
  KIND_DROP,
  applyActionInPlace,
  evaluateMaterial,
  findKing,
  generateLegalActions,
  kingInCheck,
  resetActionPool,
  resetUndoStack,
  restoreActionPoolCursor,
  snapshotActionPoolCursor,
  undoActionInPlace
} from "../../../Shogi0/Assets/Scripts/Shogi/Engine/BoardState"

// ── Initial position builder (mirrors Engine/Fixtures.initialBoard) ─────

const sP = 101, sL = 102, sN = 103, sS = 104, sG = 105, sB = 106, sR = 107, sK = 108
const gP = 201, gL = 202, gN = 203, gS = 204, gG = 205, gB = 206, gR = 207, gK = 208

function initialState(): BoardState {
  resetUndoStack()
  resetActionPool()
  const s = new BoardState()
  const set = (f: number, r: number, c: number): void => {
    s.board[(f - 1) * 9 + (r - 1)] = c
  }
  for (let f = 1; f <= 9; f++) {
    set(f, 3, gP)
    set(f, 7, sP)
  }
  set(1, 9, sL); set(2, 9, sN); set(3, 9, sS); set(4, 9, sG)
  set(5, 9, sK); set(6, 9, sG); set(7, 9, sS); set(8, 9, sN); set(9, 9, sL)
  set(1, 1, gL); set(2, 1, gN); set(3, 1, gS); set(4, 1, gG)
  set(5, 1, gK); set(6, 1, gG); set(7, 1, gS); set(8, 1, gN); set(9, 1, gL)
  set(2, 8, sR); set(8, 8, sB)
  set(8, 2, gR); set(2, 2, gB)
  s.stm = 1
  // Seed king-square cache the same way lispToBoardState does.
  s.senteKingIdx = -1
  s.goteKingIdx = -1
  for (let i = 0; i < 81; i++) {
    const p = s.board[i]
    if (p === 0) continue
    const raw = p >= 200 ? p - 200 : p - 100
    const base = raw >= 50 ? raw - 50 : raw
    if (base !== 8) continue
    if (p >= 200) s.goteKingIdx = i
    else s.senteKingIdx = i
  }
  return s
}

function boardHash(s: BoardState): string {
  // Deterministic stringification — used to verify make/unmake roundtrips.
  let h = `stm:${s.stm}|kS:${s.senteKingIdx}|kG:${s.goteKingIdx}|b:`
  for (let i = 0; i < 81; i++) h += s.board[i] + ","
  h += "|h1:"
  for (let i = 0; i < 7; i++) h += s.senteHand[i] + ","
  h += "|h2:"
  for (let i = 0; i < 7; i++) h += s.goteHand[i] + ","
  return h
}

// ── Perft ──────────────────────────────────────────────────────────────

function perft(s: BoardState, depth: number): number {
  if (depth === 0) return 1
  const moves: Action[] = []
  const cursor = snapshotActionPoolCursor()
  generateLegalActions(s, moves)
  if (depth === 1) {
    restoreActionPoolCursor(cursor)
    return moves.length
  }
  let total = 0
  for (let i = 0; i < moves.length; i++) {
    applyActionInPlace(s, moves[i])
    total += perft(s, depth - 1)
    undoActionInPlace(s)
  }
  restoreActionPoolCursor(cursor)
  return total
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("BoardState — initial position invariants", () => {
  it("seeds king-square cache to correct squares", () => {
    const s = initialState()
    // Sente king at (5, 9) → (5-1)*9 + (9-1) = 4*9 + 8 = 44.
    // Gote king at (5, 1) → (5-1)*9 + (1-1) = 36.
    expect(s.senteKingIdx).toBe(44)
    expect(s.goteKingIdx).toBe(36)
    expect(findKing(s, 1)).toBe(44)
    expect(findKing(s, 2)).toBe(36)
  })

  it("reports no king-in-check at start for either side", () => {
    const s = initialState()
    expect(kingInCheck(s, 1)).toBe(false)
    expect(kingInCheck(s, 2)).toBe(false)
  })

  it("initial material is balanced (eval = 0 for stm=1)", () => {
    const s = initialState()
    expect(evaluateMaterial(s)).toBe(0)
  })
})

describe("BoardState — perft (move-generator correctness)", () => {
  it("perft(1) = 30 for Sente from initial position (canonical shogi value)", () => {
    const s = initialState()
    expect(perft(s, 1)).toBe(30)
  })

  // perft(2) value is locked from the current (post-king-cache) generator
  // on 2026-05-22. Any future optimization must reproduce it exactly.
  // Canonical shogi perft(2) is known to be 900.
  it("perft(2) = 900 from initial position (canonical)", () => {
    const s = initialState()
    expect(perft(s, 2)).toBe(900)
  })

  // perft(3) explores ~25K nodes and traverses positions where the bishop
  // and rook diagonals can be unblocked — exercising pin detection and
  // discovered-attack handling. The canonical published value is 25,470.
  it("perft(3) = 25470 from initial position (canonical)", () => {
    const s = initialState()
    expect(perft(s, 3)).toBe(25470)
  })
})

describe("BoardState — pin / discovered-attack stress positions", () => {
  // Construct a position where Sente has a piece pinned to its king by a
  // gote bishop. The pinned piece must be legal only along the pin line.
  function pinnedSilverPosition(): BoardState {
    resetUndoStack()
    resetActionPool()
    const s = new BoardState()
    const set = (f: number, r: number, c: number): void => {
      s.board[(f - 1) * 9 + (r - 1)] = c
    }
    // Sente king at (5, 9). Sente silver at (4, 8). Gote bishop at (2, 6).
    // King-silver-bishop colinear on the (-1, -1) diagonal from king ⇒
    // silver is pinned along that line.
    set(5, 9, sK)
    set(4, 8, sS)
    set(2, 6, gB)
    // Gote king at (5, 1) (must exist; off the action).
    set(5, 1, gK)
    s.stm = 1
    s.senteKingIdx = (5 - 1) * 9 + (9 - 1)
    s.goteKingIdx = (5 - 1) * 9 + (1 - 1)
    return s
  }

  it("detects pin on silver between king and enemy bishop", () => {
    const s = pinnedSilverPosition()
    const moves: Action[] = []
    generateLegalActions(s, moves)
    // The silver at (4, 8) can only move along the pin diagonal (-1, -1)
    // and back (+1, +1): toward (3, 7) (capturing nothing) or (5, 9) — but
    // (5, 9) is occupied by own king, blocked. Or capturing the bishop
    // by sliding... silvers don't slide. So legal silver moves: (3, 7).
    // We don't assert specific squares (silver has 5 shape-legal moves;
    // only one stays on the pin line), but we do assert that perft(1)
    // is reduced vs. an unrestricted silver — and that the king is not
    // left in check by any returned move.
    const silverMoves = moves.filter(m => m.kind === KIND_MOVE && m.fromFile === 4 && m.fromRank === 8)
    expect(silverMoves.length).toBeGreaterThan(0)
    expect(silverMoves.length).toBeLessThan(5) // pinned, not free
    // Every returned silver move must keep the king off-check (sanity).
    for (const mv of silverMoves) {
      applyActionInPlace(s, mv)
      expect(kingInCheck(s, 1)).toBe(false)
      undoActionInPlace(s)
    }
  })

  function checkedKingPosition(): BoardState {
    resetUndoStack()
    resetActionPool()
    const s = new BoardState()
    const set = (f: number, r: number, c: number): void => {
      s.board[(f - 1) * 9 + (r - 1)] = c
    }
    // Sente king at (5, 9) being checked by gote rook at (5, 4) along
    // the (0, -1) file (rank 4 → 9 ortho line, no blockers).
    set(5, 9, sK)
    set(5, 4, gR)
    set(5, 1, gK)
    s.stm = 1
    s.senteKingIdx = (5 - 1) * 9 + (9 - 1)
    s.goteKingIdx = (5 - 1) * 9 + (1 - 1)
    return s
  }

  it("when king is in check, every returned move escapes check", () => {
    const s = checkedKingPosition()
    expect(kingInCheck(s, 1)).toBe(true)
    const moves: Action[] = []
    generateLegalActions(s, moves)
    expect(moves.length).toBeGreaterThan(0)
    for (const mv of moves) {
      applyActionInPlace(s, mv)
      // After every "legal escape" move, the original king must not be
      // in check (it may have moved, but the side now-to-move's opponent
      // is Sente — the original mover).
      expect(kingInCheck(s, 1)).toBe(false)
      undoActionInPlace(s)
    }
  })
})

describe("BoardState — apply/undo invariants", () => {
  it("apply/undo every legal initial move restores the exact state", () => {
    const s = initialState()
    const before = boardHash(s)
    const moves: Action[] = []
    const cursor = snapshotActionPoolCursor()
    generateLegalActions(s, moves)
    for (let i = 0; i < moves.length; i++) {
      applyActionInPlace(s, moves[i])
      undoActionInPlace(s)
      expect(boardHash(s)).toBe(before)
    }
    restoreActionPoolCursor(cursor)
  })

  it("two-ply apply/undo restores the exact state", () => {
    const s = initialState()
    const before = boardHash(s)
    const moves1: Action[] = []
    const c1 = snapshotActionPoolCursor()
    generateLegalActions(s, moves1)
    for (let i = 0; i < moves1.length; i++) {
      applyActionInPlace(s, moves1[i])
      const moves2: Action[] = []
      const c2 = snapshotActionPoolCursor()
      generateLegalActions(s, moves2)
      for (let j = 0; j < moves2.length; j++) {
        applyActionInPlace(s, moves2[j])
        undoActionInPlace(s)
      }
      restoreActionPoolCursor(c2)
      undoActionInPlace(s)
      expect(boardHash(s)).toBe(before)
    }
    restoreActionPoolCursor(c1)
  })

  it("king-cache stays consistent with linear scan after make/unmake", () => {
    const s = initialState()
    const moves: Action[] = []
    const cursor = snapshotActionPoolCursor()
    generateLegalActions(s, moves)
    for (let i = 0; i < moves.length; i++) {
      applyActionInPlace(s, moves[i])
      // Linear-scan reference: find the king by scanning all 81 cells.
      let refS = -1, refG = -1
      for (let k = 0; k < 81; k++) {
        const p = s.board[k]
        if (p === 0) continue
        const raw = p >= 200 ? p - 200 : p - 100
        const base = raw >= 50 ? raw - 50 : raw
        if (base !== 8) continue
        if (p >= 200) refG = k
        else refS = k
      }
      expect(s.senteKingIdx).toBe(refS)
      expect(s.goteKingIdx).toBe(refG)
      undoActionInPlace(s)
    }
    restoreActionPoolCursor(cursor)
  })
})
