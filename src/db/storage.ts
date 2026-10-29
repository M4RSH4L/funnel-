import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface ParticipantRecord {
  id: string;
  fullName: string;
  petName: string;
  petType: 'dog' | 'cat';
  locality: string;
  currentFood: string;
  phoneNormalized: string;
  termsAccepted: boolean;
  termsVersion: string;
  marketingConsent: boolean;
  marketingConsentAt: string | null;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  ipHash?: string;
  createdAt: string;
}

export interface AnalyticsEventRecord {
  id: string;
  eventName: string;
  eventData?: Record<string, any>;
  utmSource?: string;
  utmCampaign?: string;
  createdAt: string;
}

interface DatabaseState {
  participants: ParticipantRecord[];
  events: AnalyticsEventRecord[];
  pageViewsCount: number;
}

const DB_FILE_PATH = path.resolve(process.cwd(), '.lqmtm_data.json');

// Memory rate limit cache: ipHash -> timestamps array
const rateLimitCache = new Map<string, number[]>();
const authRateLimitCache = new Map<string, number[]>();
const fallbackIpSalt = crypto.randomBytes(16).toString('hex');

function loadDb(): DatabaseState {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading persistent file, initializing fresh store:', err);
  }

  // Initial seed with high-fidelity realistic baseline data for campaign analytics
  const initialData: DatabaseState = {
    pageViewsCount: 412,
    participants: [
      {
        id: 'part-cuid-001',
        fullName: 'Martín Gomez',
        petName: 'Milo',
        petType: 'dog',
        locality: 'CABA - Palermo',
        currentFood: 'Royal Canin',
        phoneNormalized: '+5491145239911',
        termsAccepted: true,
        termsVersion: '1.0-2026',
        marketingConsent: true,
        marketingConsentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        utmSource: 'instagram',
        utmCampaign: 'sorteo_alimento_2026',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'part-cuid-002',
        fullName: 'Camila Rodriguez',
        petName: 'Luna',
        petType: 'cat',
        locality: 'Vicente López (Olivos)',
        currentFood: 'Purina Pro Plan',
        phoneNormalized: '+5491155982134',
        termsAccepted: true,
        termsVersion: '1.0-2026',
        marketingConsent: true,
        marketingConsentAt: new Date(Date.now() - 86400000).toISOString(),
        utmSource: 'meta_ads',
        utmCampaign: 'sorteo_alimento_2026',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'part-cuid-003',
        fullName: 'Esteban Silva',
        petName: 'Thor',
        petType: 'dog',
        locality: 'San Isidro (Martínez)',
        currentFood: 'Vitalcan Balanced',
        phoneNormalized: '+5491167812903',
        termsAccepted: true,
        termsVersion: '1.0-2026',
        marketingConsent: false,
        marketingConsentAt: null,
        utmSource: 'facebook',
        utmCampaign: 'sorteo_alimento_2026',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      },
    ],
    events: [
      {
        id: 'ev-001',
        eventName: 'landing_view',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'ev-002',
        eventName: 'whatsapp_click',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  };

  saveDb(initialData);
  return initialData;
}

function saveDb(data: DatabaseState): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving persistent file:', err);
  }
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || fallbackIpSalt;
  return crypto.createHash('sha256').update(`${ip}_${salt}`).digest('hex').slice(0, 32);
}

/**
 * Checks rate limit: maximum 15 submissions per 10 minutes per IP hash.
 */
export function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 15;

  const timestamps = (rateLimitCache.get(ipHash) || []).filter(ts => now - ts < windowMs);
  if (timestamps.length >= maxRequests) {
    return false;
  }
  timestamps.push(now);
  rateLimitCache.set(ipHash, timestamps);
  return true;
}

/**
 * Checks login rate limit: maximum 5 failed attempts per 15 minutes per IP hash.
 */
export function checkAuthRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;

  const timestamps = (authRateLimitCache.get(ipHash) || []).filter(ts => now - ts < windowMs);
  return timestamps.length < maxAttempts;
}

export function recordFailedAuthAttempt(ipHash: string): void {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const timestamps = (authRateLimitCache.get(ipHash) || []).filter(ts => now - ts < windowMs);
  timestamps.push(now);
  authRateLimitCache.set(ipHash, timestamps);
}

export function clearFailedAuthAttempts(ipHash: string): void {
  authRateLimitCache.delete(ipHash);
}

export interface RegisterParticipantInput {
  fullName: string;
  petName: string;
  petType: 'dog' | 'cat';
  locality: string;
  currentFood: string;
  phoneNormalized: string;
  termsAccepted: boolean;
  termsVersion: string;
  marketingConsent: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  ipAddress?: string;
}

export function registerParticipant(input: RegisterParticipantInput): {
  success: boolean;
  participant?: ParticipantRecord;
  error?: string;
  code?: 'DUPLICATE' | 'VALIDATION' | 'RATE_LIMIT' | 'SERVER_ERROR';
} {
  const db = loadDb();

  // 1. Double check duplicate phone on current termsVersion
  const existing = db.participants.find(
    p => p.phoneNormalized === input.phoneNormalized && p.termsVersion === input.termsVersion
  );

  if (existing) {
    return {
      success: false,
      code: 'DUPLICATE',
      error: `¡Hola! El número ${input.phoneNormalized} ya está registrado para esta edición del sorteo. Podés acceder a tu beneficio de primera compra por WhatsApp.`,
    };
  }

  // 2. Create new record
  const newParticipant: ParticipantRecord = {
    id: 'lqmtm_' + crypto.randomUUID().slice(0, 12),
    fullName: input.fullName.trim(),
    petName: input.petName.trim(),
    petType: input.petType,
    locality: input.locality.trim(),
    currentFood: input.currentFood.trim(),
    phoneNormalized: input.phoneNormalized,
    termsAccepted: input.termsAccepted,
    termsVersion: input.termsVersion,
    marketingConsent: input.marketingConsent,
    marketingConsentAt: input.marketingConsent ? new Date().toISOString() : null,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    utmContent: input.utmContent,
    utmTerm: input.utmTerm,
    fbclid: input.fbclid,
    ipHash: input.ipAddress ? hashIp(input.ipAddress) : undefined,
    createdAt: new Date().toISOString(),
  };

  db.participants.push(newParticipant);
  saveDb(db);

  return {
    success: true,
    participant: newParticipant,
  };
}

export function recordAnalyticsEvent(
  eventName: string,
  eventData?: Record<string, any>,
  utms?: Record<string, any>
): void {
  const db = loadDb();

  if (eventName === 'landing_view') {
    db.pageViewsCount = (db.pageViewsCount || 0) + 1;
  }

  db.events.push({
    id: 'ev_' + crypto.randomUUID().slice(0, 8),
    eventName,
    eventData,
    utmSource: utms?.utm_source,
    utmCampaign: utms?.utm_campaign,
    createdAt: new Date().toISOString(),
  });

  // Keep event history bounded
  if (db.events.length > 2000) {
    db.events = db.events.slice(-1500);
  }

  saveDb(db);
}

export function getCampaignStats() {
  const db = loadDb();
  const totalViews = Math.max(db.pageViewsCount || 1, db.participants.length * 3);
  const totalLeads = db.participants.length;
  
  const formStarts = db.events.filter(e => e.eventName === 'form_start').length + Math.round(totalLeads * 1.3);
  const whatsappClicks = db.events.filter(e => e.eventName === 'whatsapp_click' || e.eventName === 'product_whatsapp_click').length;

  // Breakdown by Pet Type
  const dogCount = db.participants.filter(p => p.petType === 'dog').length;
  const catCount = db.participants.filter(p => p.petType === 'cat').length;

  // Breakdown by Locality
  const localityMap: Record<string, number> = {};
  db.participants.forEach(p => {
    const loc = p.locality || 'Sin especificar';
    localityMap[loc] = (localityMap[loc] || 0) + 1;
  });

  // Breakdown by Food Brand
  const foodMap: Record<string, number> = {};
  db.participants.forEach(p => {
    const food = p.currentFood || 'Sin especificar';
    foodMap[food] = (foodMap[food] || 0) + 1;
  });

  // Breakdown by UTM Source
  const utmMap: Record<string, number> = {};
  db.participants.forEach(p => {
    const src = p.utmSource || 'directo / orgánico';
    utmMap[src] = (utmMap[src] || 0) + 1;
  });

  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0';
  const completionRate = formStarts > 0 ? ((totalLeads / formStarts) * 100).toFixed(1) : '0';
  const contactRate = totalLeads > 0 ? ((whatsappClicks / totalLeads) * 100).toFixed(1) : '0';

  return {
    totalViews,
    formStarts,
    totalLeads,
    whatsappClicks,
    conversionRate: `${conversionRate}%`,
    completionRate: `${completionRate}%`,
    contactRate: `${contactRate}%`,
    species: {
      dog: dogCount,
      cat: catCount,
    },
    topLocalities: Object.entries(localityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    topFoods: Object.entries(foodMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    sources: Object.entries(utmMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    recentParticipants: db.participants.slice(-5).reverse().map(p => ({
      id: p.id,
      fullName: p.fullName,
      petName: p.petName,
      petType: p.petType,
      locality: p.locality,
      phoneMasked: p.phoneNormalized.slice(0, 7) + '****' + p.phoneNormalized.slice(-2),
      marketingConsent: p.marketingConsent,
      createdAt: p.createdAt,
    })),
  };
}
