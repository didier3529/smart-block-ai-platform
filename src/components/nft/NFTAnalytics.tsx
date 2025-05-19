import React from 'react';
import { PageLayout } from '../layout/PageLayout';

interface NFTCollection {
  name: string;
  floorPrice: string;
  change: string;
  volume: string;
  items: string;
  owners: string;
}

export const NFTAnalytics: React.FC = () => {
  const collections: NFTCollection[] = [
    {
      name: 'Bored Ape Yacht Club',
      floorPrice: '68.5 ETH',
      change: '+2.3%',
      volume: '1,245 ETH',
      items: '10,000',
      owners: '6,314'
    },
    // ... other collections
  ];

  return (
    <PageLayout title="NFT Analytics" subtitle="Track and analyze NFT collection performance">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[var(--spacing-lg)]">
        <div className="data-card">
          <span className="stat-label">Total Volume</span>
          <span className="stat-value">3,328 ETH</span>
          <span className="text-[var(--text-secondary)] text-sm">+12.5% from last week</span>
        </div>
        <div className="data-card">
          <span className="stat-label">Active Collections</span>
          <span className="stat-value">142</span>
          <span className="text-[var(--text-secondary)] text-sm">+8 new collections</span>
        </div>
        <div className="data-card">
          <span className="stat-label">Unique Traders</span>
          <span className="stat-value">19,847</span>
          <span className="text-[var(--text-secondary)] text-sm">Past 24 hours</span>
        </div>
        <div className="data-card">
          <span className="stat-label">Average Price</span>
          <span className="stat-value">2.4 ETH</span>
          <span className="text-[var(--text-secondary)] text-sm">Floor price average</span>
        </div>
      </div>

      {/* Market Overview Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-[var(--spacing-xl)]">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            NFT Market Overview
          </h2>
          <div className="flex gap-[var(--spacing-sm)]">
            <select className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-[var(--spacing-md)] py-[var(--spacing-sm)] text-[var(--text-secondary)]">
              <option>Last 24h</option>
              <option>Last 7d</option>
              <option>Last 30d</option>
            </select>
          </div>
        </div>
        
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                <th className="text-left py-[var(--spacing-md)] px-[var(--spacing-md)]">Collection</th>
                <th className="text-right py-[var(--spacing-md)] px-[var(--spacing-md)]">Floor Price</th>
                <th className="text-right py-[var(--spacing-md)] px-[var(--spacing-md)]">Change</th>
                <th className="text-right py-[var(--spacing-md)] px-[var(--spacing-md)]">Volume</th>
                <th className="text-right py-[var(--spacing-md)] px-[var(--spacing-md)]">Items</th>
                <th className="text-right py-[var(--spacing-md)] px-[var(--spacing-md)]">Owners</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection, index) => (
                <tr key={index} className="table-row">
                  <td className="py-[var(--spacing-md)] px-[var(--spacing-md)] flex items-center gap-[var(--spacing-md)]">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                      <span className="text-xs">NFT</span>
                    </div>
                    <span className="font-medium">{collection.name}</span>
                  </td>
                  <td className="text-right py-[var(--spacing-md)] px-[var(--spacing-md)] font-medium">{collection.floorPrice}</td>
                  <td className={`text-right py-[var(--spacing-md)] px-[var(--spacing-md)] font-medium ${
                    collection.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {collection.change}
                  </td>
                  <td className="text-right py-[var(--spacing-md)] px-[var(--spacing-md)] font-medium">{collection.volume}</td>
                  <td className="text-right py-[var(--spacing-md)] px-[var(--spacing-md)] text-[var(--text-secondary)]">{collection.items}</td>
                  <td className="text-right py-[var(--spacing-md)] px-[var(--spacing-md)] text-[var(--text-secondary)]">{collection.owners}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
};