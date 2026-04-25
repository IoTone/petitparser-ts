import { describe, expect, it } from 'vitest';

import { digit } from '../../../src/parser/character/digit.ts';
import { LabelParser, label } from '../../../src/parser/misc/label.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('label()', () => {
  it('passes through the inner result unchanged', () => {
    const p = label('a-digit', digit());
    expectSuccess(p, '5', '5');
    expectFailure(p, 'x', 0, 'digit expected');
  });

  it('exposes the name on toString()', () => {
    const p = label('my-name', digit());
    expect(p.toString()).toBe('LabelParser[my-name]');
    expect(p).toBeInstanceOf(LabelParser);
  });
});
