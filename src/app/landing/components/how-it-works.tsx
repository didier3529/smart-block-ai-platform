import React from 'react';

interface Step {
  title: string;
  description: string;
}

interface HowItWorksProps {
  steps: Step[];
}

export function HowItWorks({ steps }: HowItWorksProps) {
  return (
    <section className="py-20">
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number */}
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center
                            text-xl font-bold text-white mb-6">
                {index + 1}
              </div>
              
              {/* Content */}
              <h3 className="text-2xl font-semibold text-white mb-4">
                {step.title}
              </h3>
              <p className="text-white/75 leading-relaxed">
                {step.description}
              </p>
              
              {/* Connector line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-[calc(100%_-_1rem)] w-[calc(100%_-_2rem)] h-px
                              bg-gradient-to-r from-white/20 via-white/40 to-white/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 