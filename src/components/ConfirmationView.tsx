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
  Instagram,
  Facebook,
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
    const priceText = typeof product.price === 'number' ? ` ($${product.price.toLocaleString('es-AR')})` : '';
    const message = `¡Hola! Me registré en el sorteo con mi ${participant.petType === 'dog' ? 'perro' : 'gato'} ${participant.petName} y elegí el producto "${product.name} - ${product.presentation}"${priceText}. Quiero pedirlo con mi beneficio de primera compra (10% OFF + Snack de regalo + Envío Gratis).`;
    const url = buildWhatsAppUrl(CAMPAIGN_CONFIG.contacts.whatsappNumber, message);

    trackEvent('product_whatsapp_click', {
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      species: product.species,
      price: product.price,
    });

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Product Carousel state & logic
  const carouselRef = useRef<HTMLDivElement>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Strictly filter products by participant's selected pet species ('dog' or 'cat')
  const relevantProducts = CAMPAIGN_CONFIG.products.filter(
    (p) => p.species === participant.petType
  );

  // Repeat products so the carousel track always overflows on desktop & mobile for continuous auto-scrolling
  const repeatCount = relevantProducts.length > 0 ? Math.max(4, Math.ceil(8 / relevantProducts.length)) : 1;
  const carouselItems = Array.from({ length: repeatCount }, () => relevantProducts).flat();

  //Temporarily pause autoplay on manual user interaction and auto-resume after 4s
  const pauseTemporarily = () => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  const scrollToSlide = (slideIndex: number, behavior: ScrollBehavior = 'smooth') => {
    const container = carouselRef.current;
    if (!container) return;
    const cards = container.querySelectorAll<HTMLElement>('[data-carousel-card]');
    if (!cards.length) return;

    const targetCard = cards[slideIndex];
    if (targetCard) {
      container.scrollTo({
        left: targetCard.offsetLeft - container.offsetLeft,
        behavior,
      });
    }
  };

  const handleManualScroll = () => {
    const container = carouselRef.current;
    if (!container || relevantProducts.length === 0) return;
    const cards = container.querySelectorAll<HTMLElement>('[data-carousel-card]');
    if (!cards.length) return;

    const firstCardWidth = cards[0].offsetWidth + 16; // card width + gap-4 (16px)
    if (firstCardWidth > 0) {
      const approxIndex = Math.round(container.scrollLeft / firstCardWidth);
      setActiveIndex(approxIndex % relevantProducts.length);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    pauseTemporarily();
    const container = carouselRef.current;
    if (!container || relevantProducts.length === 0) return;
    const cards = container.querySelectorAll<HTMLElement>('[data-carousel-card]');
    if (!cards.length) return;

    const stepWidth = cards[0].offsetWidth + 16;
    const currentSlide = Math.round(container.scrollLeft / stepWidth);

    if (direction === 'left') {
      if (currentSlide <= 0) {
        const jumpIndex = relevantProducts.length;
        scrollToSlide(jumpIndex, 'instant' as ScrollBehavior);
        requestAnimationFrame(() => scrollToSlide(jumpIndex - 1, 'smooth'));
      } else {
        scrollToSlide(currentSlide - 1, 'smooth');
      }
    } else {
      const maxSlide = carouselItems.length - 1;
      if (currentSlide >= maxSlide - 2) {
        const normalized = currentSlide % relevantProducts.length;
        scrollToSlide(normalized, 'instant' as ScrollBehavior);
        requestAnimationFrame(() => scrollToSlide(normalized + 1, 'smooth'));
      } else {
        scrollToSlide(currentSlide + 1, 'smooth');
      }
    }
  };

  // Automatic carousel displacement every 2.8 seconds
  useEffect(() => {
    if (relevantProducts.length === 0) return;

    const interval = setInterval(() => {
      if (!isPaused && document.visibilityState === 'visible' && carouselRef.current) {
        const container = carouselRef.current;
        const cards = container.querySelectorAll<HTMLElement>('[data-carousel-card]');
        if (!cards.length) return;

        const stepWidth = cards[0].offsetWidth + 16;
        const currentSlide = Math.round(container.scrollLeft / stepWidth);
        const halfPoint = Math.floor(carouselItems.length / 2);

        if (currentSlide >= halfPoint) {
          // Seamlessly reset to the equivalent slide in the first set before advancing
          const equivalentSlide = currentSlide % relevantProducts.length;
          scrollToSlide(equivalentSlide, 'instant' as ScrollBehavior);
          setTimeout(() => {
            scrollToSlide(equivalentSlide + 1, 'smooth');
          }, 40);
        } else {
          scrollToSlide(currentSlide + 1, 'smooth');
        }
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [isPaused, relevantProducts.length, carouselItems.length]);

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

          {/* Redes Sociales Oficiales en Confirmación */}
          <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="text-xs font-bold text-neutral-600">
              Seguinos en nuestras redes para ver el sorteo en vivo:
            </span>
            <div className="flex items-center gap-2.5">
              <a
                href={CAMPAIGN_CONFIG.contacts.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram</span>
              </a>
              <a
                href={CAMPAIGN_CONFIG.contacts.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <Facebook className="w-4 h-4" />
                <span>Facebook</span>
              </a>
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
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-neutral-200">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-red-600 uppercase tracking-wider mb-1">
                {participant.petType === 'dog' ? (
                  <Dog className="w-4 h-4 text-red-600" />
                ) : (
                  <Cat className="w-4 h-4 text-red-600" />
                )}
                <span>
                  Catálogo Recomendado para {participant.petType === 'dog' ? 'Perros' : 'Gatos'}
                </span>
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-neutral-900">
                Los favoritos para llenar el plato de {participant.petName}
              </h4>
            </div>

            {/* Carousel Navigation Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="p-2.5 rounded-full border border-neutral-300 bg-white hover:bg-amber-50 hover:border-amber-400 active:scale-95 transition-all cursor-pointer shadow-2xs"
                aria-label="Ver producto anterior"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-800" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="p-2.5 rounded-full border border-neutral-300 bg-white hover:bg-amber-50 hover:border-amber-400 active:scale-95 transition-all cursor-pointer shadow-2xs"
                aria-label="Ver siguiente producto"
              >
                <ChevronRight className="w-5 h-5 text-neutral-800" />
              </button>
            </div>
          </div>

          {/* Touch-scrollable & Auto-displacing Track */}
          <div
            ref={carouselRef}
            onScroll={handleManualScroll}
            onTouchStart={pauseTemporarily}
            onMouseDown={pauseTemporarily}
            className="flex gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            tabIndex={0}
            role="region"
            aria-label={`Carrusel de productos de alimento para ${participant.petType === 'dog' ? 'perro' : 'gato'}`}
          >
            {carouselItems.map((product, index) => (
              <div
                key={`${product.id}-${index}`}
                data-carousel-card
                className="w-[260px] sm:w-[280px] bg-neutral-50 rounded-2xl p-4 border border-neutral-200 flex flex-col justify-between shrink-0 snap-start hover:shadow-md hover:border-amber-300 transition-all group"
              >
                <div>
                  {/* Badge & Presentation */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                      {product.badge || product.brand}
                    </span>
                    <span className="text-[11px] text-neutral-600 font-bold truncate">
                      {product.presentation}
                    </span>
                  </div>

                  {/* Product Image (Vertical 792x1024 format with LQMTM footer bar) */}
                  <div className="relative rounded-xl overflow-hidden bg-white border border-neutral-200 mb-3 aspect-[792/1024] flex items-center justify-center shadow-2xs">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  <h5 className="text-sm font-extrabold text-neutral-900 leading-snug line-clamp-2">
                    {product.name}
                  </h5>

                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{product.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200">
                  {typeof product.price === 'number' ? (
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
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 mb-3 text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>10% OFF 1ª Compra + Snack</span>
                    </div>
                  )}

                  {/* Product CTA */}
                  <button
                    type="button"
                    onClick={() => handleProductWhatsAppClick(product)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Pedir por WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Dots + Helper Text */}
          <div className="mt-3 flex flex-col items-center gap-2">
            {relevantProducts.length > 1 && (
              <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Indicador de productos">
                {relevantProducts.map((prod, idx) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => {
                      pauseTemporarily();
                      setActiveIndex(idx);
                      scrollToSlide(idx, 'smooth');
                    }}
                    aria-label={`Ir al producto ${prod.name}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      activeIndex === idx
                        ? 'w-6 bg-red-600'
                        : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                    }`}
                  />
                ))}
              </div>
            )}
            <p className="text-[11px] text-neutral-400 text-center">
              ← Desplazamiento automático · Deslizá para ver las opciones para tu{' '}
              {participant.petType === 'dog' ? 'perro' : 'gato'} →
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
