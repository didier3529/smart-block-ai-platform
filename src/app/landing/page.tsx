"use client";

import React from 'react';
import { HeroSection } from './components/hero-section';
import { FeatureShowcase } from './components/feature-showcase';
import { HowItWorks } from './components/how-it-works';
import { CallToAction } from './components/call-to-action';

const features = [
  {
    title: 'Real-time Analysis',
    description: 'Get instant insights into blockchain transactions and patterns with our advanced AI analysis engine.'
  },
  {
    title: 'Multi-chain Support',
    description: 'Analyze data across multiple blockchain networks seamlessly with unified insights and reporting.'
  },
  {
    title: 'AI-Powered Insights',
    description: 'Advanced AI agents provide deep analysis, predictions, and actionable recommendations.'
  }
];

const steps = [
  {
    title: 'Connect Your Wallet',
    description: 'Securely connect your Web3 wallet to access the full suite of ChainOracle features.'
  },
  {
    title: 'Select Chains',
    description: 'Choose which blockchain networks you want to analyze and monitor in real-time.'
  },
  {
    title: 'Get Insights',
    description: 'Receive AI-powered insights, analytics, and recommendations based on your selected chains.'
  }
];

export default function LandingPage() {
  const handleGetStarted = () => {
    console.log('Get Started clicked');
  };

  const handleLearnMore = () => {
    console.log('Learn More clicked');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-slate-900/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-white font-bold text-2xl">ChainOracle</div>
          <button 
            className="btn-primary px-6 py-2 rounded-lg text-white
                     bg-gradient-primary hover:opacity-90 transition-opacity"
            onClick={() => console.log('Connect wallet clicked')}
          >
            Connect Wallet
          </button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <HeroSection 
          onGetStarted={handleGetStarted}
          onLearnMore={handleLearnMore}
        />

        {/* Features Section */}
        <FeatureShowcase features={features} />

        {/* How It Works Section */}
        <HowItWorks steps={steps} />

        {/* Call to Action Section */}
        <CallToAction onGetStarted={handleGetStarted} />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="container mx-auto px-4 text-center text-white/50">
          © 2024 ChainOracle. All rights reserved.
        </div>
      </footer>
    </div>
  );
} 