import { describe, expect, it } from 'vitest';

import { Indent } from '../../src/indent/indent.ts';

describe('Indent — basic parsers', () => {
  it('increase succeeds when indent grows; pushes onto stack', () => {
    const indent = new Indent();
    const r = indent.increase.parse('  hello');
    expect(r.kind).toBe('success');
    if (r.kind === 'success') {
      expect(r.value).toBe(2);
      expect(r.position).toBe(2);
      expect(indent.stack).toEqual([0, 2]);
    }
  });

  it('increase fails when indent does not grow', () => {
    const indent = new Indent();
    const r = indent.increase.parse('hello');
    expect(r.kind).toBe('failure');
    expect(indent.stack).toEqual([0]);
  });

  it('same succeeds when indent matches stack top', () => {
    const indent = new Indent();
    indent.increase.parse('  x');
    // Now stack top is 2.
    const r = indent.same.parse('  y');
    expect(r.kind).toBe('success');
    if (r.kind === 'success') expect(r.value).toBe(2);
  });

  it('same fails when indent differs', () => {
    const indent = new Indent();
    indent.increase.parse('  x');
    expect(indent.same.parse('   y').kind).toBe('failure');
    expect(indent.same.parse(' y').kind).toBe('failure');
  });

  it('decrease pops the stack and matches at lesser indent', () => {
    const indent = new Indent();
    indent.increase.parse('  x');
    indent.increase.parse('    y'); // would push to [0, 2, 4] in a real run
    // For this isolated test, manually align:
    indent.reset();
    indent.stack.push(2, 4);
    const r = indent.decrease.parse('  end');
    expect(r.kind).toBe('success');
    if (r.kind === 'success') {
      expect(r.value).toBe(2);
      expect(indent.stack).toEqual([0, 2]);
    }
  });

  it('decrease fails when there is no block to close', () => {
    const indent = new Indent();
    expect(indent.decrease.parse('').kind).toBe('failure');
  });
});

describe('Indent — line-start detection', () => {
  it('parsers fail mid-line', () => {
    const indent = new Indent();
    const r = indent.increase.parseOn({ buffer: 'foo bar', position: 4 });
    // position 4 is mid-line, not after a newline → should fail.
    expect(r.kind).toBe('failure');
  });

  it('parsers succeed right after a newline', () => {
    const indent = new Indent();
    const r = indent.increase.parseOn({ buffer: 'first\n  second', position: 6 });
    expect(r.kind).toBe('success');
    if (r.kind === 'success') expect(r.value).toBe(2);
  });
});

describe('Indent — reset', () => {
  it('returns the stack to its initial state', () => {
    const indent = new Indent();
    indent.stack.push(4, 8);
    indent.reset();
    expect(indent.stack).toEqual([0]);
  });
});
