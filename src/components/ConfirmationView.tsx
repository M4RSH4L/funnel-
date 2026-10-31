import React, { useEffect, useRef, useState } from 'react';
import { CAMPAIGN_CONFIG, ProductItem } from '../config/campaign';
import { buildWhatsAppUrl } from '../utils/phone';
import { trackEvent } from '../utils/analytics';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Gift,
  CheckCircle2,
  MessageCircle,
  Truck,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Calendar,
  Heart,
  Dog,
  Cat,
} from 'lucide-react';
import { ParticipantSuccessData } from './RaffleForm';

interface ConfirmationViewProps {
  participant: ParticipantSuccessData;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const ConfirmationView: React.FC<ConfirmationViewProps> = ({
  participant,
  onOpenTerms,
  onOpenPrivacy,
}) => {
  // Trigger celebratory confetti once on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FACC15', '#DC2626', '#10B981', '#3B82F6'],
      });
    } catch {
      // non-critical
    }

    // Track view of the first purchase offer
    trackEvent('first_purchase_offer_view', {
      petType: participant.petType,
    });
  }, [participant]);

  // WhatsApp click handler for main offer
  const handleOfferWhatsAppClick = () => {
    const message = `¡Hola! Acabo de registrarme en el Gran Sorteo con mi compañero ${participant.petName} (Código: ${participant.id}). Quiero consultar por el beneficio exclusivo de primera compra, el snack de regalo y el envío gratis a ${participant.locality}.`;
    const url = buildWhatsAppUrl(CAMPAIGN_CONFIG.contacts.whatsappNumber, message);

    trackEvent('whatsapp_click', {
      origin: 'first_purchase_benefit_card',
      petType: participant.petType,
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // WhatsApp click handler for specific product in carousel
  const handleProductWhatsAppClick = (product: ProductItem) => {
    const message = `¡Hola! Vi en la promo del sorteo el producto "${product.name} - ${product.presentation}". Me gustaría pedirlo con el beneficio de primera compra para mi mascota ${participant.petName}.`;
    const url = buildWhatsAppUrl(CAMPAIGN_CONFIG.contacts.whatsappNumber, message);

    trackEvent('product_whatsapp_click', {
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      price: product.price,
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Product Carousel state & logic
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Filter products by petType or 'both'
  const relevantProducts = CAMPAIGN_CONFIG.products.filter(
    (p) => p.species === participant.petType || p.species === 'both'
  );

  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.8;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Autoplay carousel gently unless paused by user interaction or visibility change
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused && document.visibilityState === 'visible' && carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 20) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="pb-16 pt-4 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* BLOQUE 1: Confirmación personalizada y Ticket */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-emerald-400 text-center relative overflow-hidden">
          {/* Subtle top celebration ribbon */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-red-500 to-emerald-400" />

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-sm animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-neutral-900 tracking-tight">
            ¡Ya estás participando, {participant.fullName.split(' ')[0]}!
          </h2>

          <p className="mt-2 text-base sm:text-lg text-emerald-800 font-bold">
            ¡{participant.petName} ya está participando por un año de alimento gratis!
          </p>

          <p className="mt-1 text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto">
            Guardamos tu registro en nuestra base oficial. Te contactaremos al WhatsApp{' '}
            <span className="font-bold text-neutral-900">{participant.phoneNormalized}</span> si resultás ganador.
          </p>

          {/* Ticket de Participación Oficial */}
          <div className="mt-6 max-w-md mx-auto bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl p-4 sm:p-5 border border-amber-200 text-left shadow-xs">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3 mb-3">
              <div className="flex items-center gap-2 text-xs font-black text-amber-950 uppercase tracking-wider">
                <Ticket className="w-4 h-4 text-red-600" />
                <span>Comprobante de Sorteo</span>
              </div>
              <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-amber-200 text-neutral-800">
                #{participant.id.slice(0, 10).toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-500 block text-[11px]">Mascota:</span>
                <span className="font-extrabold text-neutral-900 flex items-center gap-1">
                  {participant.petType === 'dog' ? (
                    <Dog className="w-3.5 h-3.5 text-amber-700 inline" />
                  ) : (
                    <Cat className="w-3.5 h-3.5 text-amber-700 inline" />
                  )}
                  {participant.petName}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">Localidad:</span>
                <span className="font-bold text-neutral-800 truncate block">{participant.locality}</span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">Alimento actual:</span>
                <span className="font-bold text-neutral-800 truncate block">{participant.currentFood}</span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[11px]">Fecha del sorteo:</span>
                <span className="font-bold text-neutral-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-red-600 inline" /> {CAMPAIGN_CONFIG.raffle.drawDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: Beneficio Exclusivo de Primera Compra (Rebranding) */}
        <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden bg-gradient-to-br from-[#CE060E] via-[#DA0812] to-[#B8040B] text-white p-5 sm:p-7 md:px-8 md:py-7 shadow-2xl">
          {/* Decorative background paw prints */}
          <svg
            viewBox="0 0 200 200"
            className="absolute -top-6 right-2 w-48 h-48 sm:w-56 sm:h-56 text-white/[0.08] rotate-12 pointer-events-none select-none"
            fill="currentColor"
            aria-hidden="true"
          >
            <ellipse cx="62" cy="52" rx="18" ry="26" transform="rotate(-18 62 52)" />
            <ellipse cx="102" cy="40" rx="18" ry="27" transform="rotate(-4 102 40)" />
            <ellipse cx="142" cy="52" rx="18" ry="26" transform="rotate(14 142 52)" />
            <ellipse cx="172" cy="84" rx="16" ry="23" transform="rotate(28 172 84)" />
            <path d="M58 118c0-24 22-42 48-42s48 18 48 42c0 20-16 34-32 34-9 0-14-4-20-4s-11 4-20 4c-14 0-24-14-24-34z" />
          </svg>

          <svg
            viewBox="0 0 200 200"
            className="absolute -bottom-8 right-6 w-40 h-40 sm:w-44 sm:h-44 text-black/[0.14] -rotate-12 pointer-events-none select-none"
            fill="currentColor"
            aria-hidden="true"
          >
            <ellipse cx="62" cy="52" rx="18" ry="26" transform="rotate(-18 62 52)" />
            <ellipse cx="102" cy="40" rx="18" ry="27" transform="rotate(-4 102 40)" />
            <ellipse cx="142" cy="52" rx="18" ry="26" transform="rotate(14 142 52)" />
            <ellipse cx="172" cy="84" rx="16" ry="23" transform="rotate(28 172 84)" />
            <path d="M58 118c0-24 22-42 48-42s48 18 48 42c0 20-16 34-32 34-9 0-14-4-20-4s-11 4-20 4c-14 0-24-14-24-34z" />
          </svg>

          {/* Decorative hand-drawn yellow heart & sparkles on right */}
          <svg
            viewBox="0 0 60 140"
            className="hidden md:block absolute top-24 right-2.5 w-12 h-28 text-[#FFD100] pointer-events-none select-none z-20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M26 36 C18 22, 6 24, 10 38 C13 48, 25 56, 26 58 C29 54, 43 44, 44 33 C45 22, 32 23, 26 36 Z" />
            <line x1="28" y1="108" x2="40" y2="94" />
            <line x1="30" y1="118" x2="48" y2="113" />
          </svg>

          <div className="relative z-10">
            {/* Top-left White Brand Logo Pill + Headlines */}
            <div className="md:max-w-[58%]">
              <div className="inline-flex items-center justify-center bg-white rounded-2xl px-4 py-1.5 shadow-md mb-3.5">
                <img
                  src={CAMPAIGN_CONFIG.firstPurchaseOffer.logoBadgeUrl}
                  alt={CAMPAIGN_CONFIG.brand.name}
                  className="h-9 sm:h-11 w-auto object-contain select-none"
                />
              </div>

              <h3 className="text-[25px] sm:text-3xl md:text-[34px] lg:text-[36px] font-black tracking-tight leading-[1.08] text-white">
                Tu mascota también puede llevarse un{' '}
                <span className="text-[#FFD100]">premio</span> hoy
              </h3>

              <p className="mt-2.5 sm:mt-3 text-xs sm:text-[15px] text-white/95 font-medium leading-snug">
                Descubrí tu beneficio de primera compra, sumá un{' '}
                <strong className="font-extrabold text-white">snack de regalo</strong> y recibí tu pedido con{' '}
                <strong className="font-extrabold text-white">envío gratis</strong> en las zonas habilitadas.
              </p>
            </div>

            {/* Mobile Pets Hero (shown on small screens tucked behind the top of Beneficio #1) */}
            <div className="md:hidden relative mt-4 -mb-11 flex justify-center z-0 pointer-events-none select-none">
              <img
                src={CAMPAIGN_CONFIG.firstPurchaseOffer.petsHeroUrl}
                alt="Perro y gato felices con su premio LQMTM"
                className="w-64 sm:w-72 h-auto object-contain"
              />
            </div>

            {/* 3 Benefit Cards + Desktop Pets Hero anchored to the cards row */}
            <div className="relative mt-0 md:mt-6">
              {/* Desktop Pets Hero: dog paw rests right on top of Beneficio #3, cat paw hangs on the right */}
              <img
                src={CAMPAIGN_CONFIG.firstPurchaseOffer.petsHeroUrl}
                alt="Perro y gato felices con su premio LQMTM"
                className="hidden md:block absolute top-0 right-4 lg:right-4 w-[335px] lg:w-[370px] h-auto object-contain -translate-y-[79.2%] z-20 pointer-events-none select-none"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-2.5 md:w-[82%] lg:w-[81%] relative">
                {CAMPAIGN_CONFIG.firstPurchaseOffer.benefits.map((benefit, index) => (
                  <React.Fragment key={benefit.id}>
                    <div className="relative bg-[#FAF1EC] rounded-2xl px-3.5 py-2.5 sm:px-3.5 sm:py-3 shadow-md flex items-center gap-3 z-10">
                      {/* Circular Prize Image */}
                      <div className="w-14 h-14 sm:w-[58px] sm:h-[58px] rounded-full overflow-hidden shrink-0 bg-[#D50911] border-2 border-[#D50911]/20 shadow-xs flex items-center justify-center">
                        <img
                          src={benefit.imageUrl}
                          alt={benefit.imageAlt}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Benefit Copy */}
                      <div className="min-w-0 leading-tight">
                        <span className="text-xs sm:text-[13px] font-extrabold text-[#D50911] block">
                          {benefit.label}
                        </span>
                        <span className="text-xl sm:text-[21px] font-black text-[#261013] block leading-none mt-0.5 tracking-tight">
                          {benefit.title}
                        </span>
                        <span className="text-xs sm:text-[13.5px] font-extrabold text-[#261013] block leading-tight mt-0.5">
                          {benefit.subtitle}
                        </span>
                      </div>

                      {/* Desktop '+' connector between cards */}
                      {index < CAMPAIGN_CONFIG.firstPurchaseOffer.benefits.length - 1 && (
                        <span
                          className="hidden md:flex absolute -right-[11px] -bottom-3.5 z-30 text-[#FFD100] font-black text-xl leading-none select-none pointer-events-none drop-shadow-xs"
                          aria-hidden="true"
                        >
                          +
                        </span>
                      )}
                    </div>

                    {/* Mobile '+' connector between stacked cards */}
                    {index < CAMPAIGN_CONFIG.firstPurchaseOffer.benefits.length - 1 && (
                      <div
                        className="md:hidden flex justify-center -my-1.5 text-[#FFD100] font-black text-lg leading-none select-none pointer-events-none"
                        aria-hidden="true"
                      >
                        +
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Glossy Green WhatsApp CTA Button */}
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                onClick={handleOfferWhatsAppClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 py-3 sm:py-3.5 px-5 sm:px-7 rounded-2xl bg-gradient-to-b from-[#2CE54B] via-[#19BD35] to-[#0E9624] hover:brightness-105 active:brightness-95 border border-[#6BF683]/60 text-white font-extrabold text-sm sm:text-lg shadow-[0_6px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_22px_rgba(0,0,0,0.38)] transition-all active:scale-[0.98] cursor-pointer"
              >
                {/* WhatsApp Bubble Icon */}
                <svg
                  viewBox="0 0 32 32"
                  className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 text-white"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M16 4C9.373 4 4 9.208 4 15.633c0 2.48.8 4.78 2.164 6.668L4.75 27.5l5.453-1.39A12.16 12.16 0 0016 27.267c6.627 0 12-5.208 12-11.634C28 9.208 22.627 4 16 4z"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.6 11.2c-.3-.65-.62-.66-.9-.67-.24-.01-.5-.01-.77-.01-.27 0-.7.1-1.07.5-.37.4-1.4 1.37-1.4 3.33 0 1.97 1.43 3.87 1.63 4.14.2.27 2.77 4.43 6.83 6.03 3.38 1.33 4.07 1.07 4.8.99.73-.08 2.37-.97 2.7-1.9.33-.93.33-1.73.23-1.9-.1-.17-.37-.27-.77-.47-.4-.2-2.37-1.17-2.73-1.3-.37-.13-.63-.2-.9.2-.27.4-1.03 1.3-1.27 1.57-.23.27-.47.3-.87.1-.4-.2-1.68-.62-3.2-1.98-1.18-1.05-1.98-2.35-2.22-2.75-.23-.4-.02-.61.18-.81.18-.18.4-.47.6-.7.2-.23.27-.4.4-.67.13-.27.07-.5-.03-.7-.1-.2-.88-2.17-1.23-2.97z"
                    fill="currentColor"
                  />
                </svg>

                <span className="tracking-tight">{CAMPAIGN_CONFIG.firstPurchaseOffer.ctaText}</span>

                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[3] shrink-0" />
              </button>

              {/* Footer note with white info icon */}
              <div className="mt-3 flex items-center gap-2 text-[11px] sm:text-xs text-white/95 font-medium">
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-[#D50911] font-black text-[11px] leading-none shrink-0"
                  aria-hidden="true"
                >
                  i
                </span>
                <p>
                  Respuesta inmediata por asesores de nutrición de LQMTM. {CAMPAIGN_CONFIG.firstPurchaseOffer.validityNote}.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE 3: Carrusel de Productos Favoritos */}
        <div
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-neutral-200"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">
                Catálogo Recomendado
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-neutral-900">
                Los favoritos para llenar su plato
              </h4>
            </div>

            {/* Carousel Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                disabled={!canScrollLeft}
                className="p-2 rounded-full border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Ver productos anteriores"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-700" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                disabled={!canScrollRight}
                className="p-2 rounded-full border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Ver siguientes productos"
              >
                <ChevronRight className="w-5 h-5 text-neutral-700" />
              </button>
            </div>
          </div>

          {/* Touch-scrollable Track */}
          <div
            ref={carouselRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none"
            tabIndex={0}
            role="region"
            aria-label="Carrusel de productos de alimento para mascotas"
          >
            {relevantProducts.map((product) => (
              <div
                key={product.id}
                className="min-w-[270px] sm:min-w-[290px] max-w-[300px] bg-neutral-50 rounded-2xl p-4 border border-neutral-200 flex flex-col justify-between shrink-0 snap-start hover:shadow-md transition-shadow group"
              >
                <div>
                  {/* Badge & Presentation */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {product.badge || product.brand}
                    </span>
                    <span className="text-xs text-neutral-500 font-semibold">{product.presentation}</span>
                  </div>

                  {/* Product Image */}
                  <div className="relative rounded-xl overflow-hidden bg-white border border-neutral-200 mb-3 aspect-4/3 flex items-center justify-center p-2">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  <h5 className="text-sm font-extrabold text-neutral-900 leading-snug line-clamp-2">
                    {product.name}
                  </h5>

                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{product.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200">
                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-black text-neutral-950">
                      ${product.price.toLocaleString('es-AR')}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-neutral-400 line-through">
                        ${product.originalPrice.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>

                  {/* Product CTA */}
                  <button
                    type="button"
                    onClick={() => handleProductWhatsAppClick(product)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Pedir por WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-neutral-400 text-center">
            ← Deslizá horizontalmente para ver más opciones disponibles para tu {participant.petType === 'dog' ? 'perro' : 'gato'} →
          </p>
        </div>
      </div>
    </div>
  );
};
