import React from 'react';

interface Feature {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface FeatureShowcaseProps {
  features: Feature[];
}

export function FeatureShowcase({ features }: FeatureShowcaseProps) {
  return (
    <section className="py-20 bg-slate-900/50 backdrop-blur-sm">
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          Powerful Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <article 
              key={index}
              className="group p-8 rounded-2xl bg-white/5 hover:bg-white/10 
                       border border-white/10 transition-colors"
            >
              {feature.icon && (
                <div className="mb-4 text-white/90">{feature.icon}</div>
              )}
              <h3 className="text-xl font-semibold text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-white/75 leading-relaxed">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
} 