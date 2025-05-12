import React from 'react';
import { BarChart3, LineChart, FileCode, Gem, Brain, ShieldCheck } from 'lucide-react';

const features = [
  {
    title: 'Portfolio Analytics',
    description: 'Get comprehensive insights into your crypto portfolio with real-time performance metrics, risk analysis, and diversification recommendations.',
    icon: <BarChart3 className="h-10 w-10 text-purple-500" />,
  },
  {
    title: 'Market Trends',
    description: 'Stay ahead of the market with AI-powered trend detection, sentiment analysis, and predictive market movements.',
    icon: <LineChart className="h-10 w-10 text-blue-500" />,
  },
  {
    title: 'Smart Contract Analysis',
    description: 'Identify vulnerabilities and assess the security of smart contracts before interacting with them.',
    icon: <FileCode className="h-10 w-10 text-teal-500" />,
  },
  {
    title: 'NFT Intelligence',
    description: 'Evaluate NFT collections with advanced metrics, rarity analysis, and market valuation.',
    icon: <Gem className="h-10 w-10 text-pink-500" />,
  },
  {
    title: 'AI Agents',
    description: 'Specialized AI agents work 24/7 to analyze data and provide personalized insights for your specific needs.',
    icon: <Brain className="h-10 w-10 text-indigo-500" />,
  },
  {
    title: 'Security & Privacy',
    description: 'Your data is secured with enterprise-grade encryption and your privacy is always protected.',
    icon: <ShieldCheck className="h-10 w-10 text-green-500" />,
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-black text-white min-h-screen pt-24">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-center">ChainOracle Features</h1>
        
        <div className="max-w-6xl mx-auto">
          <p className="text-xl text-gray-300 text-center mb-12 max-w-3xl mx-auto">
            Explore the powerful features that make ChainOracle the ultimate blockchain intelligence platform.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-gray-900 rounded-lg p-8 shadow-lg border border-gray-800 hover:border-purple-500 transition-all"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 