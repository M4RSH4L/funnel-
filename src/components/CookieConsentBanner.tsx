import React, { useState, useEffect } from 'react';
import { setUserConsent } from '../utils/analytics';
import { initMetaPixel } from '../utils/metaPixel';
import { ShieldCheck } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenPrivacy: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenPrivacy }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lqmtm_cookie_consent');
      if (!stored) {
        setIsVisible(true);
      } else if (stored === 'granted') {
        initMetaPixel(true);
      }
    } catch {
      // ignore storage access issues
    }
  }, []);

  const handleAccept = () => {
    setUserConsent(true);
    initMetaPixel(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    setUserConsent(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de privacidad y cookies"
      className="fixed bottom-0 inset-x-0 z-40 bg-neutral-900/95 text-white backdrop-blur-md border-t border-neutral-800 p-4 sm:p-5 shadow-2xl animate-slide-up"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-300 leading-relaxed">
            Utilizamos analítica y Meta Pixel para medir la efectividad de nuestras campañas y optimizar la experiencia
            del sorteo conforme a la Ley 25.326. Podés consultar nuestra{' '}
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="text-amber-400 hover:underline font-semibold"
            >
              Política de Privacidad
            </button>
            .
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Solo necesarias
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-neutral-950 transition-colors shadow-xs"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
};
