/**
 * Centralized commercial & campaign configuration for Lo Que Mastica Tu Mascota (LQMTM).
 * All URLs, copy, numbers, and catalog items are managed here and can be overridden via environment variables.
 */

export interface ProductItem {
  id: string;
  name: string;
  brand: string;
  species: 'dog' | 'cat' | 'both';
  variety: string;
  presentation: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  imageUrl: string;
  description: string;
}

export const CAMPAIGN_CONFIG = {
  brand: {
    name: 'Lo Que Mastica Tu Mascota',
    shortName: 'LQMTM',
    slogan: 'Nutrición premium y amor para tu mascota',
    logoUrl: '/assets/aistudio/marca-comprimida_9_d2a89eb6.png',
    heroBannerUrl: '/assets/aistudio/image_a0f73030.png',
  },
  contacts: {
    whatsappNumber: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_WHATSAPP_NUMBER) || 
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WHATSAPP_NUMBER) || 
      '+5491136458899',
    instagramUrl: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_INSTAGRAM_URL) || 
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_INSTAGRAM_URL) || 
      'https://www.instagram.com/loquemasticatumascota/',
    facebookUrl: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FACEBOOK_URL) || 
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FACEBOOK_URL) || 
      'https://www.facebook.com/loquemasticatumascota/',
    siteUrl: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL) || 
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SITE_URL) || 
      'https://loquemasticatumascota.com.ar',
  },
  raffle: {
    title: '¡Ganate un año de alimento gratis para tu mascota!',
    subtitle: 'Completá tus datos en 30 segundos y participá por 12 meses de nutrición de calidad para tu perro o gato.',
    prize: '1 año de alimento gratis (12 bolsas mensuales acorde al tamaño y especie de tu mascota)',
    drawDate: '31 de Diciembre de 2026',
    termsVersion: '1.0-2026',
  },
  firstPurchaseOffer: {
    title: 'Tu mascota también puede llevarse un premio hoy',
    subtitle: 'Descubrí tu beneficio de primera compra, sumá un snack de regalo y recibí tu pedido con envío gratis en las zonas habilitadas.',
    badge: 'Beneficio Exclusivo Primera Compra',
    discountHighlight: '15% OFF en tu 1er pedido + Snack Dental de Regalo',
    freeShippingNotice: 'Envío Gratis en CABA y corredor norte en compras mayores a $30.000',
    validityNote: 'Válido durante los próximos 7 días para nuevos participantes',
    ctaText: 'Consultar mi beneficio por WhatsApp',
  },
  products: [
    {
      id: 'prod-xitallcan-perro-cordero',
      name: 'Xitallcan Balanced Adulto Skin Care Cordero',
      brand: 'Xitallcan',
      species: 'dog',
      variety: 'Natural Recipe con Antioxidantes Naturales',
      presentation: 'Bolsa 15 Kg',
      price: 52400,
      originalPrice: 59900,
      badge: 'Más Elegido',
      imageUrl: '/assets/aistudio/image_a0f73030.png',
      description: 'Cuidado intensivo de la piel y pelaje. Sin trigo ni soja, con carne de cordero patagónico.',
    },
    {
      id: 'prod-xitallcan-gato-cordero',
      name: 'Xitallcan Balanced Gato Adulto Cordero Patagónico',
      brand: 'Xitallcan',
      species: 'cat',
      variety: 'Skin Care & Urinary Health',
      presentation: 'Bolsa 7.5 Kg',
      price: 34800,
      originalPrice: 39500,
      badge: 'Favorito Felino',
      imageUrl: '/assets/aistudio/image_a0f73030.png',
      description: 'Fórmula equilibrada para el tracto urinario felino con omega 3 y 6 naturales.',
    },
    {
      id: 'prod-xitallcan-cachorro',
      name: 'Xitallcan Balanced Cachorros Razas Medianas y Grandes',
      brand: 'Xitallcan',
      species: 'dog',
      variety: 'Desarrollo Osteoarticular y Cerebral',
      presentation: 'Bolsa 15 Kg',
      price: 55200,
      originalPrice: 62000,
      badge: 'Crecimiento Óptimo',
      imageUrl: '/assets/aistudio/image_a0f73030.png',
      description: 'Con DHA y prebióticos para el fortalecimiento del sistema inmunológico en sus primeros meses.',
    },
    {
      id: 'prod-snack-dental',
      name: 'Dental Care Treats LQMTM Control de Sarro',
      brand: 'LQMTM Care',
      species: 'both',
      variety: 'Snack Funcional Masticable',
      presentation: 'Pack 350g (14 unidades)',
      price: 6500,
      originalPrice: 8200,
      badge: '¡Regalo en tu 1ª compra!',
      imageUrl: '/assets/aistudio/image_a0f73030.png',
      description: 'Previene la placa bacteriana y refresca el aliento mientras tu compañero disfruta masticar.',
    },
    {
      id: 'prod-xitallcan-gato-castrado',
      name: 'Xitallcan Balanced Gato Castrado Control Calórico',
      brand: 'Xitallcan',
      species: 'cat',
      variety: 'Weight & Renal Protection',
      presentation: 'Bolsa 7.5 Kg',
      price: 36900,
      originalPrice: 41900,
      badge: 'Control de Peso',
      imageUrl: '/assets/aistudio/image_a0f73030.png',
      description: 'L-Carnitina y fibras activas para mantener el peso ideal luego de la castración.',
    },
  ] as ProductItem[],
  popularLocalities: [
    'CABA - Palermo',
    'CABA - Belgrano',
    'CABA - Caballito',
    'CABA - Recoleta',
    'CABA - Villa Urquiza',
    'CABA - Almagro',
    'CABA - Núñez',
    'Vicente López (Olivos, Florida)',
    'San Isidro (Martínez, Acassuso)',
    'San Fernando',
    'Tigre (Nordelta, Rincón)',
    'General San Martín',
    'Morón (Haedo, Castelar)',
    'Ramos Mejía (La Matanza)',
    'Avellaneda',
    'Quilmes / Bernal',
    'Lanús',
    'Lomas de Zamora (Banfield, Temperley)',
    'La Plata / City Bell',
    'Pilar',
  ],
  popularFoodBrands: [
    'Xitallcan Balanced',
    'Royal Canin',
    'Purina Pro Plan',
    'Vitalcan Balanced',
    'Eukanuba',
    'Mon Ami',
    'Sieger',
    'Purina Excellent',
    'Purina Dog Chow / Cat Chow',
    'Pedigree / Whiskas',
    'Comida casera / Dieta BARF',
    'Otra marca',
  ],
  legal: {
    termsTitle: 'Bases y Condiciones Oficiales - Gran Sorteo 1 Año de Alimento Gratis',
    termsSummary: [
      'Organizador: Lo Que Mastica Tu Mascota (LQMTM).',
      'Ámbito geográfico: Válido para residentes mayores de 18 años domiciliados en Ciudad Autónoma de Buenos Aires y Gran Buenos Aires (AMBA).',
      'Premio: Doce (12) bolsas de alimento de primera calidad marca Xitallcan Balanced o equivalente, entregadas mensualmente durante 12 meses correlativos según especie, raza y peso de la mascota registrada.',
      'Mecánica: La participación es libre y 100% gratuita, sin obligación de compra alguna.',
      'Sorteo: Se realizará ante escribano público o mediante transmisión en vivo en las redes oficiales de LQMTM al cierre del período de vigencia.',
      'Notificación: El ganador será contactado a través del número de WhatsApp ingresado.',
      'Uso de datos: Los datos serán tratados de conformidad con la Ley 25.326 de Protección de Datos Personales.',
    ],
    privacyPolicySummary: [
      'En Lo Que Mastica Tu Mascota respetamos tu privacidad y la de tu mascota.',
      'Tus datos de contacto se utilizan exclusivamente para validar tu participación en el sorteo y, si diste tu consentimiento voluntario, para acercarte beneficios y ofertas de nutrición por WhatsApp.',
      'Nunca venderemos ni cederemos tus datos a terceros con fines publicitarios ajenos a LQMTM.',
      'Tenés derecho a revocar tu consentimiento, acceder, rectificar o suprimir tus datos en cualquier momento enviándonos un mensaje a nuestro WhatsApp oficial.',
    ],
  },
};
