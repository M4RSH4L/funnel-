import React from 'react';
import { CAMPAIGN_CONFIG } from '../config/campaign';
import { BarChart3, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenStats: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenStats }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
          <img
            src={CAMPAIGN_CONFIG.brand.logoUrl}
            alt={CAMPAIGN_CONFIG.brand.name}
            className="h-10 w-auto object-contain drop-shadow-xs"
          />
        </a>

        {/* Campaign Badge & Marketing Stats Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sorteo Oficial 2026</span>
          </div>

          <button
            onClick={onOpenStats}
            type="button"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium transition-colors"
            title="Ver métricas de campaña y analítica"
            aria-label="Abrir panel de métricas de campaña"
          >
            <BarChart3 className="w-3.5 h-3.5 text-neutral-600" />
            <span className="hidden sm:inline">Métricas</span>
          </button>
        </div>
      </div>
    </header>
  );
};
