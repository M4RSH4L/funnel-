import test from 'node:test';
import assert from 'node:assert/strict';
import { extractUtmParams } from './analytics';

test('extracts standard UTM parameters and fbclid from query string', () => {
  const query = '?utm_source=instagram&utm_medium=ad&utm_campaign=sorteo_alimento_2026&utm_content=video_perro&utm_term=mascotas&fbclid=IwAR123XYZ';
  const utms = extractUtmParams(query);

  assert.equal(utms.utm_source, 'instagram');
  assert.equal(utms.utm_medium, 'ad');
  assert.equal(utms.utm_campaign, 'sorteo_alimento_2026');
  assert.equal(utms.utm_content, 'video_perro');
  assert.equal(utms.utm_term, 'mascotas');
  assert.equal(utms.fbclid, 'IwAR123XYZ');
});

test('handles empty or clean search string without throwing', () => {
  assert.deepEqual(extractUtmParams(''), {});
  assert.deepEqual(extractUtmParams('?foo=bar'), {});
});
