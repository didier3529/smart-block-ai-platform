import React from 'react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
}

export function HeroSection({ onGetStarted, onLearnMore }: HeroSectionProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-primary opacity-90" />
      
      {/* Content */}
      <div className="container relative z-10 px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          AI-Powered Blockchain Intelligence
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto">
          Unlock insights across multiple blockchains with specialized AI agents
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button 
            onClick={onGetStarted}
            className="btn-primary px-8 py-4 text-lg font-medium rounded-lg 
                     bg-white text-slate-900 hover:bg-white/90 transition-colors"
          >
            Get Started
          </button>
          <button 
            onClick={onLearnMore}
            className="btn-secondary px-8 py-4 text-lg font-medium rounded-lg
                     border-2 border-white text-white hover:bg-white/10 transition-colors"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
} 