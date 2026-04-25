import { describe, expect, it } from 'vitest';

import { UriGrammar } from '../src/index.ts';
import type { ParsedUri } from '../src/types.ts';

const uri = new UriGrammar().build();

function parse(input: string): ParsedUri {
  const r = uri.parse(input);
  if (r.kind !== 'success') throw new Error(`parse failed: ${r.message} at ${String(r.position)}`);
  return r.value;
}

describe('URI example — full URL', () => {
  it('https with port and path', () => {
    expect(parse('https://example.com:8443/api/v1/users')).toEqual({
      scheme: 'https',
      userinfo: null,
      host: 'example.com',
      port: 8443,
      path: '/api/v1/users',
      query: null,
      fragment: null,
    });
  });

  it('with query string and fragment', () => {
    expect(parse('https://example.com/search?q=hello&p=1#results')).toEqual({
      scheme: 'https',
      userinfo: null,
      host: 'example.com',
      port: null,
      path: '/search',
      query: 'q=hello&p=1',
      fragment: 'results',
    });
  });

  it('with userinfo', () => {
    expect(parse('ftp://alice:secret@example.com:21/files')).toEqual({
      scheme: 'ftp',
      userinfo: 'alice:secret',
      host: 'example.com',
      port: 21,
      path: '/files',
      query: null,
      fragment: null,
    });
  });
});

describe('URI example — minimal forms', () => {
  it('host only', () => {
    expect(parse('http://example.com')).toEqual({
      scheme: 'http',
      userinfo: null,
      host: 'example.com',
      port: null,
      path: '',
      query: null,
      fragment: null,
    });
  });

  it('host with trailing slash', () => {
    const u = parse('http://example.com/');
    expect(u.path).toBe('/');
  });

  it('mailto-style (no //-authority)', () => {
    expect(parse('mailto:user@example.com')).toEqual({
      scheme: 'mailto',
      userinfo: null,
      host: null,
      port: null,
      path: 'user@example.com',
      query: null,
      fragment: null,
    });
  });

  it('file:// path', () => {
    expect(parse('file:///etc/hosts')).toEqual({
      scheme: 'file',
      userinfo: null,
      host: '',
      port: null,
      path: '/etc/hosts',
      query: null,
      fragment: null,
    });
  });
});

describe('URI example — schemes with special chars', () => {
  it('accepts +, -, . in scheme', () => {
    expect(parse('view-source:http://example.com').scheme).toBe('view-source');
    expect(parse('coap+tcp://example.com').scheme).toBe('coap+tcp');
    expect(parse('file2.0://example.com').scheme).toBe('file2.0');
  });
});

describe('URI example — invalid input', () => {
  it.each(['', 'no-scheme', '://example.com', '1http://example.com'])(
    'rejects %j',
    (input) => {
      const r = uri.parse(input);
      expect(r.kind).toBe('failure');
    },
  );
});
