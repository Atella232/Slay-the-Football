import { describe, expect, it } from 'vitest';
import { normalizeText } from './text';

describe('normalizeText', () => {
  it('fixes mojibake for spanish ñ', () => {
    expect(normalizeText('Inflige 6 de daÃ±o.')).toBe('Inflige 6 de daño.');
  });

  it('fixes double mojibake sequences', () => {
    expect(normalizeText('Inflige 6 de daÃƒÂ±o adicional.')).toBe('Inflige 6 de daño adicional.');
  });

  it('fixes inverted punctuation and accents', () => {
    expect(normalizeText('Â¿CÃ³mo estÃ¡s? Â¡Bien!')).toBe('¿Cómo estás? ¡Bien!');
  });
});
