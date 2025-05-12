/**
 * MockWebSocket - A development-only WebSocket implementation for testing
 * This class simulates WebSocket behavior without making actual connections
 */

export class MockWebSocket implements WebSocket {
  public static CONNECTING = 0;
  public static OPEN = 1;
  public static CLOSING = 2;
  public static CLOSED = 3;

  public binaryType: BinaryType = 'blob';
  public bufferedAmount: number = 0;
  public extensions: string = '';
  public protocol: string = '';
  public readyState: number = MockWebSocket.CONNECTING;
  public url: string;

  // Event handlers
  public onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  public onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  public onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  public onopen: ((this: WebSocket, ev: Event) => any) | null = null;

  private eventListeners: Record<string, Function[]> = {
    'open': [],
    'message': [],
    'close': [],
    'error': []
  };

  private autoConnectTimer: NodeJS.Timeout | null = null;
  private mockPriceData = {
    'BTC': { price: 63452.75, percent_change_24h: 2.35, volume_24h: 45298761234, market_cap: 1258974569871 },
    'ETH': { price: 3245.18, percent_change_24h: 1.86, volume_24h: 25163897456, market_cap: 378965412587 },
    'SOL': { price: 142.23, percent_change_24h: 5.42, volume_24h: 12587496325, market_cap: 54789632541 },
    'DOGE': { price: 0.156, percent_change_24h: -1.25, volume_24h: 8745693214, market_cap: 21456987523 }
  };
  
  private subscribedSymbols: Set<string> = new Set();

  constructor(url: string, protocols?: string | string[]) {
    console.log('[MockWebSocket] Creating mock connection to:', url);
    this.url = url;
    
    // Simulate connection process
    this.autoConnectTimer = setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      
      // Create synthetic open event
      const openEvent = new Event('open');
      if (this.onopen) this.onopen.call(this, openEvent);
      this.dispatchEvent(openEvent);
      
      // Start sending mock data periodically
      this.startSendingMockData();
    }, 500);
  }

  private startSendingMockData(): void {
    // Send mock data every 10 seconds for subscribed symbols
    setInterval(() => {
      if (this.readyState === MockWebSocket.OPEN) {
        this.subscribedSymbols.forEach(symbol => {
          if (this.mockPriceData[symbol]) {
            // Add small random change to price
            const priceChange = (Math.random() - 0.5) * 2 * (this.mockPriceData[symbol].price * 0.005);
            this.mockPriceData[symbol].price += priceChange;
            
            // Update percent change
            this.mockPriceData[symbol].percent_change_24h += (Math.random() - 0.5) * 0.2;
            
            const mockData = {
              symbol,
              price: this.mockPriceData[symbol].price,
              percent_change_24h: this.mockPriceData[symbol].percent_change_24h,
              volume_24h: this.mockPriceData[symbol].volume_24h,
              market_cap: this.mockPriceData[symbol].market_cap
            };
            
            // Send mock message
            const messageEvent = new MessageEvent('message', {
              data: JSON.stringify(mockData)
            });
            
            if (this.onmessage) this.onmessage.call(this, messageEvent);
            this.dispatchEvent(messageEvent);
          }
        });
      }
    }, 10000);
  }

  // WebSocket API methods
  public close(code?: number, reason?: string): void {
    console.log('[MockWebSocket] Closing connection', code, reason);
    this.readyState = MockWebSocket.CLOSING;
    
    // Clear any pending timers
    if (this.autoConnectTimer) {
      clearTimeout(this.autoConnectTimer);
      this.autoConnectTimer = null;
    }
    
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      const closeEvent = new CloseEvent('close', {
        code: code || 1000,
        reason: reason || 'Normal closure',
        wasClean: true
      });
      
      if (this.onclose) this.onclose.call(this, closeEvent);
      this.dispatchEvent(closeEvent);
    }, 100);
  }

  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      console.warn('[MockWebSocket] Cannot send data - connection not open');
      return;
    }
    
    console.log('[MockWebSocket] Sending data:', data);
    
    try {
      // Process subscription messages
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        
        if (parsed.action === 'subscribe' && parsed.symbol) {
          console.log('[MockWebSocket] Subscribing to symbol:', parsed.symbol);
          this.subscribedSymbols.add(parsed.symbol);
          
          // Send immediate mock data for new subscription
          if (this.mockPriceData[parsed.symbol]) {
            setTimeout(() => {
              const mockData = {
                symbol: parsed.symbol,
                ...this.mockPriceData[parsed.symbol]
              };
              
              const messageEvent = new MessageEvent('message', {
                data: JSON.stringify(mockData)
              });
              
              if (this.onmessage) this.onmessage.call(this, messageEvent);
              this.dispatchEvent(messageEvent);
            }, 500);
          }
        }
        
        if (parsed.action === 'unsubscribe' && parsed.symbol) {
          console.log('[MockWebSocket] Unsubscribing from symbol:', parsed.symbol);
          this.subscribedSymbols.delete(parsed.symbol);
        }
      }
    } catch (error) {
      console.error('[MockWebSocket] Error processing message:', error);
    }
  }

  // Event handling
  public addEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  public addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
    }
    
    this.eventListeners[type].push(listener as Function);
  }

  public removeEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
  public removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
    if (!this.eventListeners[type]) return;
    
    this.eventListeners[type] = this.eventListeners[type].filter(
      l => l !== listener
    );
  }

  public dispatchEvent(event: Event): boolean {
    const listeners = this.eventListeners[event.type] || [];
    listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener.call(this, event);
      } else if (listener && typeof listener.handleEvent === 'function') {
        listener.handleEvent(event);
      }
    });
    return !event.defaultPrevented;
  }
} 