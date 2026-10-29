import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  registerParticipant,
  recordAnalyticsEvent,
  getCampaignStats,
  checkRateLimit,
  checkAuthRateLimit,
  recordFailedAuthAttempt,
  clearFailedAuthAttempts,
  hashIp,
} from './src/db/storage';
import { normalizeArgentinePhone } from './src/utils/phone';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

interface AdminSession {
  email: string;
  expiresAt: number;
}

const activeSessions = new Map<string, AdminSession>();

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    // Perform dummy comparison to avoid leaking length via timing
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

async function verifyAdminToken(token: string): Promise<string | null> {
  if (!token) return null;

  // 1. Check in-memory session store
  const session = activeSessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return null;
    }
    return session.email;
  }

  // 2. If Supabase Auth is configured, validate token against Supabase Auth API
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
        if (user?.email) {
          return String(user.email);
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}

// Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.json({ limit: '100kb' }));

// Healthcheck
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'lqmtm-acquisition-funnel', timestamp: new Date().toISOString() });
});

// API Route: Register Raffle Participant
app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    const ipHash = hashIp(clientIp);

    // 1. Rate limiting check
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

    // 2. Validate required text fields
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION',
        field: 'fullName',
        error: 'Ingresá tu nombre y apellido.',
      });
      return;
    }

    if (!petName || typeof petName !== 'string' || petName.trim().length < 1) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION',
        field: 'petName',
        error: 'Ingresá el nombre de tu mascota.',
      });
      return;
    }

    if (petType !== 'dog' && petType !== 'cat') {
      res.status(400).json({
        success: false,
        code: 'VALIDATION',
        field: 'petType',
        error: 'Seleccioná si tu compañero es un perro o un gato.',
      });
      return;
    }

    if (!locality || typeof locality !== 'string' || locality.trim().length < 2) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION',
        field: 'locality',
        error: 'Ingresá tu localidad (ej. CABA, San Isidro, etc.).',
      });
      return;
    }

    if (!currentFood || typeof currentFood !== 'string' || currentFood.trim().length < 2) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION',
        field: 'currentFood',
        error: 'Indicá qué alimento consume actualmente o seleccioná una opción.',
      });
      return;
    }

    // 3. Normalize & Validate Argentine Phone Number
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

    // 4. Validate Terms & Conditions acceptance
    if (termsAccepted !== true) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION',
        field: 'termsAccepted',
        error: 'Debés aceptar las bases y condiciones para participar del sorteo.',
      });
      return;
    }

    // 5. Persist Participant in Database
    const registerResult = await registerParticipant({
      fullName,
      petName,
      petType,
      locality,
      currentFood,
      phoneNormalized: phoneResult.normalized,
      termsAccepted: true,
      termsVersion: String(termsVersion),
      marketingConsent: Boolean(marketingConsent),
      utmSource: utmSource ? String(utmSource).slice(0, 100) : undefined,
      utmMedium: utmMedium ? String(utmMedium).slice(0, 100) : undefined,
      utmCampaign: utmCampaign ? String(utmCampaign).slice(0, 100) : undefined,
      utmContent: utmContent ? String(utmContent).slice(0, 100) : undefined,
      utmTerm: utmTerm ? String(utmTerm).slice(0, 100) : undefined,
      fbclid: fbclid ? String(fbclid).slice(0, 150) : undefined,
      ipAddress: clientIp,
    });

    if (!registerResult.success) {
      if (registerResult.code === 'DUPLICATE') {
        res.status(409).json({
          success: false,
          code: 'DUPLICATE',
          error: registerResult.error,
        });
        return;
      }

      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        error: 'No se pudo guardar la participación. Por favor intentá nuevamente.',
      });
      return;
    }

    // Return sanitized participant record for personalized confirmation
    const p = registerResult.participant!;
    res.status(201).json({
      success: true,
      participant: {
        id: p.id,
        fullName: p.fullName,
        petName: p.petName,
        petType: p.petType,
        locality: p.locality,
        currentFood: p.currentFood,
        phoneNormalized: p.phoneNormalized,
        marketingConsent: p.marketingConsent,
        createdAt: p.createdAt,
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

// API Route: Internal Analytics Track
app.post('/api/analytics/track', async (req: Request, res: Response) => {
  try {
    const { eventName, eventData, utms } = req.body || {};
    if (eventName && typeof eventName === 'string') {
      await recordAnalyticsEvent(eventName.slice(0, 80), eventData, utms);
    }
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

// API Route: Login for Marketing & Administration
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

    // Option A: Authenticate via Supabase Auth if SUPABASE_URL and SUPABASE_ANON_KEY are configured
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

    // Option B: Authenticate via server-side environment variables (ADMIN_EMAIL & ADMIN_PASSWORD)
    const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (!configuredEmail || !configuredPassword || configuredPassword === 'CHANGE_ME_STRONG_PASSWORD') {
      res.status(503).json({
        success: false,
        error: 'Las credenciales de administrador no están configuradas en el servidor (.env).',
      });
      return;
    }

    const isEmailMatch = safeCompare(normalizedEmail, configuredEmail);
    const isPasswordMatch = safeCompare(password, configuredPassword);

    if (!isEmailMatch || !isPasswordMatch) {
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

// API Route: Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    activeSessions.delete(token);
  }
  res.json({ success: true });
});

// API Route: Campaign Performance Stats (Protected)
app.get('/api/campaign/stats', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Acceso denegado. Se requiere iniciar sesión como administrador de LQMTM para consultar las métricas.',
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

    const stats = await getCampaignStats(token);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching stats' });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LQMTM server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
