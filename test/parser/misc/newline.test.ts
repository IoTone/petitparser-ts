import { describe, it } from 'vitest';

import { newline } from '../../../src/parser/misc/newline.ts';
import { expectFailure, expectSuccess } from '../../_helpers.ts';

describe('newline()', () => {
  it('matches \\n', () => {
    expectSuccess(newline(), '\n', '\n');
  });

  it('matches \\r alone', () => {
    expectSuccess(newline(), '\r', '\r');
  });

  it('matches \\r\\n as a single newline', () => {
    expectSuccess(newline(), '\r\n', '\r\n');
  });

  it('fails on non-newline characters', () => {
    expectFailure(newline(), 'a', 0, 'newline expected');
    expectFailure(newline(), '', 0, 'newline expected');
  });
});
