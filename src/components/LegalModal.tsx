import React, { useEffect } from 'react';
import { CAMPAIGN_CONFIG } from '../config/campaign';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (type) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [type, onClose]);

  if (!type) return null;

  const isTerms = type === 'terms';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-legal-title"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50/70">
          <div className="flex items-center gap-2">
            {isTerms ? (
              <FileText className="w-5 h-5 text-red-600" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            )}
            <h3 id="modal-legal-title" className="text-base sm:text-lg font-black text-neutral-900">
              {isTerms ? 'Bases y Condiciones del Sorteo' : 'Política de Privacidad'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
            aria-label="Cerrar ventana modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-4">
          {isTerms ? (
            <>
              <p className="font-bold text-neutral-900">
                {CAMPAIGN_CONFIG.legal.termsTitle} (Versión {CAMPAIGN_CONFIG.raffle.termsVersion})
              </p>
              <ul className="space-y-2 list-disc pl-5">
                {CAMPAIGN_CONFIG.legal.termsSummary.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                <strong>Importante:</strong> El premio es personal e intransferible y no podrá ser canjeado por dinero
                en efectivo u otros bienes ajenos a la oferta del sorteo.
              </div>
            </>
          ) : (
            <>
              <p className="font-bold text-neutral-900">
                Tratamiento de Datos Personales conforme a la Ley Nacional Nº 25.326 de la República Argentina.
              </p>
              <ul className="space-y-2 list-disc pl-5">
                {CAMPAIGN_CONFIG.legal.privacyPolicySummary.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma
                gratuita a intervalos no inferiores a seis meses (art. 14, inc. 3 de la Ley 25.326).
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
