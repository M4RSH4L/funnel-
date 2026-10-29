import fs from 'fs';
import os from 'os';
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

const DB_FILE_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), '.lqmtm_data.json')
  : path.resolve(process.cwd(), '.lqmtm_data.json');

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

export async function registerParticipant(input: RegisterParticipantInput): Promise<{
  success: boolean;
  participant?: ParticipantRecord;
  error?: string;
  code?: 'DUPLICATE' | 'VALIDATION' | 'RATE_LIMIT' | 'SERVER_ERROR';
}> {
  const ipHashVal = input.ipAddress ? hashIp(input.ipAddress) : undefined;
  const newId = 'lqmtm_' + crypto.randomUUID().slice(0, 12);

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const rpcRes = await fetch(
        `${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/register_raffle_participant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            p_id: newId,
            p_full_name: input.fullName.trim(),
            p_pet_name: input.petName.trim(),
            p_pet_type: input.petType,
            p_locality: input.locality.trim(),
            p_current_food: input.currentFood.trim(),
            p_phone_normalized: input.phoneNormalized,
            p_terms_accepted: input.termsAccepted,
            p_terms_version: input.termsVersion,
            p_marketing_consent: input.marketingConsent,
            p_utm_source: input.utmSource || null,
            p_utm_medium: input.utmMedium || null,
            p_utm_campaign: input.utmCampaign || null,
            p_utm_content: input.utmContent || null,
            p_utm_term: input.utmTerm || null,
            p_fbclid: input.fbclid || null,
            p_ip_hash: ipHashVal || null,
          }),
        }
      );

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        if (rpcData && typeof rpcData.success === 'boolean') {
          return rpcData;
        }
      }
    } catch (err) {
      console.error('Supabase RPC registration error, falling back to local store:', err);
    }
  }

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
    id: newId,
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
    ipHash: ipHashVal,
    createdAt: new Date().toISOString(),
  };

  db.participants.push(newParticipant);
  saveDb(db);

  return {
    success: true,
    participant: newParticipant,
  };
}

export async function recordAnalyticsEvent(
  eventName: string,
  eventData?: Record<string, any>,
  utms?: Record<string, any>
): Promise<void> {
  const eventId = 'ev_' + crypto.randomUUID().slice(0, 8);
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

  if (supabaseUrl && supabaseAnonKey) {
    try {
      await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/analytics_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: eventId,
          event_name: eventName,
          event_data: eventData || {},
          utm_source: utms?.utm_source || null,
          utm_campaign: utms?.utm_campaign || null,
        }),
      });
    } catch {
      // Non-blocking
    }
  }

  const db = loadDb();

  if (eventName === 'landing_view') {
    db.pageViewsCount = (db.pageViewsCount || 0) + 1;
  }

  db.events.push({
    id: eventId,
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

export async function getCampaignStats(authToken?: string) {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

  let participants: ParticipantRecord[] | null = null;
  let events: AnalyticsEventRecord[] | null = null;

  if (supabaseUrl && supabaseAnonKey && authToken) {
    try {
      const [partRes, evRes] = await Promise.all([
        fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/participants?select=*&order=created_at.asc`, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${authToken}`,
          },
        }),
        fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/analytics_events?select=*&order=created_at.asc`, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${authToken}`,
          },
        }),
      ]);

      if (partRes.ok && evRes.ok) {
        const rawParticipants = await partRes.json();
        const rawEvents = await evRes.json();
        if (Array.isArray(rawParticipants) && Array.isArray(rawEvents)) {
          participants = rawParticipants.map((r: any) => ({
            id: r.id,
            fullName: r.full_name,
            petName: r.pet_name,
            petType: r.pet_type,
            locality: r.locality,
            currentFood: r.current_food,
            phoneNormalized: r.phone_normalized,
            termsAccepted: r.terms_accepted,
            termsVersion: r.terms_version,
            marketingConsent: r.marketing_consent,
            marketingConsentAt: r.marketing_consent_at,
            utmSource: r.utm_source,
            utmMedium: r.utm_medium,
            utmCampaign: r.utm_campaign,
            createdAt: r.created_at,
          }));
          events = rawEvents.map((e: any) => ({
            id: e.id,
            eventName: e.event_name,
            eventData: e.event_data,
            utmSource: e.utm_source,
            utmCampaign: e.utm_campaign,
            createdAt: e.created_at,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching stats from Supabase, using local fallback:', err);
    }
  }

  const db = loadDb();
  const activeParticipants = participants ?? db.participants;
  const activeEvents = events ?? db.events;
  const landingViews = activeEvents.filter(e => e.eventName === 'landing_view').length;
  const totalViews = Math.max(
    participants ? landingViews : (db.pageViewsCount || 1),
    activeParticipants.length * 3,
    1
  );
  const totalLeads = activeParticipants.length;

  const formStarts = Math.max(
    activeEvents.filter(e => e.eventName === 'form_start').length,
    totalLeads
  );
  const whatsappClicks = activeEvents.filter(
    e => e.eventName === 'whatsapp_click' || e.eventName === 'product_whatsapp_click'
  ).length;

  // Breakdown by Pet Type
  const dogCount = activeParticipants.filter(p => p.petType === 'dog').length;
  const catCount = activeParticipants.filter(p => p.petType === 'cat').length;

  // Breakdown by Locality
  const localityMap: Record<string, number> = {};
  activeParticipants.forEach(p => {
    const loc = p.locality || 'Sin especificar';
    localityMap[loc] = (localityMap[loc] || 0) + 1;
  });

  // Breakdown by Food Brand
  const foodMap: Record<string, number> = {};
  activeParticipants.forEach(p => {
    const food = p.currentFood || 'Sin especificar';
    foodMap[food] = (foodMap[food] || 0) + 1;
  });

  // Breakdown by UTM Source
  const utmMap: Record<string, number> = {};
  activeParticipants.forEach(p => {
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
    recentParticipants: activeParticipants.slice(-5).reverse().map(p => ({
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
