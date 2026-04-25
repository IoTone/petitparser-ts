import { describe, it } from 'vitest';

import { position } from '../../../src/parser/misc/position.ts';
import { expectSuccess } from '../../_helpers.ts';

describe('position()', () => {
  it('returns 0 at the start of any input', () => {
    expectSuccess(position(), '', 0, 0);
    expectSuccess(position(), 'abc', 0, 0);
  });
});
