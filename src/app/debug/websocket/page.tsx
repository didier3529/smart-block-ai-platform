"use client";

import React, { useEffect, useState } from 'react';
import { WebSocketStatus } from '@/components/websocket-status';
import { useWebSocket } from '@/lib/providers/websocket-provider';
import { WebSocketConfig } from '@/config/websocket-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { marketDataAdapter } from '@/lib/services/market-data-adapter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Send, Trash } from 'lucide-react';

export default function WebSocketDebugPage() {
  const { isConnected, connectionState, lastError, reconnect } = useWebSocket();
  const [events, setEvents] = useState<Array<{
    type: string;
    timestamp: string;
    data: any;
  }>>([]);
  const [customSymbol, setCustomSymbol] = useState('BTC');
  const [useMockState, setUseMockState] = useState(WebSocketConfig.useMock);
  
  // Subscribe to events for debugging
  useEffect(() => {
    const logEvent = (type: string, data: any) => {
      setEvents(prev => [
        {
          type,
          timestamp: new Date().toISOString(),
          data
        },
        ...prev.slice(0, 99) // Keep last 100 events
      ]);
    };
    
    // Set up event listeners
    marketDataAdapter.on('connected', () => logEvent('connected', { success: true }));
    marketDataAdapter.on('disconnected', (details) => logEvent('disconnected', details));
    marketDataAdapter.on('error', (error) => logEvent('error', error));
    marketDataAdapter.on('priceUpdate', (data) => logEvent('priceUpdate', data));
    
    return () => {
      marketDataAdapter.removeAllListeners();
    };
  }, []);
  
  const handleSubscribe = () => {
    marketDataAdapter.subscribe(customSymbol);
    setEvents(prev => [
      {
        type: 'subscribe',
        timestamp: new Date().toISOString(),
        data: { symbol: customSymbol }
      },
      ...prev
    ]);
  };
  
  const handleUnsubscribe = () => {
    marketDataAdapter.unsubscribe(customSymbol);
    setEvents(prev => [
      {
        type: 'unsubscribe',
        timestamp: new Date().toISOString(),
        data: { symbol: customSymbol }
      },
      ...prev
    ]);
  };
  
  const clearEvents = () => {
    setEvents([]);
  };
  
  const toggleMockMode = () => {
    // This doesn't actually change the global config at runtime
    // It's just for display purposes
    setUseMockState(!useMockState);
    setEvents(prev => [
      {
        type: 'config',
        timestamp: new Date().toISOString(),
        data: { useMock: !useMockState }
      },
      ...prev
    ]);
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">WebSocket Debugger</h1>
        <WebSocketStatus showDetail={false} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>Current WebSocket connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-semibold">Status:</div>
                <div className={
                  connectionState === 'connected' ? 'text-green-500' :
                  connectionState === 'connecting' ? 'text-yellow-500' :
                  connectionState === 'error' ? 'text-red-500' :
                  'text-gray-500'
                }>
                  {connectionState}
                </div>
                
                <div className="font-semibold">Connected:</div>
                <div>{isConnected ? 'Yes' : 'No'}</div>
                
                <div className="font-semibold">Mock Mode:</div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={useMockState} 
                    onCheckedChange={toggleMockMode} 
                    id="mock-mode"
                  />
                  <Label htmlFor="mock-mode">{useMockState ? 'Enabled' : 'Disabled'}</Label>
                </div>
                
                <div className="font-semibold">WebSocket URL:</div>
                <div className="text-xs truncate">{WebSocketConfig.url}</div>
              </div>
              
              {lastError && (
                <div className="bg-red-500/10 p-3 rounded border border-red-500/20 text-sm">
                  <div className="font-semibold text-red-500">Last Error:</div>
                  <div className="text-xs overflow-auto max-h-20">
                    {lastError.message || JSON.stringify(lastError)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={reconnect}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Symbol Subscription</CardTitle>
            <CardDescription>Subscribe to crypto symbols</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input 
                  value={customSymbol} 
                  onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())} 
                  placeholder="BTC"
                />
                <Button onClick={handleSubscribe} disabled={!isConnected}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['BTC', 'ETH', 'SOL', 'DOGE', 'XRP'].map(symbol => (
                  <Button 
                    key={symbol}
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setCustomSymbol(symbol);
                      marketDataAdapter.subscribe(symbol);
                      setEvents(prev => [
                        {
                          type: 'subscribe',
                          timestamp: new Date().toISOString(),
                          data: { symbol }
                        },
                        ...prev
                      ]);
                    }}
                    disabled={!isConnected}
                  >
                    {symbol}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleUnsubscribe}
              disabled={!isConnected}
            >
              Unsubscribe
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                WebSocketConfig.defaultSymbols.forEach(s => marketDataAdapter.subscribe(s));
                setEvents(prev => [
                  {
                    type: 'subscribe-all',
                    timestamp: new Date().toISOString(),
                    data: { symbols: WebSocketConfig.defaultSymbols }
                  },
                  ...prev
                ]);
              }}
              disabled={!isConnected}
            >
              Subscribe All
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Current WebSocket configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-[280px]">
              {JSON.stringify(WebSocketConfig, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Event Log</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Event Log</h2>
            <Button variant="outline" size="sm" onClick={clearEvents}>
              <Trash className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
          
          <div className="bg-black/80 text-green-400 font-mono text-xs p-4 rounded max-h-[400px] overflow-auto">
            {events.length === 0 ? (
              <div className="text-gray-400">No events recorded yet...</div>
            ) : (
              events.map((event, idx) => (
                <div key={idx} className="mb-2">
                  <span className="text-blue-300">[{event.timestamp.slice(11, 23)}]</span>{' '}
                  <span className={
                    event.type === 'error' ? 'text-red-400' :
                    event.type === 'connected' ? 'text-green-400' :
                    event.type === 'disconnected' ? 'text-yellow-400' :
                    'text-white'
                  }>
                    {event.type}
                  </span>:{' '}
                  <span className="text-white break-all">{JSON.stringify(event.data)}</span>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="errors">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Error Log</h2>
            <div className="bg-black/80 text-red-400 font-mono text-xs p-4 rounded max-h-[400px] overflow-auto">
              {events.filter(e => e.type === 'error').length === 0 ? (
                <div className="text-gray-400">No errors recorded yet...</div>
              ) : (
                events
                  .filter(e => e.type === 'error')
                  .map((event, idx) => (
                    <div key={idx} className="mb-4 border-b border-gray-700 pb-2">
                      <div>
                        <span className="text-blue-300">[{event.timestamp.slice(11, 23)}]</span>{' '}
                        <span className="text-red-400">ERROR</span>:
                      </div>
                      <pre className="text-white break-all whitespace-pre-wrap ml-4 mt-1">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 