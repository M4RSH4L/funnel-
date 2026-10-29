import React, { useEffect, useState } from 'react';
import {
  X,
  Users,
  Eye,
  TrendingUp,
  MessageCircle,
  Dog,
  Cat,
  MapPin,
  Utensils,
  Share2,
  RefreshCw,
  Lock,
  LogOut,
  KeyRound,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { CAMPAIGN_CONFIG } from '../config/campaign';

interface CampaignStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_AUTH_TOKEN_KEY = 'lqmtm_admin_auth_token';
const STORAGE_AUTH_USER_KEY = 'lqmtm_admin_auth_user';

export const CampaignStatsModal: React.FC<CampaignStatsModalProps> = ({ isOpen, onClose }) => {
  // Authentication state
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Check stored session on mount or when modal opens
  useEffect(() => {
    if (isOpen) {
      const storedToken = sessionStorage.getItem(STORAGE_AUTH_TOKEN_KEY);
      const storedUser = sessionStorage.getItem(STORAGE_AUTH_USER_KEY);
      if (storedToken) {
        setToken(storedToken);
        setUserEmail(storedUser || 'admin@loquemasticatumascota.com.ar');
        fetchStats(storedToken);
      } else {
        setToken(null);
      }
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticating(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Credenciales inválidas. Verificá tu usuario y contraseña.');
        setIsAuthenticating(false);
        return;
      }

      // Store in session storage
      sessionStorage.setItem(STORAGE_AUTH_TOKEN_KEY, data.token);
      sessionStorage.setItem(STORAGE_AUTH_USER_KEY, data.user?.email || loginEmail);
      setToken(data.token);
      setUserEmail(data.user?.email || loginEmail);
      setLoginPassword('');

      // Load stats immediately with the valid token
      await fetchStats(data.token);
    } catch {
      setLoginError('No se pudo conectar con el servidor de autenticación.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    const activeToken = sessionStorage.getItem(STORAGE_AUTH_TOKEN_KEY);
    if (activeToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeToken}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem(STORAGE_AUTH_TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_AUTH_USER_KEY);
    setToken(null);
    setUserEmail(null);
    setStats(null);
  };

  const fetchStats = async (activeToken: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaign/stats', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-stats-title"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-100 bg-neutral-900 text-white">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <div>
              <h3 id="modal-stats-title" className="text-sm sm:text-base font-black">
                {token ? 'Panel de Analítica y Rendimiento' : 'Acceso Restringido a Métricas'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {token
                  ? `Conectado como ${userEmail}`
                  : 'Requiere inicio de sesión del equipo de marketing'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <>
                <button
                  type="button"
                  onClick={() => fetchStats(token)}
                  disabled={loading}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Actualizar datos"
                  aria-label="Actualizar datos"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-label="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {!token ? (
          /* LOGIN SCREEN */
          <div className="p-6 sm:p-8 overflow-y-auto">
            <div className="max-w-md mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 mx-auto flex items-center justify-center mb-4 shadow-sm">
                <Lock className="w-7 h-7 text-amber-700" />
              </div>

              <h4 className="text-xl font-black text-neutral-900 tracking-tight">
                Iniciar Sesión para ver Métricas
              </h4>
              <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                El acceso a los datos de conversión, costo por lead y registros del sorteo está
                reservado exclusivamente al equipo de marketing y administración de LQMTM.
              </p>

              {loginError && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs text-left flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-6 space-y-4 text-left">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="block text-xs font-bold text-neutral-700 mb-1"
                  >
                    Usuario / Email corporativo
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@loquemasticatumascota.com.ar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm bg-neutral-50/50 focus:bg-white focus:ring-2 focus:ring-amber-300 focus:border-amber-500 outline-hidden transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="block text-xs font-bold text-neutral-700 mb-1"
                  >
                    Contraseña
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm bg-neutral-50/50 focus:bg-white focus:ring-2 focus:ring-amber-300 focus:border-amber-500 outline-hidden transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-black text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando credenciales...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Ingresar al Panel</span>
                    </>
                  )}
                </button>
              </form>

              {/* Security Notice */}
              <div className="mt-6 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-left text-[11px] text-neutral-600 leading-normal">
                <span className="font-bold text-neutral-800 flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Acceso protegido con autenticación
                </span>
                Sesión verificada en servidor mediante credenciales de entorno o Supabase Auth, con
                protección contra fuerza bruta y expiración automática de token.
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED STATS DASHBOARD */
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Key CRO Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200">
                <span className="text-[11px] text-neutral-500 font-bold block flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-neutral-400" /> Visitas
                </span>
                <span className="text-xl font-black text-neutral-900 mt-1 block">
                  {stats?.totalViews ?? '—'}
                </span>
              </div>

              <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200">
                <span className="text-[11px] text-amber-800 font-bold block flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-amber-600" /> Leads Válidos
                </span>
                <span className="text-xl font-black text-amber-950 mt-1 block">
                  {stats?.totalLeads ?? '—'}
                </span>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-bold block">
                  Conv. Visita → Lead
                </span>
                <span className="text-xl font-black text-emerald-700 mt-1 block">
                  {stats?.conversionRate ?? '—'}
                </span>
              </div>

              <div className="bg-blue-50 rounded-2xl p-3.5 border border-blue-200">
                <span className="text-[11px] text-blue-800 font-bold block flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-blue-600" /> Clics WhatsApp
                </span>
                <span className="text-xl font-black text-blue-900 mt-1 block">
                  {stats?.whatsappClicks ?? '—'}
                </span>
              </div>
            </div>

            {/* Secondary conversion rates */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-100/70 p-3 rounded-xl">
              <div>
                <span className="text-neutral-500">Tasa de Finalización (Iniciados → Lead):</span>
                <span className="font-bold text-neutral-800 block text-sm mt-0.5">
                  {stats?.completionRate ?? '—'}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Tasa de Contacto (Leads → WhatsApp):</span>
                <span className="font-bold text-neutral-800 block text-sm mt-0.5">
                  {stats?.contactRate ?? '—'}
                </span>
              </div>
            </div>

            {/* Species Distribution */}
            <div>
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>Distribución por Especie</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dog className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold text-neutral-800">Perros</span>
                  </div>
                  <span className="text-sm font-black text-neutral-900">
                    {stats?.species?.dog ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cat className="w-5 h-5 text-red-600" />
                    <span className="text-xs font-bold text-neutral-800">Gatos</span>
                  </div>
                  <span className="text-sm font-black text-neutral-900">
                    {stats?.species?.cat ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Localities & Foods */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Top Localidades</span>
                </h4>
                <div className="space-y-1.5">
                  {stats?.topLocalities?.map((loc: any) => (
                    <div
                      key={loc.name}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-50 border border-neutral-200"
                    >
                      <span className="text-neutral-700 truncate pr-2">{loc.name}</span>
                      <span className="font-bold text-neutral-900 shrink-0">{loc.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  <span>Top Alimento Actual</span>
                </h4>
                <div className="space-y-1.5">
                  {stats?.topFoods?.map((f: any) => (
                    <div
                      key={f.name}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-50 border border-neutral-200"
                    >
                      <span className="text-neutral-700 truncate pr-2">{f.name}</span>
                      <span className="font-bold text-neutral-900 shrink-0">{f.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* UTM Attribution Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Atribución por Fuente (UTM Source)</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {stats?.sources?.map((s: any) => (
                  <div
                    key={s.name}
                    className="px-3 py-1.5 rounded-lg bg-neutral-100 border border-neutral-200 text-xs flex items-center gap-2"
                  >
                    <span className="font-semibold text-neutral-700">{s.name}</span>
                    <span className="font-black px-1.5 py-0.5 rounded-md bg-white text-neutral-900 border border-neutral-300">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Registrations Table */}
            {stats?.recentParticipants?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Últimos Registros (Dato Anonimizado)
                </h4>
                <div className="border border-neutral-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left divide-y divide-neutral-200">
                    <thead className="bg-neutral-100 text-neutral-600 font-semibold">
                      <tr>
                        <th className="p-2">Mascota</th>
                        <th className="p-2">Localidad</th>
                        <th className="p-2">Teléfono</th>
                        <th className="p-2">Consent. Marketing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {stats.recentParticipants.map((p: any) => (
                        <tr key={p.id}>
                          <td className="p-2 font-bold text-neutral-900">
                            {p.petName} ({p.petType === 'dog' ? 'Perro' : 'Gato'})
                          </td>
                          <td className="p-2 text-neutral-600">{p.locality}</td>
                          <td className="p-2 text-neutral-600 font-mono">{p.phoneMasked}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.marketingConsent
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {p.marketingConsent ? 'Sí' : 'No'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
