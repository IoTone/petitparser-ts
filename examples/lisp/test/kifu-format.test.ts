/**
 * KifuFormat unit tests (D5.22b).
 *
 * Pure-formatter regression coverage for the lens-side
 * `Spectator/KifuFormat.ts`. The formatter has no engine dependency,
 * so this test imports it directly from across the repo (same pattern
 * `replay.test.ts` uses to reach `verification/kif/KifParser.ts`).
 *
 * Coverage per XR_UI_Spec §6.3.6:
 *   - Side markers ▲ (sente, odd move) / △ (gote, even move)
 *   - Zenkaku file digits ７〜１
 *   - Kanji ranks 一〜九
 *   - Piece glyphs unpromoted (歩/香/桂/銀/金/角/飛/玉)
 *   - Piece glyphs promoted (と/杏/圭/全/馬/龍) when pieceWasPromoted
 *   - 同 same-square detection (consecutive moves sharing destination)
 *   - Drops: ▲<piece>打 / △<piece>打
 *   - Promotion suffix 成 (only on the move where promotion happens)
 *   - Out-of-range index returns ""
 */

import {describe, expect, it} from "vitest"

import {formatMove, formatMoveStandalone} from "../../../../../Shogi0/Assets/Scripts/Shogi/Spectator/KifuFormat"
import type {
  ParsedBoardMove,
  ParsedDrop,
  ParsedKifuMove
} from "../../../../../Shogi0/Assets/Scripts/Shogi/Replay/KifParser"

// ── Builders ────────────────────────────────────────────────────────────

function move(o: Partial<ParsedBoardMove> = {}): ParsedBoardMove {
  return {
    kind: "move",
    num: 1,
    fromFile: 7,
    fromRank: 7,
    toFile: 7,
    toRank: 6,
    promote: false,
    pieceBase: 1, // pawn
    pieceWasPromoted: false,
    ...o
  }
}

function drop(o: Partial<ParsedDrop> = {}): ParsedDrop {
  return {
    kind: "drop",
    num: 1,
    pieceBase: 1,
    toFile: 5,
    toRank: 5,
    ...o
  }
}

// ── Tests ───────────────────────────────────────────────────────────────

describe("formatMove — side markers", () => {
  it("uses ▲ for odd move numbers (sente)", () => {
    expect(formatMoveStandalone(move({num: 1}))).toBe("▲７六歩")
    expect(formatMoveStandalone(move({num: 3}))).toBe("▲７六歩")
    expect(formatMoveStandalone(move({num: 17}))).toBe("▲７六歩")
  })
  it("uses △ for even move numbers (gote)", () => {
    expect(formatMoveStandalone(move({num: 2}))).toBe("△７六歩")
    expect(formatMoveStandalone(move({num: 4}))).toBe("△７六歩")
    expect(formatMoveStandalone(move({num: 100}))).toBe("△７六歩")
  })
})

describe("formatMove — file zenkaku digits", () => {
  it("renders toFile 1..9 as ７〜１ zenkaku digits", () => {
    const cases: ReadonlyArray<readonly [number, string]> = [
      [1, "１"], [2, "２"], [3, "３"], [4, "４"], [5, "５"],
      [6, "６"], [7, "７"], [8, "８"], [9, "９"]
    ]
    for (const [n, glyph] of cases) {
      expect(formatMoveStandalone(move({toFile: n}))).toBe(`▲${glyph}六歩`)
    }
  })
})

describe("formatMove — kanji ranks", () => {
  it("renders toRank 1..9 as 一〜九 kanji", () => {
    const cases: ReadonlyArray<readonly [number, string]> = [
      [1, "一"], [2, "二"], [3, "三"], [4, "四"], [5, "五"],
      [6, "六"], [7, "七"], [8, "八"], [9, "九"]
    ]
    for (const [n, glyph] of cases) {
      expect(formatMoveStandalone(move({toFile: 7, toRank: n}))).toBe(`▲７${glyph}歩`)
    }
  })
})

describe("formatMove — piece glyphs (unpromoted)", () => {
  it("renders each piece base 1..8 with the right kanji", () => {
    const cases: ReadonlyArray<readonly [number, string]> = [
      [1, "歩"], [2, "香"], [3, "桂"], [4, "銀"],
      [5, "金"], [6, "角"], [7, "飛"], [8, "玉"]
    ]
    for (const [base, glyph] of cases) {
      expect(formatMoveStandalone(move({pieceBase: base}))).toBe(`▲７六${glyph}`)
    }
  })
})

describe("formatMove — piece glyphs (already-promoted)", () => {
  it("renders promoted forms when pieceWasPromoted=true", () => {
    const cases: ReadonlyArray<readonly [number, string]> = [
      [1, "と"], [2, "杏"], [3, "圭"], [4, "全"],
      [6, "馬"], [7, "龍"]
    ]
    for (const [base, glyph] of cases) {
      const m = move({pieceBase: base, pieceWasPromoted: true})
      expect(formatMoveStandalone(m)).toBe(`▲７六${glyph}`)
    }
  })
})

describe("formatMove — 同 same-square detection", () => {
  it("emits 同 when consecutive moves share a destination", () => {
    const moves: ParsedKifuMove[] = [
      move({num: 1, toFile: 7, toRank: 6, pieceBase: 1}),
      move({num: 2, toFile: 7, toRank: 6, pieceBase: 4})
    ]
    // Full-width space between 同 and the piece glyph (per kifu convention).
    expect(formatMove(moves, 1)).toBe("△同　銀")
  })
  it("does NOT emit 同 when destinations differ", () => {
    const moves: ParsedKifuMove[] = [
      move({num: 1, toFile: 7, toRank: 6, pieceBase: 1}),
      move({num: 2, toFile: 8, toRank: 4, pieceBase: 1})
    ]
    expect(formatMove(moves, 1)).toBe("△８四歩")
  })
  it("does NOT emit 同 for index 0 (no previous move to compare)", () => {
    const moves: ParsedKifuMove[] = [move({num: 1, toFile: 7, toRank: 6})]
    expect(formatMove(moves, 0)).toBe("▲７六歩")
  })
  it("compares against a previous DROP destination too", () => {
    const moves: ParsedKifuMove[] = [
      drop({num: 1, pieceBase: 1, toFile: 5, toRank: 5}),
      move({num: 2, toFile: 5, toRank: 5, pieceBase: 4})
    ]
    expect(formatMove(moves, 1)).toBe("△同　銀")
  })
})

describe("formatMove — drops", () => {
  it("renders ▲<piece>打 with no file or rank", () => {
    expect(formatMoveStandalone(drop({pieceBase: 1, num: 1}))).toBe("▲歩打")
    expect(formatMoveStandalone(drop({pieceBase: 6, num: 1}))).toBe("▲角打")
    expect(formatMoveStandalone(drop({pieceBase: 7, num: 1}))).toBe("▲飛打")
  })
  it("uses △ for gote drops", () => {
    expect(formatMoveStandalone(drop({pieceBase: 1, num: 2}))).toBe("△歩打")
  })
})

describe("formatMove — promotion suffix", () => {
  it("appends 成 when promote=true on an unpromoted piece", () => {
    expect(formatMoveStandalone(move({
      pieceBase: 6, promote: true, pieceWasPromoted: false
    }))).toBe("▲７六角成")
  })
  it("appends 成 to a same-square promotion: ▲同　角成", () => {
    const moves: ParsedKifuMove[] = [
      move({num: 1, toFile: 2, toRank: 2, pieceBase: 6}),
      move({num: 2, toFile: 2, toRank: 2, pieceBase: 4}),
      move({num: 3, toFile: 2, toRank: 2, pieceBase: 6, promote: true})
    ]
    expect(formatMove(moves, 2)).toBe("▲同　角成")
  })
  it("does NOT append 成 on an already-promoted piece moving (promote=false)", () => {
    expect(formatMoveStandalone(move({
      pieceBase: 6, promote: false, pieceWasPromoted: true
    }))).toBe("▲７六馬")
  })
  it("does NOT append 成 on an unpromoted piece moving without promotion", () => {
    expect(formatMoveStandalone(move({
      pieceBase: 6, promote: false, pieceWasPromoted: false
    }))).toBe("▲７六角")
  })
})

describe("formatMove — out-of-range index", () => {
  it("returns empty string for negative index", () => {
    expect(formatMove([move({})], -1)).toBe("")
  })
  it("returns empty string for index >= length", () => {
    expect(formatMove([move({})], 5)).toBe("")
  })
  it("returns empty string for an empty move array", () => {
    expect(formatMove([], 0)).toBe("")
  })
})

describe("formatMove — example sequences (XR_UI_Spec §6.3.6)", () => {
  it("formats a simple opening sequence correctly", () => {
    const moves: ParsedKifuMove[] = [
      move({num: 1, fromFile: 7, fromRank: 7, toFile: 7, toRank: 6, pieceBase: 1}),
      move({num: 2, fromFile: 8, fromRank: 3, toFile: 8, toRank: 4, pieceBase: 1}),
      move({num: 3, fromFile: 2, fromRank: 7, toFile: 2, toRank: 6, pieceBase: 1})
    ]
    expect(formatMove(moves, 0)).toBe("▲７六歩")
    expect(formatMove(moves, 1)).toBe("△８四歩")
    expect(formatMove(moves, 2)).toBe("▲２六歩")
  })
})
