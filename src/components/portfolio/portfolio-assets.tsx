import React, { useState } from 'react';
import { Asset } from '@/types/common';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PortfolioAssetsProps {
  tokens: Asset[];
  isLoading?: boolean;
}

type SortField = 'value' | 'name' | 'priceChange24h';
type SortOrder = 'asc' | 'desc';

export function PortfolioAssets({ tokens, isLoading }: PortfolioAssetsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-16 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  const filteredAssets = tokens?.filter((asset) =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedAssets = filteredAssets?.sort((a, b) => {
    const multiplier = sortOrder === 'desc' ? -1 : 1;
    
    switch (sortField) {
      case 'value':
        return (a.value - b.value) * multiplier;
      case 'name':
        return a.name.localeCompare(b.name) * multiplier;
      case 'priceChange24h':
        return (a.priceChange24h - b.priceChange24h) * multiplier;
      default:
        return 0;
    }
  });

  if (!sortedAssets || sortedAssets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No assets found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={sortField}
          onValueChange={(value) => setSortField(value as SortField)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value">Value</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="priceChange24h">24h Change</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortOrder}
          onValueChange={(value) => setSortOrder(value as SortOrder)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {sortedAssets.map((asset, index) => (
          <Card key={asset.id || index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{asset.name}</h3>
                <p className="text-sm text-muted-foreground">{asset.symbol}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${asset.value.toLocaleString()}</p>
                <p className={`text-sm ${asset.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {asset.priceChange24h >= 0 ? '+' : ''}{asset.priceChange24h.toFixed(2)}%
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 