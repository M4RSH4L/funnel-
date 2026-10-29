import React from 'react';
import { CAMPAIGN_CONFIG } from '../config/campaign';
import { Instagram, Facebook, MessageCircle, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTerms, onOpenPrivacy }) => {
  return (
    <footer className="bg-neutral-950 text-neutral-400 py-10 border-t border-neutral-800">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-neutral-800/80">
          {/* Logo & Brand statement */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs inline-block mb-2">
              <img
                src={CAMPAIGN_CONFIG.brand.logoUrl}
                alt={CAMPAIGN_CONFIG.brand.name}
                className="h-9 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-neutral-400 max-w-xs">
              Alimentos balanceados, snacks y bienestar para perros y gatos. Envíos directos en CABA y GBA.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex flex-col items-center sm:items-end gap-2">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Nuestras Redes Oficiales
            </span>
            <div className="flex items-center gap-3">
              <a
                href={CAMPAIGN_CONFIG.contacts.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center transition-colors"
                aria-label="Instagram oficial de Lo Que Mastica Tu Mascota"
              >
                <Instagram className="w-5 h-5" />
              </a>

              <a
                href={`https://wa.me/${CAMPAIGN_CONFIG.contacts.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-emerald-600 text-neutral-200 flex items-center justify-center transition-colors"
                aria-label="WhatsApp de atención de Lo Que Mastica Tu Mascota"
              >
                <MessageCircle className="w-5 h-5" />
              </a>

              <a
                href={CAMPAIGN_CONFIG.contacts.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center transition-colors"
                aria-label="Facebook oficial de Lo Que Mastica Tu Mascota"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Legal links & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onOpenTerms}
              className="hover:text-amber-400 transition-colors underline cursor-pointer"
            >
              Bases y Condiciones del Sorteo
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="hover:text-amber-400 transition-colors underline cursor-pointer"
            >
              Política de Privacidad
            </button>
          </div>

          <div className="flex items-center gap-1.5 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
            <span>Ley 25.326 de Protección de Datos Personales (Argentina)</span>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-neutral-600 text-center">
          © {new Date().getFullYear()} {CAMPAIGN_CONFIG.brand.name}. Todos los derechos reservados. Las imágenes de productos y marcas son propiedad de sus respectivos fabricantes.
        </p>
      </div>
    </footer>
  );
};
