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

        {/* BLOQUE 2: Beneficio Exclusivo de Primera Compra */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-amber-600 text-white p-6 sm:p-8 shadow-2xl border-4 border-amber-400">
          {/* Background sparkles */}
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Gift className="w-64 h-64" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-neutral-950 text-xs font-black uppercase tracking-wider mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-red-700" />
              <span>{CAMPAIGN_CONFIG.firstPurchaseOffer.badge}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {CAMPAIGN_CONFIG.firstPurchaseOffer.title}
            </h3>

            <p className="mt-3 text-sm sm:text-base text-red-50 font-medium leading-relaxed">
              {CAMPAIGN_CONFIG.firstPurchaseOffer.subtitle}
            </p>

            {/* Highlights Grid */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                <span className="text-xs text-amber-200 font-bold block">Beneficio #1</span>
                <span className="text-sm font-extrabold text-white">15% OFF en 1er Pedido</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                <span className="text-xs text-amber-200 font-bold block">Beneficio #2</span>
                <span className="text-sm font-extrabold text-white">Snack Dental de Regalo</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                <span className="text-xs text-amber-200 font-bold block">Beneficio #3</span>
                <span className="text-sm font-extrabold text-white">Envío Gratis en AMBA</span>
              </div>
            </div>

            {/* WhatsApp CTA Button */}
            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={handleOfferWhatsAppClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 py-4 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-base sm:text-lg shadow-xl shadow-emerald-900/40 hover:shadow-2xl transition-all active:scale-[0.98] cursor-pointer"
              >
                <MessageCircle className="w-6 h-6 fill-current" />
                <span>{CAMPAIGN_CONFIG.firstPurchaseOffer.ctaText}</span>
              </button>
              <p className="mt-2 text-[11px] text-amber-100 font-medium">
                Respuesta inmediata por asesores de nutrición de LQMTM. {CAMPAIGN_CONFIG.firstPurchaseOffer.validityNote}.
              </p>
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
