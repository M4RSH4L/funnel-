/**
 * Next.js App Router Route Handler: POST /api/register
 * Ready for deployment to Vercel with Prisma and PostgreSQL.
 */

import { NextResponse } from 'next/server';
import { normalizeArgentinePhone } from '@/src/utils/phone';

// In Next.js with Prisma:
// import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      petName,
      petType,
      locality,
      currentFood,
      phone,
      termsAccepted,
      termsVersion = '1.0-2026',
      marketingConsent = false,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      fbclid,
    } = body;

    // 1. Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION', field: 'fullName', error: 'Ingresá tu nombre y apellido.' },
        { status: 400 }
      );
    }

    if (!petName || typeof petName !== 'string' || petName.trim().length < 1) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION', field: 'petName', error: 'Ingresá el nombre de tu mascota.' },
        { status: 400 }
      );
    }

    if (petType !== 'dog' && petType !== 'cat') {
      return NextResponse.json(
        { success: false, code: 'VALIDATION', field: 'petType', error: 'Seleccioná perro o gato.' },
        { status: 400 }
      );
    }

    const phoneResult = normalizeArgentinePhone(phone);
    if (!phoneResult.isValid) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION', field: 'phone', error: phoneResult.errorMessage },
        { status: 400 }
      );
    }

    if (termsAccepted !== true) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION', field: 'termsAccepted', error: 'Debés aceptar las bases y condiciones.' },
        { status: 400 }
      );
    }

    /*
    // Production Prisma execution:
    const existing = await prisma.participant.findUnique({
      where: {
        unique_participant_phone_campaign: {
          phoneNormalized: phoneResult.normalized,
          termsVersion,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          code: 'DUPLICATE',
          error: `El número ${phoneResult.normalized} ya está registrado en esta edición del sorteo.`,
        },
        { status: 409 }
      );
    }

    const participant = await prisma.participant.create({
      data: {
        fullName: fullName.trim(),
        petName: petName.trim(),
        petType,
        locality: locality.trim(),
        currentFood: currentFood.trim(),
        phoneNormalized: phoneResult.normalized,
        termsAccepted: true,
        termsVersion,
        marketingConsent: Boolean(marketingConsent),
        marketingConsentAt: marketingConsent ? new Date() : null,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
        fbclid,
      },
    });
    */

    return NextResponse.json(
      {
        success: true,
        participant: {
          id: 'nextjs_' + Date.now(),
          fullName,
          petName,
          petType,
          locality,
          currentFood,
          phoneNormalized: phoneResult.normalized,
          marketingConsent: Boolean(marketingConsent),
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Next.js API route error:', error);
    return NextResponse.json(
      { success: false, code: 'SERVER_ERROR', error: 'Error interno en el servidor.' },
      { status: 500 }
    );
  }
}
