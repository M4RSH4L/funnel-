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
    subtitle: 'Registrate en 30 segundos. El premio incluye 1 bolsa mensual de alimento premium durante 1 año entero, adaptado a la especie y peso de tu compañero.',
    prize: '1 año de alimento gratis (1 bolsa mensual de alimento premium durante 1 año entero, adaptado a la especie y peso de tu compañero)',
    drawDate: '5 de Diciembre de 2026',
    termsVersion: '2.0-2026',
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
    termsTitle: 'BASES Y CONDICIONES OFICIALES',
    termsSubtitle: 'Gran Sorteo “1 Año de Alimento Gratis”',
    termsVersionLine: 'Lo Que Mastica Tu Mascota — Versión 2.0 / 2026',
    termsSections: [
      {
        title: '1. ORGANIZADOR',
        paragraphs: [
          'El presente sorteo, denominado “1 Año de Alimento Gratis”, es organizado por Lo Que Mastica Tu Mascota (en adelante, “LQMTM”), con domicilio legal en Diagonal 74 2273.',
          'La participación implica la aceptación de las presentes Bases y Condiciones.',
        ],
      },
      {
        title: '2. VIGENCIA Y ALCANCE GEOGRÁFICO',
        paragraphs: [
          'El sorteo tendrá vigencia desde el 1/11/2026 hasta el 5/12/2026, inclusive.',
          'Podrán participar personas mayores de 18 años con domicilio en la Ciudad Autónoma de Buenos Aires o en las localidades del Gran Buenos Aires comprendidas dentro del área de cobertura de entregas de LQMTM',
        ],
      },
      {
        title: '3. REQUISITOS DE PARTICIPACIÓN',
        paragraphs: [
          'La participación será libre, gratuita y sin obligación de compra.',
          'Para participar, los interesados deberán completar el formulario oficial del sorteo con datos personales verídicos y un número de WhatsApp válido.',
          'Se admitirá una (1) participación por persona. Las inscripciones duplicadas, fraudulentas o realizadas mediante identidades falsas podrán ser descalificadas.',
          'No podrán participar empleados del organizador ni sus familiares directos [CONFIRMAR EXCLUSIÓN].',
        ],
      },
      {
        title: '4. DESCRIPCIÓN DEL PREMIO',
        paragraphs: [
          'Se adjudicará un (1) premio consistente en el suministro gratuito de alimento balanceado para perro o gato, equivalente a doce (12) meses de alimentación de una (1) mascota.',
          'El alimento corresponderá a una de las lineas a pactar con el provedor o a un producto de características nutricionales y calidad equivalentes, conforme a lo dispuesto en estas Bases.',
          '*El premio no consiste en doce (12) bolsas de alimento, sino en la cantidad total de alimento necesaria para cubrir doce (12) meses de consumo estimado de la mascota seleccionada.*',
          'La cantidad total de alimento será calculada por LQMTM según la especie, edad, peso, condición corporal y características de la mascota, tomando como referencia las recomendaciones de alimentación del fabricante para el producto seleccionado.',
          'El cálculo se realizará al momento de adjudicar el premio y será comunicado al ganador, indicando el producto, la cantidad total en kilogramos y las presentaciones previstas.',
        ],
      },
      {
        title: '5. MASCOTA BENEFICIARIA',
        paragraphs: [
          'El premio corresponderá exclusivamente a una (1) mascota, perro o gato, designada por el ganador.',
          'En caso de que el participante posea más de una mascota, deberá seleccionar una sola como beneficiaria del premio.',
          'LQMTM podrá solicitar información adicional para determinar correctamente sus necesidades alimentarias.',
          'Una vez confirmada la mascota beneficiaria y calculada la cantidad total de alimento, no podrá sustituirse por otra mascota, salvo circunstancias excepcionales acordadas por escrito entre el ganador y el organizador.',
          'El premio contempla alimentos de mantenimiento disponibles dentro de la línea seleccionada. Los alimentos veterinarios terapéuticos o de prescripción específica no estarán incluidos, salvo que el organizador lo indique expresamente.',
        ],
      },
      {
        title: '6. CÁLCULO DE LA CANTIDAD DE ALIMENTO',
        paragraphs: [
          'La cantidad de alimento se determinará mediante el consumo diario estimado de la mascota multiplicado por 365 días.',
          'El cálculo tomará como referencia la tabla de alimentación del fabricante, considerando las características de la mascota al momento de la adjudicación.',
          'La cantidad resultante se expresará en kilogramos y se entregará mediante las presentaciones comerciales disponibles.',
          'Si las presentaciones no permitieran alcanzar exactamente el peso calculado, se utilizará una combinación que permita cubrir, como mínimo, la cantidad total adjudicada.',
          'Una vez fijada y comunicada la cantidad total del premio, los cambios posteriores de peso, hábitos alimentarios o consumo de la mascota no implicarán un aumento automático de la cantidad adjudicada.',
        ],
      },
      {
        title: '7. MODALIDAD DE ENTREGA',
        paragraphs: [
          'LQMTM determinará las presentaciones comerciales y el cronograma de entregas, en función del volumen total adjudicado, la disponibilidad de productos y las condiciones de conservación del alimento.',
          'El premio podrá entregarse en una única entrega o dividirse en entregas periódicas, sin exceder el plazo de doce (12) meses desde su adjudicación.',
          '*La cantidad de entregas no estará vinculada a la cantidad de meses de alimentación otorgados.*',
          'Todos los productos deberán entregarse cerrados, en su envase original y con fecha de vencimiento adecuada para su utilización prevista.',
          'La entrega del alimento será gratuita dentro de la zona geográfica habilitada para el sorteo.',
        ],
      },
      {
        title: '8. MARCA Y SUSTITUCIONES',
        paragraphs: [
          'La variedad de alimento será definida de acuerdo con la especie y etapa de vida de la mascota beneficiaria.',
          'En caso de falta de disponibilidad o discontinuación del producto originalmente adjudicado, LQMTM podrá sustituirlo por otro de características nutricionales equivalentes o superiores, apto para la mascota, sin costo adicional para el ganador.',
          'La sustitución será previamente informada al ganador y deberá preservar el beneficio nutricional correspondiente al período pendiente.',
        ],
      },
      {
        title: '9. REALIZACIÓN DEL SORTEO',
        paragraphs: [
          'El sorteo se llevará a cabo el día 5/12/2026, mediante un sistema de selección aleatoria entre todas las participaciones válidas.',
          'El procedimiento será documentado y podrá transmitirse en vivo a través de las redes sociales oficiales de LQMTM.',
          'Se seleccionará un (1) ganador titular y un (1) suplente, conforme al orden de extracción.',
          'La probabilidad de resultar ganador dependerá de la cantidad total de participaciones válidas registradas.',
        ],
      },
      {
        title: '10. NOTIFICACIÓN Y ADJUDICACIÓN',
        paragraphs: [
          'El ganador será contactado mediante el número de WhatsApp informado en el formulario.',
          'Dispondrá de cinco (5) días corridos desde la notificación para responder, acreditar el cumplimiento de los requisitos y proporcionar los datos necesarios para adjudicar el premio.',
          'En caso de no responder dentro del plazo, rechazar el premio o no cumplir las condiciones, se procederá a contactar al primer suplente, y así sucesivamente.',
          'La adjudicación definitiva quedará sujeta a la validación de los requisitos establecidos.',
        ],
      },
      {
        title: '11. CONDICIONES GENERALES DEL PREMIO',
        paragraphs: [
          'El premio será personal, intransferible y no podrá canjearse por dinero en efectivo ni por otros bienes o servicios.',
          'No se permitirá su comercialización por parte del ganador.',
          'En caso de fallecimiento de la mascota beneficiaria, el ganador deberá comunicarlo al organizador. Se suspenderán las entregas pendientes y se evaluará la posibilidad de reasignar el beneficio a otra mascota del mismo hogar, mediante acuerdo escrito, sin aumentar la cantidad originalmente adjudicada.',
        ],
      },
      {
        title: '12. PROTECCIÓN DE DATOS PERSONALES',
        paragraphs: [
          'Los datos personales proporcionados serán tratados por LQMTM conforme a la Ley Nacional N.º 25.326 de Protección de Datos Personales.',
          'Serán utilizados para gestionar la participación, realizar el sorteo, contactar al ganador y entregar el premio.',
          'La recepción de comunicaciones comerciales, promociones y novedades de LQMTM requerirá el consentimiento correspondiente del participante, mediante una opción independiente en el formulario.',
          'Los participantes podrán ejercer sus derechos de acceso, rectificación, actualización y supresión de sus datos mediante [CORREO ELECTRÓNICO O CANAL DE CONTACTO].',
        ],
      },
      {
        title: '13. PUBLICACIÓN DE RESULTADOS',
        paragraphs: [
          'LQMTM podrá comunicar el resultado del sorteo a través de sus redes sociales oficiales, utilizando únicamente los datos necesarios para identificar públicamente al ganador, conforme a los consentimientos y la legislación aplicable.',
        ],
      },
      {
        title: '14. ACEPTACIÓN DE LAS BASES',
        paragraphs: [
          'La participación en el sorteo implica el conocimiento y aceptación de estas Bases y Condiciones.',
          'Cualquier situación no prevista será evaluada por el organizador de buena fe, respetando los derechos de los participantes y la normativa vigente.',
          'Las presentes Bases y Condiciones estarán disponibles para su consulta gratuita durante toda la vigencia de la promoción en',
        ],
      },
    ],
    privacyPolicySummary: [
      'En Lo Que Mastica Tu Mascota respetamos tu privacidad y la de tu mascota.',
      'Tus datos de contacto se utilizan exclusivamente para validar tu participación en el sorteo y, si diste tu consentimiento voluntario, para acercarte beneficios y ofertas de nutrición por WhatsApp.',
      'Nunca venderemos ni cederemos tus datos a terceros con fines publicitarios ajenos a LQMTM.',
      'Tenés derecho a revocar tu consentimiento, acceder, rectificar o suprimir tus datos en cualquier momento enviándonos un mensaje a nuestro WhatsApp oficial.',
    ],
  },
};
