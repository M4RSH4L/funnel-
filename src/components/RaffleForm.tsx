import React, { useState, useEffect, useRef } from 'react';
import { CAMPAIGN_CONFIG } from '../config/campaign';
import { normalizeArgentinePhone } from '../utils/phone';
import { trackEvent, getStoredUtm } from '../utils/analytics';
import {
  Dog,
  Cat,
  User,
  Heart,
  MapPin,
  Utensils,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  ChevronDown,
} from 'lucide-react';

export interface ParticipantSuccessData {
  id: string;
  fullName: string;
  petName: string;
  petType: 'dog' | 'cat';
  locality: string;
  currentFood: string;
  phoneNormalized: string;
  marketingConsent: boolean;
  createdAt: string;
}

interface RaffleFormProps {
  onSuccess: (data: ParticipantSuccessData) => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const RaffleForm: React.FC<RaffleFormProps> = ({
  onSuccess,
  onOpenTerms,
  onOpenPrivacy,
}) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState<'dog' | 'cat'>('dog');
  const [locality, setLocality] = useState('');
  const [currentFood, setCurrentFood] = useState('');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [formStarted, setFormStarted] = useState(false);

  // Suggestions dropdown state
  const [showLocalitySuggestions, setShowLocalitySuggestions] = useState(false);
  const [showFoodSuggestions, setShowFoodSuggestions] = useState(false);

  const localityRef = useRef<HTMLDivElement>(null);
  const foodRef = useRef<HTMLDivElement>(null);

  // Live phone validation preview
  const phoneValidation = phoneRaw.trim().length > 3 ? normalizeArgentinePhone(phoneRaw) : null;

  // Track form_start once when user first focuses/interacts with any field
  const handleFirstInteraction = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackEvent('form_start');
    }
  };

  // Close suggestion popups when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (localityRef.current && !localityRef.current.contains(event.target as Node)) {
        setShowLocalitySuggestions(false);
      }
      if (foodRef.current && !foodRef.current.contains(event.target as Node)) {
        setShowFoodSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLocalities = CAMPAIGN_CONFIG.popularLocalities.filter((loc) =>
    loc.toLowerCase().includes(locality.toLowerCase())
  );

  const filteredFoods = CAMPAIGN_CONFIG.popularFoodBrands.filter((f) =>
    f.toLowerCase().includes(currentFood.toLowerCase())
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 3) {
      newErrors.fullName = 'Ingresá tu nombre y apellido completo.';
    }

    if (!petName.trim()) {
      newErrors.petName = 'Ingresá el nombre de tu mascota.';
    }

    if (!locality.trim()) {
      newErrors.locality = 'Ingresá tu localidad o barrio.';
    }

    if (!currentFood.trim()) {
      newErrors.currentFood = 'Indicá qué alimento consume actualmente.';
    }

    const phoneCheck = normalizeArgentinePhone(phoneRaw);
    if (!phoneCheck.isValid) {
      newErrors.phone = phoneCheck.errorMessage || 'Ingresá un número de WhatsApp válido (ej. 11 2345-6789).';
    }

    if (!termsAccepted) {
      newErrors.terms = 'Debés aceptar las bases y condiciones para participar.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      trackEvent('form_validation_error', { field: firstErrorField });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    handleFirstInteraction();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    trackEvent('form_submit', { petType });

    const phoneResult = normalizeArgentinePhone(phoneRaw);
    const utms = getStoredUtm();

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          petName: petName.trim(),
          petType,
          locality: locality.trim(),
          currentFood: currentFood.trim(),
          phone: phoneRaw.trim(),
          termsAccepted: true,
          termsVersion: CAMPAIGN_CONFIG.raffle.termsVersion,
          marketingConsent,
          utmSource: utms.utm_source,
          utmMedium: utms.utm_medium,
          utmCampaign: utms.utm_campaign,
          utmContent: utms.utm_content,
          utmTerm: utms.utm_term,
          fbclid: utms.fbclid,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.code === 'DUPLICATE') {
          // If already registered, allow viewing confirmation or contacting
          setGlobalError(data.error || 'Este número ya fue registrado previamente para este sorteo.');
          trackEvent('registration_error', { reason: 'duplicate' });
        } else {
          setGlobalError(data.error || 'Ocurrió un error al procesar tu registro. Por favor verificá tus datos.');
          trackEvent('registration_error', { reason: data.code || 'validation_failed' });
        }
        setIsSubmitting(false);
        return;
      }

      // Successful registration confirmed by server
      const participant = data.participant as ParticipantSuccessData;

      // Dispatch high-priority conversion events
      trackEvent('registration_success', {
        registrationId: participant.id,
        petType: participant.petType,
      });

      // Advance funnel to Estado B
      onSuccess(participant);
    } catch (err) {
      console.error('Registration fetch failed:', err);
      setGlobalError('No pudimos conectar con el servidor. Revisá tu conexión a internet e intentá nuevamente.');
      trackEvent('registration_error', { reason: 'network_failure' });
      setIsSubmitting(false);
    }
  };

  return (
    <div id="formulario-sorteo" className="max-w-xl mx-auto px-4 pb-12 pt-2">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-200/90 relative">
        {/* Form Header */}
        <div className="mb-6 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-neutral-950 text-xs font-black uppercase tracking-wider mb-2 shadow-2xs">
            Paso Único
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            Completá tus datos para participar
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Solo te tomará 30 segundos. ¡Sin spam ni llamadas molestas!
          </p>
        </div>

        {/* Global Error Banner */}
        {globalError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-3 animate-fade-in"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="leading-snug">{globalError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* 1. Nombre y Apellido */}
          <div>
            <label
              htmlFor="field-fullName"
              className="block text-xs sm:text-sm font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5"
            >
              <User className="w-4 h-4 text-amber-600" />
              <span>Tu Nombre y Apellido *</span>
            </label>
            <input
              id="field-fullName"
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Ej. Juan Pérez"
              value={fullName}
              onFocus={handleFirstInteraction}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-hidden focus:ring-3 ${
                errors.fullName
                  ? 'border-red-400 bg-red-50/30 focus:ring-red-200'
                  : 'border-neutral-300 bg-neutral-50/50 focus:border-amber-500 focus:ring-amber-200 focus:bg-white'
              }`}
            />
            {errors.fullName && (
              <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.fullName}
              </p>
            )}
          </div>

          {/* 2. Especie (Perro / Gato) - Large visual cards */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-amber-600" />
              <span>¿Qué compañero tenés? *</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Option Dog */}
              <button
                type="button"
                onClick={() => {
                  handleFirstInteraction();
                  setPetType('dog');
                }}
                className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer text-center select-none ${
                  petType === 'dog'
                    ? 'border-red-600 bg-gradient-to-b from-amber-50 to-red-50/40 shadow-md ring-2 ring-red-500/20'
                    : 'border-neutral-200 bg-neutral-50/60 hover:bg-neutral-100/80 hover:border-neutral-300'
                }`}
                aria-pressed={petType === 'dog'}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-transform ${
                    petType === 'dog' ? 'bg-red-600 text-white scale-110 shadow-xs' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  <Dog className="w-6 h-6" />
                </div>
                <span className={`text-sm font-extrabold ${petType === 'dog' ? 'text-red-700' : 'text-neutral-700'}`}>
                  Perro
                </span>
                <span className="text-[11px] text-neutral-500 font-medium">Canino</span>
                {petType === 'dog' && (
                  <span className="absolute top-2 right-2 text-red-600">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                )}
              </button>

              {/* Option Cat */}
              <button
                type="button"
                onClick={() => {
                  handleFirstInteraction();
                  setPetType('cat');
                }}
                className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer text-center select-none ${
                  petType === 'cat'
                    ? 'border-red-600 bg-gradient-to-b from-amber-50 to-red-50/40 shadow-md ring-2 ring-red-500/20'
                    : 'border-neutral-200 bg-neutral-50/60 hover:bg-neutral-100/80 hover:border-neutral-300'
                }`}
                aria-pressed={petType === 'cat'}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-transform ${
                    petType === 'cat' ? 'bg-red-600 text-white scale-110 shadow-xs' : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  <Cat className="w-6 h-6" />
                </div>
                <span className={`text-sm font-extrabold ${petType === 'cat' ? 'text-red-700' : 'text-neutral-700'}`}>
                  Gato
                </span>
                <span className="text-[11px] text-neutral-500 font-medium">Felino</span>
                {petType === 'cat' && (
                  <span className="absolute top-2 right-2 text-red-600">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 3. Nombre de la Mascota */}
          <div>
            <label
              htmlFor="field-petName"
              className="block text-xs sm:text-sm font-bold text-neutral-800 mb-1.5 flex items-center gap-1.5"
            >
              <Heart className="w-4 h-4 text-amber-600" />
              <span>Nombre de tu mascota *</span>
            </label>
            <input
              id="field-petName"
              type="text"
              placeholder="¿Cómo se llama tu compañero?"
              value={petName}
              onFocus={handleFirstInteraction}
              onChange={(e) => {
                setPetName(e.target.value);
                if (errors.petName) setErrors((prev) => ({ ...prev, petName: '' }));
              }}
              className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-hidden focus:ring-3 ${
                errors.petName
                  ? 'border-red-400 bg-red-50/30 focus:ring-red-200'
                  : 'border-neutral-300 bg-neutral-50/50 focus:border-amber-500 focus:ring-amber-200 focus:bg-white'
              }`}
            />
            {errors.petName && (
              <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.petName}
              </p>
            )}
          </div>

          {/* 4. Localidad (with suggestions & free text) */}
          <div className="relative" ref={localityRef}>
            <label
              htmlFor="field-locality"
              className="block text-xs sm:text-sm font-bold text-neutral-800 mb-1.5 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Localidad / Barrio *</span>
              </span>
            </label>
            <div className="relative">
              <input
                id="field-locality"
                type="text"
                placeholder="Ej. CABA Palermo, Vicente López, Quilmes..."
                value={locality}
                onFocus={() => {
                  handleFirstInteraction();
                  setShowLocalitySuggestions(true);
                }}
                onChange={(e) => {
                  setLocality(e.target.value);
                  setShowLocalitySuggestions(true);
                  if (errors.locality) setErrors((prev) => ({ ...prev, locality: '' }));
                }}
                className={`w-full px-4 py-3 pr-10 rounded-xl border text-sm transition-all outline-hidden focus:ring-3 ${
                  errors.locality
                    ? 'border-red-400 bg-red-50/30 focus:ring-red-200'
                    : 'border-neutral-300 bg-neutral-50/50 focus:border-amber-500 focus:ring-amber-200 focus:bg-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowLocalitySuggestions(!showLocalitySuggestions)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                aria-label="Mostrar sugerencias de localidad"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Suggestions dropdown */}
            {showLocalitySuggestions && filteredLocalities.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-neutral-200 max-h-48 overflow-y-auto divide-y divide-neutral-100">
                {filteredLocalities.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setLocality(loc);
                      setShowLocalitySuggestions(false);
                      if (errors.locality) setErrors((prev) => ({ ...prev, locality: '' }));
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-neutral-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{loc}</span>
                  </button>
                ))}
              </div>
            )}

            {errors.locality && (
              <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.locality}
              </p>
            )}
          </div>

          {/* 5. Alimento Actual (with suggestions & free text) */}
          <div className="relative" ref={foodRef}>
            <label
              htmlFor="field-currentFood"
              className="block text-xs sm:text-sm font-bold text-neutral-800 mb-1.5 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span>¿Qué alimento come hoy? *</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-normal">Marca o tipo</span>
            </label>
            <div className="relative">
              <input
                id="field-currentFood"
                type="text"
                placeholder="Ej. Xitallcan, Royal Canin, Pro Plan, etc."
                value={currentFood}
                onFocus={() => {
                  handleFirstInteraction();
                  setShowFoodSuggestions(true);
                }}
                onChange={(e) => {
                  setCurrentFood(e.target.value);
                  setShowFoodSuggestions(true);
                  if (errors.currentFood) setErrors((prev) => ({ ...prev, currentFood: '' }));
                }}
                className={`w-full px-4 py-3 pr-10 rounded-xl border text-sm transition-all outline-hidden focus:ring-3 ${
                  errors.currentFood
                    ? 'border-red-400 bg-red-50/30 focus:ring-red-200'
                    : 'border-neutral-300 bg-neutral-50/50 focus:border-amber-500 focus:ring-amber-200 focus:bg-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowFoodSuggestions(!showFoodSuggestions)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                aria-label="Mostrar sugerencias de alimento"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Suggestions dropdown */}
            {showFoodSuggestions && filteredFoods.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-neutral-200 max-h-48 overflow-y-auto divide-y divide-neutral-100">
                {filteredFoods.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setCurrentFood(f);
                      setShowFoodSuggestions(false);
                      if (errors.currentFood) setErrors((prev) => ({ ...prev, currentFood: '' }));
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs sm:text-sm text-neutral-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center gap-2"
                  >
                    <Utensils className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{f}</span>
                  </button>
                ))}
              </div>
            )}

            {errors.currentFood && (
              <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.currentFood}
              </p>
            )}
          </div>

          {/* 6. WhatsApp (Argentine phone with prefix +54 9) */}
          <div>
            <label
              htmlFor="field-phone"
              className="block text-xs sm:text-sm font-bold text-neutral-800 mb-1.5 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp de contacto *</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">Te avisamos si ganás</span>
            </label>
            <div className="relative flex rounded-xl border overflow-hidden focus-within:ring-3 focus-within:ring-amber-200 focus-within:border-amber-500 transition-all">
              {/* Argentina international prefix badge */}
              <div className="bg-neutral-100 border-r border-neutral-300 px-3 py-3 text-xs sm:text-sm font-bold text-neutral-700 flex items-center gap-1.5 shrink-0 select-none">
                <span>🇦🇷 +54 9</span>
              </div>
              <input
                id="field-phone"
                type="tel"
                inputMode="tel"
                name="tel"
                autoComplete="tel"
                placeholder="11 2345-6789"
                value={phoneRaw}
                onFocus={handleFirstInteraction}
                onChange={(e) => {
                  setPhoneRaw(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                className={`w-full px-4 py-3 text-sm bg-neutral-50/50 outline-hidden ${
                  errors.phone ? 'bg-red-50/30' : 'bg-white'
                }`}
              />
            </div>

            {/* Inline validation status */}
            {phoneValidation && (
              <div className="mt-1 text-xs">
                {phoneValidation.isValid ? (
                  <p className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" /> Formato válido: {phoneValidation.displayFormatted}
                  </p>
                ) : (
                  <p className="text-neutral-500">{phoneValidation.errorMessage}</p>
                )}
              </div>
            )}

            {errors.phone && (
              <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
              </p>
            )}
          </div>

          {/* Legal Acceptance & Marketing Consent Checkboxes */}
          <div className="pt-2 space-y-3">
            {/* Mandatory Terms Checkbox */}
            <label className="flex items-start gap-2.5 text-xs text-neutral-700 cursor-pointer select-none">
              <input
                id="checkbox-terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  if (errors.terms) setErrors((prev) => ({ ...prev, terms: '' }));
                }}
                className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-amber-400 border-neutral-300 cursor-pointer"
              />
              <span className="leading-snug">
                Acepto las{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenTerms();
                  }}
                  className="font-bold text-red-600 hover:text-red-700 underline"
                >
                  Bases y Condiciones del Sorteo
                </button>{' '}
                y la{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenPrivacy();
                  }}
                  className="font-bold text-red-600 hover:text-red-700 underline"
                >
                  Política de Privacidad
                </button>
                .*
              </span>
            </label>
            {errors.terms && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1 pl-6">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.terms}
              </p>
            )}

            {/* Optional Marketing Consent Checkbox (independent, unchecked by default) */}
            <label className="flex items-start gap-2.5 text-xs text-neutral-600 cursor-pointer select-none">
              <input
                id="checkbox-marketing"
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-400 border-neutral-300 cursor-pointer"
              />
              <span className="leading-snug">
                (Opcional) Deseo recibir ofertas exclusivas de primera compra, promociones y novedades de LQMTM por
                WhatsApp.
              </span>
            </label>
          </div>

          {/* Big High-Converting CTA Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer ${
                isSubmitting
                  ? 'bg-neutral-400 text-neutral-200 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-500 text-neutral-950 border-2 border-amber-500 hover:border-amber-600 shadow-amber-300/40 hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Guardando tu participación...</span>
                </>
              ) : (
                <>
                  <span>¡Quiero participar!</span>
                </>
              )}
            </button>
          </div>

          {/* Trust badges */}
          <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-neutral-500 font-medium">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-neutral-400" /> Datos 100% protegidos
            </span>
            <span>•</span>
            <span>Sin costo alguno</span>
            <span>•</span>
            <span>Ley 25.326</span>
          </div>
        </form>
      </div>
    </div>
  );
};
