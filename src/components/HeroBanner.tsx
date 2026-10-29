import React from 'react';
import { CAMPAIGN_CONFIG } from '../config/campaign';
import { Sparkles, CheckCircle2, ArrowDown } from 'lucide-react';

interface HeroBannerProps {
  onScrollToForm: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onScrollToForm }) => {
  return (
    <section className="relative overflow-hidden w-full">
      <div className="relative w-full">
        {/* Main Banner Visual - uncropped natural aspect ratio */}
        <div className="relative max-w-sm sm:max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-300/90 bg-neutral-900 group">
          <img
            src={CAMPAIGN_CONFIG.brand.heroBannerUrl}
            alt="Gran Sorteo 1 Año de Alimento Gratis - Lo Que Mastica Tu Mascota"
            className="w-full h-auto object-contain select-none transition-transform duration-500 group-hover:scale-[1.01]"
            loading="eager"
            width={800}
            height={1000}
          />
        </div>

        {/* Copy & Highlights */}
        <div className="mt-4 sm:mt-5 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
            ¡Ganate un año de alimento gratis para tu mascota!
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-neutral-700 max-w-lg mx-auto font-medium">
            Registrate en 30 segundos. El premio incluye 12 bolsas mensuales de alimento premium adaptado a la especie y peso de tu compañero.
          </p>

          {/* Trust bullet badges */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-neutral-700">
            <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-neutral-200 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Perros y Gatos</span>
            </div>
            <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-neutral-200 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Entrega mensual a domicilio</span>
            </div>
            <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-neutral-200 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>CABA y GBA</span>
            </div>
          </div>

          {/* Quick Jump CTA for Mobile */}
          <div className="mt-4 lg:hidden">
            <button
              onClick={onScrollToForm}
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-neutral-950 font-black text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>¡Quiero participar!</span>
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
