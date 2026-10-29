import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

const app = express();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

interface AdminSession {
  email: string;
  expiresAt: number;
}

const activeSessions = new Map<string, AdminSession>();
const rateLimitCache = new Map<string, number[]>();
const authRateLimitCache = new Map<string, number[]>();
const fallbackIpSalt = crypto.randomBytes(16).toString('hex');

const DB_FILE_PATH = path.join(os.tmpdir(), '.lqmtm_data.json');

interface ParticipantRecord {
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

interface AnalyticsEventRecord {
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

function loadLocalDb(): DatabaseState {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf-8'));
    }
  } catch {
    // ignore
  }
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
    events: [],
  };
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch {
    // ignore
  }
  return initialData;
}

function saveLocalDb(data: DatabaseState): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || fallbackIpSalt;
  return crypto.createHash('sha256').update(`${ip}_${salt}`).digest('hex').slice(0, 32);
}

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const timestamps = (rateLimitCache.get(ipHash) || []).filter(ts => now - ts < windowMs);
  if (timestamps.length >= 15) return false;
  timestamps.push(now);
  rateLimitCache.set(ipHash, timestamps);
  return true;
}

function checkAuthRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const timestamps = (authRateLimitCache.get(ipHash) || []).filter(ts => now - ts < windowMs);
  return timestamps.length < 5;
}

function recordFailedAuthAttempt(ipHash: string): void {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const timestamps = (authRateLimitCache.get(ipHash) || []).filter(ts => now - ts < windowMs);
  timestamps.push(now);
  authRateLimitCache.set(ipHash, timestamps);
}

function clearFailedAuthAttempts(ipHash: string): void {
  authRateLimitCache.delete(ipHash);
}

function normalizeArgentinePhone(rawInput: string): {
  isValid: boolean;
  normalized: string;
  errorMessage?: string;
} {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, normalized: '', errorMessage: 'Ingresá tu número de WhatsApp.' };
  }
  let digits = rawInput.replace(/\D/g, '');
  if (!digits) {
    return { isValid: false, normalized: '', errorMessage: 'El número solo debe contener dígitos.' };
  }
  if (digits.startsWith('0054')) digits = digits.slice(4);
  else if (digits.startsWith('54')) digits = digits.slice(2);
  if (digits.startsWith('9') && digits.length === 11) digits = digits.slice(1);
  if (digits.startsWith('0')) digits = digits.slice(1);

  if (digits.length === 12) {
    if (digits.startsWith('1115')) digits = '11' + digits.slice(4);
    else {
      const m3 = digits.match(/^(\d{3})15(\d{7})$/);
      const m4 = digits.match(/^(\d{4})15(\d{6})$/);
      if (m3) digits = m3[1] + m3[2];
      else if (m4) digits = m4[1] + m4[2];
    }
  }
  if (digits.startsWith('15') && digits.length === 10) {
    digits = '11' + digits.slice(2);
  }
  if (digits.length !== 10) {
    return {
      isValid: false,
      normalized: '',
      errorMessage: 'Ingresá los 10 dígitos de tu línea (código de área + número, ej: 11 2345 6789).',
    };
  }
  if (/^(\d)\1{9}$/.test(digits)) {
    return { isValid: false, normalized: '', errorMessage: 'Ingresá un número de WhatsApp real.' };
  }
  return { isValid: true, normalized: `+549${digits}` };
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

async function verifyAdminToken(token: string): Promise<string | null> {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return null;
    }
    return session.email;
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const resp = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        },
      });
      if (resp.ok) {
        const user = await resp.json();
        if (user?.email) return String(user.email);
      }
    } catch {
      return null;
    }
  }
  return null;
}

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'lqmtm-acquisition-funnel',
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    const ipHash = hashIp(clientIp);

    if (!checkRateLimit(ipHash)) {
      res.status(429).json({
        success: false,
        code: 'RATE_LIMIT',
        error: 'Demasiadas solicitudes. Por favor esperá unos minutos antes de volver a intentar.',
      });
      return;
    }

    const {
      fullName,
      petName,
      petType,
      locality,
      currentFood,
      phone,
      termsAccepted,
      termsVersion = '1.0-2026',
      marketingConsent = false,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      fbclid,
    } = req.body || {};

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ success: false, code: 'VALIDATION', field: 'fullName', error: 'Ingresá tu nombre y apellido.' });
      return;
    }
    if (!petName || typeof petName !== 'string' || petName.trim().length < 1) {
      res.status(400).json({ success: false, code: 'VALIDATION', field: 'petName', error: 'Ingresá el nombre de tu mascota.' });
      return;
    }
    if (petType !== 'dog' && petType !== 'cat') {
      res.status(400).json({ success: false, code: 'VALIDATION', field: 'petType', error: 'Seleccioná si tu compañero es un perro o un gato.' });
      return;
    }
    if (!locality || typeof locality !== 'string' || locality.trim().length < 2) {
      res.status(400).json({ success: false, code: 'VALIDATION', field: 'locality', error: 'Ingresá tu localidad (ej. CABA, San Isidro, etc.).' });
      return;
    }
    if (!currentFood || typeof currentFood !== 'string' || currentFood.trim().length < 2) {
      res.status(400).json({ success: false, code: 'VALIDATION', field: 'currentFood', error: 'Indicá qué alimento consume actualmente o seleccioná una opción.' });
      return;
    }

    const phoneResult = normalizeArgentinePhone(phone);
    if (!phoneResult.isValid) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION',
        field: 'phone',
        error: phoneResult.errorMessage || 'Verificá el número de WhatsApp.',
      });
      return;
    }

    if (termsAccepted !== true) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION',
        field: 'termsAccepted',
        error: 'Debés aceptar las bases y condiciones para participar del sorteo.',
      });
      return;
    }

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
              p_full_name: fullName.trim(),
              p_pet_name: petName.trim(),
              p_pet_type: petType,
              p_locality: locality.trim(),
              p_current_food: currentFood.trim(),
              p_phone_normalized: phoneResult.normalized,
              p_terms_accepted: true,
              p_terms_version: String(termsVersion),
              p_marketing_consent: Boolean(marketingConsent),
              p_utm_source: utmSource ? String(utmSource).slice(0, 100) : null,
              p_utm_medium: utmMedium ? String(utmMedium).slice(0, 100) : null,
              p_utm_campaign: utmCampaign ? String(utmCampaign).slice(0, 100) : null,
              p_utm_content: utmContent ? String(utmContent).slice(0, 100) : null,
              p_utm_term: utmTerm ? String(utmTerm).slice(0, 100) : null,
              p_fbclid: fbclid ? String(fbclid).slice(0, 150) : null,
              p_ip_hash: ipHash,
            }),
          }
        );

        if (rpcRes.ok) {
          const rpcData = await rpcRes.json();
          if (rpcData && rpcData.success === false && rpcData.code === 'DUPLICATE') {
            res.status(409).json({
              success: false,
              code: 'DUPLICATE',
              error: rpcData.error,
            });
            return;
          }
          if (rpcData && rpcData.success === true && rpcData.participant) {
            res.status(201).json({
              success: true,
              participant: rpcData.participant,
            });
            return;
          }
        }
      } catch (e) {
        console.error('Supabase RPC error, using local fallback:', e);
      }
    }

    const db = loadLocalDb();
    const existing = db.participants.find(
      p => p.phoneNormalized === phoneResult.normalized && p.termsVersion === String(termsVersion)
    );
    if (existing) {
      res.status(409).json({
        success: false,
        code: 'DUPLICATE',
        error: `¡Hola! El número ${phoneResult.normalized} ya está registrado para esta edición del sorteo. Podés acceder a tu beneficio de primera compra por WhatsApp.`,
      });
      return;
    }

    const newParticipant: ParticipantRecord = {
      id: newId,
      fullName: fullName.trim(),
      petName: petName.trim(),
      petType,
      locality: locality.trim(),
      currentFood: currentFood.trim(),
      phoneNormalized: phoneResult.normalized,
      termsAccepted: true,
      termsVersion: String(termsVersion),
      marketingConsent: Boolean(marketingConsent),
      marketingConsentAt: marketingConsent ? new Date().toISOString() : null,
      utmSource: utmSource ? String(utmSource).slice(0, 100) : undefined,
      utmMedium: utmMedium ? String(utmMedium).slice(0, 100) : undefined,
      utmCampaign: utmCampaign ? String(utmCampaign).slice(0, 100) : undefined,
      utmContent: utmContent ? String(utmContent).slice(0, 100) : undefined,
      utmTerm: utmTerm ? String(utmTerm).slice(0, 100) : undefined,
      fbclid: fbclid ? String(fbclid).slice(0, 150) : undefined,
      ipHash,
      createdAt: new Date().toISOString(),
    };

    db.participants.push(newParticipant);
    saveLocalDb(db);

    res.status(201).json({
      success: true,
      participant: {
        id: newParticipant.id,
        fullName: newParticipant.fullName,
        petName: newParticipant.petName,
        petType: newParticipant.petType,
        locality: newParticipant.locality,
        currentFood: newParticipant.currentFood,
        phoneNormalized: newParticipant.phoneNormalized,
        marketingConsent: newParticipant.marketingConsent,
        createdAt: newParticipant.createdAt,
      },
    });
  } catch (error) {
    console.error('Unhandled registration error:', error);
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      error: 'Ocurrió un error inesperado al procesar tu solicitud.',
    });
  }
});

app.post('/api/analytics/track', async (req: Request, res: Response) => {
  try {
    const { eventName, eventData, utms } = req.body || {};
    if (eventName && typeof eventName === 'string') {
      const cleanName = eventName.slice(0, 80);
      const eventId = 'ev_' + crypto.randomUUID().slice(0, 8);
      const supabaseUrl = process.env.SUPABASE_URL?.trim();
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

      if (supabaseUrl && supabaseAnonKey) {
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
            event_name: cleanName,
            event_data: eventData || {},
            utm_source: utms?.utm_source || null,
            utm_campaign: utms?.utm_campaign || null,
          }),
        }).catch(() => {});
      }

      const db = loadLocalDb();
      if (cleanName === 'landing_view') {
        db.pageViewsCount = (db.pageViewsCount || 0) + 1;
      }
      db.events.push({
        id: eventId,
        eventName: cleanName,
        eventData,
        utmSource: utms?.utm_source,
        utmCampaign: utms?.utm_campaign,
        createdAt: new Date().toISOString(),
      });
      saveLocalDb(db);
    }
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    const ipHash = hashIp(clientIp);

    if (!checkAuthRateLimit(ipHash)) {
      res.status(429).json({
        success: false,
        error: 'Demasiados intentos de inicio de sesión. Por favor esperá 15 minutos.',
      });
      return;
    }

    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Ingresá tu correo electrónico y contraseña.',
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

    if (supabaseUrl && supabaseAnonKey) {
      const supaRes = await fetch(
        `${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify({ email: normalizedEmail, password }),
        }
      );

      if (supaRes.ok) {
        const supaData = await supaRes.json();
        clearFailedAuthAttempts(ipHash);
        res.json({
          success: true,
          token: supaData.access_token,
          authProvider: 'supabase',
          user: {
            id: supaData.user?.id,
            email: supaData.user?.email || normalizedEmail,
            name: supaData.user?.user_metadata?.name || 'Equipo de Crecimiento & Marketing LQMTM',
            role: supaData.user?.user_metadata?.role || 'admin',
          },
        });
        return;
      }

      recordFailedAuthAttempt(ipHash);
      res.status(401).json({
        success: false,
        error: 'Credenciales inválidas. Verificá tu usuario y contraseña.',
      });
      return;
    }

    const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (!configuredEmail || !configuredPassword || configuredPassword === 'CHANGE_ME_STRONG_PASSWORD') {
      res.status(503).json({
        success: false,
        error: 'Las credenciales de administrador no están configuradas en el servidor (.env).',
      });
      return;
    }

    if (!safeCompare(normalizedEmail, configuredEmail) || !safeCompare(password, configuredPassword)) {
      recordFailedAuthAttempt(ipHash);
      res.status(401).json({
        success: false,
        error: 'Credenciales inválidas. Verificá tu usuario y contraseña.',
      });
      return;
    }

    clearFailedAuthAttempts(ipHash);
    const sessionToken = crypto.randomBytes(32).toString('hex');
    activeSessions.set(sessionToken, {
      email: normalizedEmail,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    res.json({
      success: true,
      token: sessionToken,
      user: {
        email: normalizedEmail,
        name: 'Equipo de Crecimiento & Marketing LQMTM',
        role: 'admin',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Error en la autenticación' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    activeSessions.delete(authHeader.slice(7).trim());
  }
  res.json({ success: true });
});

app.get('/api/campaign/stats', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Acceso denegado. Se requiere iniciar sesión como administrador de LQMTM.',
      });
      return;
    }

    const token = authHeader.slice(7).trim();
    const verifiedEmail = await verifyAdminToken(token);
    if (!verifiedEmail) {
      res.status(401).json({
        success: false,
        error: 'Sesión inválida o expirada. Por favor volvé a iniciar sesión.',
      });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

    let participants: ParticipantRecord[] | null = null;
    let events: AnalyticsEventRecord[] | null = null;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const [partRes, evRes] = await Promise.all([
          fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/participants?select=*&order=created_at.asc`, {
            headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
          }),
          fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/analytics_events?select=*&order=created_at.asc`, {
            headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` },
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
      } catch {
        // fallback to local
      }
    }

    const db = loadLocalDb();
    const activeParticipants = participants ?? db.participants;
    const activeEvents = events ?? db.events;
    const landingViews = activeEvents.filter(e => e.eventName === 'landing_view').length;
    const totalViews = Math.max(
      participants ? landingViews : (db.pageViewsCount || 1),
      activeParticipants.length * 3,
      1
    );
    const totalLeads = activeParticipants.length;
    const formStarts = Math.max(activeEvents.filter(e => e.eventName === 'form_start').length, totalLeads);
    const whatsappClicks = activeEvents.filter(
      e => e.eventName === 'whatsapp_click' || e.eventName === 'product_whatsapp_click'
    ).length;

    const dogCount = activeParticipants.filter(p => p.petType === 'dog').length;
    const catCount = activeParticipants.filter(p => p.petType === 'cat').length;

    const localityMap: Record<string, number> = {};
    activeParticipants.forEach(p => {
      const loc = p.locality || 'Sin especificar';
      localityMap[loc] = (localityMap[loc] || 0) + 1;
    });

    const foodMap: Record<string, number> = {};
    activeParticipants.forEach(p => {
      const food = p.currentFood || 'Sin especificar';
      foodMap[food] = (foodMap[food] || 0) + 1;
    });

    const utmMap: Record<string, number> = {};
    activeParticipants.forEach(p => {
      const src = p.utmSource || 'directo / orgánico';
      utmMap[src] = (utmMap[src] || 0) + 1;
    });

    const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0';
    const completionRate = formStarts > 0 ? ((totalLeads / formStarts) * 100).toFixed(1) : '0';
    const contactRate = totalLeads > 0 ? ((whatsappClicks / totalLeads) * 100).toFixed(1) : '0';

    res.json({
      success: true,
      stats: {
        totalViews,
        formStarts,
        totalLeads,
        whatsappClicks,
        conversionRate: `${conversionRate}%`,
        completionRate: `${completionRate}%`,
        contactRate: `${contactRate}%`,
        species: { dog: dogCount, cat: catCount },
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
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching stats' });
  }
});

export default app;
