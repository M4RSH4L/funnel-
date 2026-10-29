/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { RaffleForm, ParticipantSuccessData } from './components/RaffleForm';
import { ConfirmationView } from './components/ConfirmationView';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { CampaignStatsModal } from './components/CampaignStatsModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { captureAndStoreUtm, trackEvent } from './utils/analytics';
import { initMetaPixel } from './utils/metaPixel';

export default function App() {
  const [funnelState, setFunnelState] = useState<'capture' | 'confirmed'>('capture');
  const [participant, setParticipant] = useState<ParticipantSuccessData | null>(null);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Initial Campaign Setup: Capture UTMs, check consent, track PageView
  useEffect(() => {
    // 1. Capture and persist UTM parameters from URL
    captureAndStoreUtm();

    // 2. Initialize Meta Pixel if consent was previously granted
    initMetaPixel();

    // 3. Track initial landing view event
    trackEvent('landing_view');
  }, []);

  const handleScrollToForm = () => {
    const el = document.getElementById('formulario-sorteo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const input = el.querySelector('input') as HTMLInputElement;
      if (input) input.focus();
    }
  };

  const handleRegistrationSuccess = (data: ParticipantSuccessData) => {
    setParticipant(data);
    setFunnelState('confirmed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/40 text-neutral-900 font-sans selection:bg-amber-300">
      {/* Sticky Top Header */}
      <Header onOpenStats={() => setIsStatsOpen(true)} />

      {/* Main Funnel Body */}
      <main className="flex-1">
        {funnelState === 'capture' ? (
          /* ESTADO A: Landing de Captación */
          <div className="relative pt-4 pb-8 sm:py-8">
            <div className="max-w-6xl mx-auto px-4 lg:grid lg:grid-cols-12 lg:gap-10 items-start">
              {/* Left Column (Desktop): Hero Banner & Value Props */}
              <div className="lg:col-span-6 xl:col-span-6 lg:sticky lg:top-24">
                <HeroBanner onScrollToForm={handleScrollToForm} />
              </div>

              {/* Right Column (Desktop): Direct High-Converting Form */}
              <div className="lg:col-span-6 xl:col-span-6 mt-6 lg:mt-0">
                <RaffleForm
                  onSuccess={handleRegistrationSuccess}
                  onOpenTerms={() => setLegalModalType('terms')}
                  onOpenPrivacy={() => setLegalModalType('privacy')}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ESTADO B: Participación Confirmada y Conversión a Primera Compra */
          participant && (
            <ConfirmationView
              participant={participant}
              onOpenTerms={() => setLegalModalType('terms')}
              onOpenPrivacy={() => setLegalModalType('privacy')}
            />
          )
        )}
      </main>

      {/* Brand Footer */}
      <Footer
        onOpenTerms={() => setLegalModalType('terms')}
        onOpenPrivacy={() => setLegalModalType('privacy')}
      />

      {/* Legal & Terms Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {/* Growth Team Analytics & Performance Modal */}
      <CampaignStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />

      {/* Cookie & Tracking Consent Banner */}
      <CookieConsentBanner
        onOpenPrivacy={() => setLegalModalType('privacy')}
      />
    </div>
  );
}
