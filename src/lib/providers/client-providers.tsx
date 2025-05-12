'use client';

import React from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { WebSocketProvider } from './websocket-provider';
import { AuthProvider } from './auth-provider';
import { SettingsProvider } from './settings-provider';
import { PriceProvider } from './price-provider';
import { MarketProvider } from './market-provider';
import { PortfolioProvider } from './portfolio-provider';
import { NFTProvider } from './nft-provider';
import { ContractProvider } from './contract-provider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebSocketProvider>
        <AuthProvider>
          <SettingsProvider>
            <PriceProvider>
              <MarketProvider>
                <PortfolioProvider>
                  <NFTProvider>
                    <ContractProvider>
                      {children}
                    </ContractProvider>
                  </NFTProvider>
                </PortfolioProvider>
              </MarketProvider>
            </PriceProvider>
          </SettingsProvider>
        </AuthProvider>
      </WebSocketProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />}
    </>
  );
} 