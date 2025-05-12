"use client";

import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from 'next/image';

// Mock data types
type Transaction = {
  hash: string;
  from: string;
  to: string;
  value: string;
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
};

type NFT = {
  id: string;
  name: string;
  collection: string;
  image: string;
  owner: string;
  lastPrice: string;
};

// Mock data
const transactions: Transaction[] = [
  {
    hash: '0x1234...5678',
    from: '0xabcd...efgh',
    to: '0xijkl...mnop',
    value: '1.5 ETH',
    status: 'success',
    timestamp: '2024-03-20 10:30:00',
  },
  {
    hash: '0x9876...5432',
    from: '0xqrst...uvwx',
    to: '0xyzab...cdef',
    value: '0.5 ETH',
    status: 'pending',
    timestamp: '2024-03-20 10:29:00',
  },
  // Add more transactions as needed
];

const nfts: NFT[] = [
  {
    id: '1',
    name: 'Crypto Punk #1234',
    collection: 'CryptoPunks',
    image: '/mock-nft-1.jpg',
    owner: '0xabcd...efgh',
    lastPrice: '50 ETH',
  },
  {
    id: '2',
    name: 'Bored Ape #5678',
    collection: 'BAYC',
    image: '/mock-nft-2.jpg',
    owner: '0xijkl...mnop',
    lastPrice: '80 ETH',
  },
  // Add more NFTs as needed
];

export function DataDisplayExample() {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(tx =>
    tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.to.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Transactions Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest blockchain transactions with status and details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.hash}>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">
                            {tx.hash}
                          </TooltipTrigger>
                          <TooltipContent>
                            Click to view transaction details
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>{tx.from}</TableCell>
                    <TableCell>{tx.to}</TableCell>
                    <TableCell>{tx.value}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(tx.status)}>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm">
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </CardFooter>
      </Card>

      {/* NFT Grid */}
      <Card>
        <CardHeader>
          <CardTitle>NFT Collection</CardTitle>
          <CardDescription>
            Browse and manage your NFT collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nfts.map((nft) => (
              <Card key={nft.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <Image 
                    src={nft.image}
                    alt={nft.name}
                    width={500}
                    height={300}
                    className="rounded-lg shadow-lg"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{nft.name}</CardTitle>
                  <CardDescription>{nft.collection}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Owner</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">
                            <span className="text-sm font-medium">
                              {nft.owner}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Click to view owner's profile
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Last Price
                      </span>
                      <span className="text-sm font-medium">{nft.lastPrice}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">View Details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 