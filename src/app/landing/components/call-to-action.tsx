import React from 'react';

interface CallToActionProps {
  onGetStarted: () => void;
}

export function CallToAction({ onGetStarted }: CallToActionProps) {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-primary opacity-90" />
      
      {/* Content */}
      <div className="container relative z-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-12 leading-relaxed">
            Join the future of blockchain intelligence with AI-powered insights
            and real-time analytics across multiple chains.
          </p>
          <button
            onClick={onGetStarted}
            className="btn-primary px-8 py-4 text-lg font-medium rounded-lg
                     bg-white text-slate-900 hover:bg-white/90 transition-colors"
          >
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  );
} 