const REPLACEMENTS: Array<[RegExp, string]> = [
  // Double mojibake prefixes: e.g. "ÃƒÂ±" -> "Ã±"
  [new RegExp('\u00c3\u0192\u00c2', 'g'), '\u00c3'],
  [new RegExp('\u00c3\u201a\u00c2', 'g'), '\u00c2'],

  // Common UTF-8 interpreted as Latin-1 sequences.
  [new RegExp('\u00c3\u00a1', 'g'), '\u00e1'],
  [new RegExp('\u00c3\u00a9', 'g'), '\u00e9'],
  [new RegExp('\u00c3\u00ad', 'g'), '\u00ed'],
  [new RegExp('\u00c3\u00b3', 'g'), '\u00f3'],
  [new RegExp('\u00c3\u00ba', 'g'), '\u00fa'],
  [new RegExp('\u00c3\u00bc', 'g'), '\u00fc'],
  [new RegExp('\u00c3\u00b1', 'g'), '\u00f1'],
  [new RegExp('\u00c3\u0081', 'g'), '\u00c1'],
  [new RegExp('\u00c3\u0089', 'g'), '\u00c9'],
  [new RegExp('\u00c3\u008d', 'g'), '\u00cd'],
  [new RegExp('\u00c3\u0093', 'g'), '\u00d3'],
  [new RegExp('\u00c3\u009a', 'g'), '\u00da'],
  [new RegExp('\u00c3\u009c', 'g'), '\u00dc'],
  [new RegExp('\u00c3\u0091', 'g'), '\u00d1'],
  [new RegExp('\u00c2\u00bf', 'g'), '\u00bf'],
  [new RegExp('\u00c2\u00a1', 'g'), '\u00a1'],

  // Stray non-breaking space after decoding glitches.
  [new RegExp('\u00a0', 'g'), ' '],
];

const MOJIBAKE_MARKERS = /[\u00c2\u00c3\u0192\u201a\ufffd]/;

function mojibakeScore(value: string): number {
  const matches = value.match(/[\u00c2\u00c3\u0192\u201a\ufffd]/g);
  return matches ? matches.length : 0;
}

function decodeLatin1AsUtf8(value: string): string {
  const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

export function normalizeText(text: string): string {
  if (!text) return text;

  let output = text;
  for (let i = 0; i < 3; i += 1) {
    const prev = output;
    for (const [pattern, replacement] of REPLACEMENTS) {
      output = output.replace(pattern, replacement);
    }
    if (output === prev) break;
  }

  if (MOJIBAKE_MARKERS.test(output)) {
    for (let i = 0; i < 2; i += 1) {
      const candidate = decodeLatin1AsUtf8(output);
      if (mojibakeScore(candidate) < mojibakeScore(output)) {
        output = candidate;
      } else {
        break;
      }
    }
  }

  return output;
}
