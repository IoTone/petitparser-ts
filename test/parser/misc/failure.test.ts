import { describe, it } from 'vitest';

import { failure } from '../../../src/parser/misc/failure.ts';
import { expectFailure } from '../../_helpers.ts';

describe('failure()', () => {
  it('always fails with the given message', () => {
    expectFailure(failure('boom'), '', 0, 'boom');
    expectFailure(failure('boom'), 'abc', 0, 'boom');
  });

  it('defaults to "unable to parse"', () => {
    expectFailure(failure(), '', 0, 'unable to parse');
  });
});
