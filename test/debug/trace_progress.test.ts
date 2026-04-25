import { describe, expect, it } from 'vitest';

import '../../src/parser/_fluent/index.ts';

import { char } from '../../src/parser/character/char.ts';
import { or } from '../../src/parser/combinator/or.ts';
import { progress, type ProgressFrame } from '../../src/debug/progress.ts';
import { trace, type TraceEvent } from '../../src/debug/trace.ts';

describe('trace()', () => {
  it('emits enter and exit events for every parser call', () => {
    const events: TraceEvent[] = [];
    const traced = trace(or(char('a'), char('b')), { output: (e) => events.push(e) });
    traced.parse('b');
    expect(events.length).toBeGreaterThan(0);
    const enters = events.filter((e) => e.kind === 'enter');
    const exits = events.filter((e) => e.kind === 'exit');
    expect(enters.length).toBe(exits.length);
    // Successful exit carries a Result.
    expect(exits.some((e) => e.result?.kind === 'success')).toBe(true);
  });
});

describe('progress()', () => {
  it('emits a frame per parser call with enteredAt / leftAt / ok', () => {
    const frames: ProgressFrame[] = [];
    const probed = progress(or(char('a'), char('b')), { output: (f) => frames.push(f) });
    probed.parse('b');
    expect(frames.length).toBeGreaterThan(0);
    // At least one ok frame and possibly one failure frame (the 'a' alt fails).
    expect(frames.some((f) => f.ok)).toBe(true);
    expect(frames.some((f) => !f.ok)).toBe(true);
  });
});
