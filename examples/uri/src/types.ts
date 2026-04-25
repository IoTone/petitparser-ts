/**
 * Parsed URI components. Mirrors WHATWG URL's surface but kept minimal —
 * absent components are `null`, not empty strings, so callers can distinguish
 * `http://host` (no path) from `http://host/` (root path).
 *
 * Conforms to a simplified subset of RFC 3986. Reserved-character percent-
 * decoding and authority-host parsing (IPv6 brackets, IDN) are intentionally
 * out of scope — this is an example, not a production URL parser.
 */
export interface ParsedUri {
  readonly scheme: string;
  readonly userinfo: string | null;
  readonly host: string | null;
  readonly port: number | null;
  readonly path: string;
  readonly query: string | null;
  readonly fragment: string | null;
}
