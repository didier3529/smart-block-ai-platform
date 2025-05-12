"use client";

import React, { useState, useEffect } from 'react';
import { WalletCard } from "@/components/blockchain/WalletCard";
import { TransactionStatus } from "@/components/blockchain/TransactionStatus";
import { GasEstimate } from "@/components/blockchain/GasEstimate";

export function BlockchainExample() {
  const [selectedSpeed, setSelectedSpeed] = useState<string>("standard");
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    // Update timestamp after initial render to prevent hydration mismatch
    setTimestamp(new Date().toLocaleString());
  }, []);

  // Mock data
  const walletData = {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    balance: "1.5 ETH",
    network: "Ethereum",
    ensName: "alice.eth",
  };

  const transactionData = {
    status: "processing" as const,
    hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    confirmations: 6,
    requiredConfirmations: 12,
    timestamp: timestamp, // Use the state value instead of direct Date creation
  };

  const gasData = {
    speeds: [
      {
        label: "slow",
        description: "May take longer but costs less",
        estimatedTime: "5-10 mins",
        gasPrice: "20 Gwei",
        totalFee: "0.005 ETH",
      },
      {
        label: "standard",
        description: "Recommended for most transactions",
        estimatedTime: "2-5 mins",
        gasPrice: "25 Gwei",
        totalFee: "0.00625 ETH",
        recommended: true,
      },
      {
        label: "fast",
        description: "Higher priority transaction",
        estimatedTime: "30 secs - 2 mins",
        gasPrice: "30 Gwei",
        totalFee: "0.0075 ETH",
      },
    ],
    baseFee: "15 Gwei",
    maxFee: "35 Gwei",
    maxPriorityFee: "2 Gwei",
  };

  // Mock handlers
  const handleDisconnect = () => {
    console.log("Disconnect wallet");
  };

  const handleCopyAddress = () => {
    console.log("Copy address to clipboard");
  };

  const handleViewInExplorer = () => {
    console.log("View in block explorer");
  };

  const handleSpeedSelect = (speed: string) => {
    setSelectedSpeed(speed);
    console.log("Selected speed:", speed);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-6">Blockchain Components</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Wallet Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Wallet Information</h3>
          <WalletCard
            {...walletData}
            onDisconnect={handleDisconnect}
            onCopyAddress={handleCopyAddress}
            onViewInExplorer={handleViewInExplorer}
          />
        </div>

        {/* Transaction Status */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Transaction Status</h3>
          <TransactionStatus
            {...transactionData}
            onViewInExplorer={handleViewInExplorer}
          />
        </div>

        {/* Gas Estimate */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Gas Estimate</h3>
          <GasEstimate
            {...gasData}
            selectedSpeed={selectedSpeed}
            onSpeedSelect={handleSpeedSelect}
          />
        </div>
      </div>
    </div>
  );
} 