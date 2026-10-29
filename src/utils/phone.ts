/**
 * Phone normalization and validation utility for Argentine phone numbers (+54 9 ...).
 * Supports input in formats such as:
 * - "11 2345 6789"
 * - "15 2345 6789"
 * - "011 15 2345 6789"
 * - "+54 9 11 2345 6789"
 * - "5491123456789"
 * - "221 456 7890" (La Plata)
 * - "2324 123456" (Mercedes / Interior)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  displayFormatted: string;
  errorMessage?: string;
}

export function normalizeArgentinePhone(rawInput: string): PhoneValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      isValid: false,
      normalized: '',
      displayFormatted: '',
      errorMessage: 'El número de teléfono es obligatorio.',
    };
  }

  // Remove all non-digit characters except leading plus
  let cleaned = rawInput.trim();
  const hasPlus = cleaned.startsWith('+');
  let digits = cleaned.replace(/\D/g, '');

  if (digits.length === 0) {
    return {
      isValid: false,
      normalized: '',
      displayFormatted: '',
      errorMessage: 'Ingresá un número de teléfono válido.',
    };
  }

  // Strip international prefix if already typed
  if (digits.startsWith('54')) {
    digits = digits.slice(2);
  }

  // Strip Argentine mobile prefix '9' if included after 54
  if (digits.startsWith('9')) {
    digits = digits.slice(1);
  }

  // Strip trunk prefix '0' if present (e.g. 011 -> 11)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Strip mobile prefix '15' if user typed area code + 15 (e.g. 11 15 2345 6789 -> 11 2345 6789)
  // Standard Argentine mobile numbers have a 2 to 4 digit area code followed by 15.
  // In CABA / AMBA: 11 + 15 + 8 digits -> 11 + 8 digits
  if (digits.startsWith('1115') && digits.length === 12) {
    digits = '11' + digits.slice(4);
  } else if (digits.length === 12) {
    // Other 3 or 4-digit area codes + 15
    // 221 15 xxx xxxx -> 221 xxx xxxx
    for (const prefixLen of [2, 3, 4]) {
      const area = digits.slice(0, prefixLen);
      const maybe15 = digits.slice(prefixLen, prefixLen + 2);
      if (maybe15 === '15') {
        digits = area + digits.slice(prefixLen + 2);
        break;
      }
    }
  } else if (digits.startsWith('15') && digits.length === 10) {
    // Default to Buenos Aires 11 if only 15 + 8 digits given
    digits = '11' + digits.slice(2);
  }

  // Argentine national numbers must be exactly 10 digits (Area Code + Local Subscriber Number)
  if (digits.length < 10) {
    return {
      isValid: false,
      normalized: '',
      displayFormatted: cleaned,
      errorMessage: 'El número debe incluir código de área y tener al menos 10 dígitos (ej. 11 2345-6789).',
    };
  }

  if (digits.length > 11) {
    return {
      isValid: false,
      normalized: '',
      displayFormatted: cleaned,
      errorMessage: 'El número ingresado contiene demasiados dígitos.',
    };
  }

  // If 11 digits and starts with 9 (e.g. 9112345678), remove the 9
  if (digits.length === 11 && digits.startsWith('9')) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) {
    return {
      isValid: false,
      normalized: '',
      displayFormatted: cleaned,
      errorMessage: 'Verificá el formato. Ejemplo: 11 2345-6789 (10 dígitos).',
    };
  }

  // Canonical E.164 for Argentine mobile on WhatsApp: +54 9 + 10 digits
  const normalized = `+549${digits}`;
  const areaCode = digits.slice(0, 2) === '11' ? '11' : digits.slice(0, 3);
  const rest = digits.slice(areaCode.length);
  const displayFormatted = `+54 9 ${areaCode} ${rest.slice(0, 4)}-${rest.slice(4)}`;

  return {
    isValid: true,
    normalized,
    displayFormatted,
  };
}

/**
 * Generates an official WhatsApp click-to-chat URL with a prefilled message.
 */
export function buildWhatsAppUrl(phoneTarget: string, textMessage: string): string {
  // Strip everything except digits from destination phone
  const cleanDest = phoneTarget.replace(/\D/g, '');
  const encodedText = encodeURIComponent(textMessage);
  return `https://wa.me/${cleanDest}?text=${encodedText}`;
}
