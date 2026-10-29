import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArgentinePhone, buildWhatsAppUrl } from './phone';

test('normalizes standard 10-digit mobile (11 2345 6789)', () => {
  const result = normalizeArgentinePhone('11 2345 6789');
  assert.equal(result.isValid, true);
  assert.equal(result.normalized, '+5491123456789');
  assert.equal(result.displayFormatted, '+54 9 11 2345-6789');
});

test('normalizes trunk 011 with 15 mobile prefix (011 15 2345 6789)', () => {
  const result = normalizeArgentinePhone('011 15 2345 6789');
  assert.equal(result.isValid, true);
  assert.equal(result.normalized, '+5491123456789');
});

test('normalizes full international format (+54 9 11 2345-6789)', () => {
  const result = normalizeArgentinePhone('+54 9 11 2345-6789');
  assert.equal(result.isValid, true);
  assert.equal(result.normalized, '+5491123456789');
});

test('normalizes interior area code like La Plata 221 (221 456 7890)', () => {
  const result = normalizeArgentinePhone('221 456 7890');
  assert.equal(result.isValid, true);
  assert.equal(result.normalized, '+5492214567890');
});

test('handles short invalid numbers', () => {
  const result = normalizeArgentinePhone('12345');
  assert.equal(result.isValid, false);
  assert.ok(result.errorMessage);
});

test('builds WhatsApp click-to-chat URL correctly', () => {
  const url = buildWhatsAppUrl('+54 9 11 9999-8888', 'Hola! Quiero participar.');
  assert.equal(url, 'https://wa.me/5491199998888?text=Hola!%20Quiero%20participar.');
});
