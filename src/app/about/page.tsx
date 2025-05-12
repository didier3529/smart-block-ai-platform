import React from 'react';

export default function AboutPage() {
  return (
    <div className="bg-black text-white min-h-screen pt-24">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-center">About ChainOracle</h1>
        
        <div className="max-w-3xl mx-auto">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">Our Mission</h2>
            <p className="text-gray-300 mb-4">
              ChainOracle is dedicated to democratizing access to advanced blockchain analytics through
              cutting-edge AI technology. We aim to empower investors, developers, and enthusiasts with
              the insights they need to make informed decisions in the rapidly evolving world of blockchain.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">Our Technology</h2>
            <p className="text-gray-300 mb-4">
              By combining advanced machine learning algorithms with real-time blockchain data, ChainOracle
              provides unprecedented insights into market trends, smart contract vulnerabilities, and portfolio
              optimization strategies. Our AI agents continuously analyze vast amounts of on-chain and off-chain
              data to deliver actionable intelligence.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">Our Team</h2>
            <p className="text-gray-300 mb-4">
              ChainOracle was founded by a team of blockchain developers, data scientists, and financial
              analysts passionate about bringing transparency and intelligence to the blockchain ecosystem.
              With decades of combined experience in artificial intelligence and distributed systems, our
              team is uniquely positioned to bridge the gap between complex blockchain data and actionable insights.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
} 