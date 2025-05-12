import React, { useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { WebSocketContext, WebSocketConfig, ConnectionState, HealthStatus, SecurityStatus, Message } from './websocket-context';
import { ConnectionPool } from './websocket-connection-pool';
import { MessageBatcher } from './websocket-performance';
import { SecurityManager } from './websocket-security';
import { v4 as uuidv4 } from 'uuid';

interface WebSocketProviderProps {
  config: WebSocketConfig;
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ config, children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('unknown');
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>('unauthenticated');
  
  const connectionPool = useRef(new ConnectionPool(config.options));
  const messageBatcher = useRef(new MessageBatcher());
  const securityManager = useRef(new SecurityManager(config.options.security));
  
  const handleConnect = async (token: string) => {
    try {
      // Authenticate first
      const isAuthenticated = await securityManager.current.authenticateConnection(socket!, token);
      if (!isAuthenticated) {
        setSecurityStatus('blocked');
        return;
      }

      setConnectionState('connecting');
      
      const newSocket = await connectionPool.current.acquire();
      if (newSocket) {
        setupSocket(newSocket, token);
        setSocket(newSocket);
        messageBatcher.current.setSocket(newSocket);
      } else {
        // Create new socket if pool is empty
        const socket = io(config.url, {
          ...config.options,
          auth: { token }
        });
        setupSocket(socket, token);
        setSocket(socket);
        messageBatcher.current.setSocket(socket);
        connectionPool.current.add(socket);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionState('error');
      setSecurityStatus('unauthenticated');
    }
  };

  const setupSocket = (socket: Socket, token: string) => {
    socket.on('connect', () => {
      const clientId = socket.id;
      const ip = socket.handshake?.address || 'unknown';

      if (securityManager.current.canConnect(clientId, ip)) {
        setConnectionState('connected');
        setSecurityStatus('authenticated');
      } else {
        socket.disconnect();
        setConnectionState('disconnected');
        setSecurityStatus('blocked');
      }
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
      setSecurityStatus('unauthenticated');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionState('error');
    });

    // Set up health check response
    socket.on('health_check', () => {
      socket.emit('health_response', { status: 'healthy' });
    });

    // Handle security events
    socket.on('security_violation', () => {
      setSecurityStatus('blocked');
      socket.disconnect();
    });
  };

  const handleDisconnect = () => {
    if (socket) {
      connectionPool.current.release(socket);
      setSocket(null);
      setConnectionState('disconnected');
      setSecurityStatus('unauthenticated');
    }
  };

  const handleSubscribe = (event: string, handler: (data: any) => void) => {
    if (!socket) return;

    const clientId = socket.id;
    const ip = socket.handshake?.address || 'unknown';

    if (securityManager.current.canSendMessage(clientId, ip)) {
      socket.on(event, handler);
    }
  };

  const handleUnsubscribe = (event: string) => {
    if (socket) {
      socket.off(event);
    }
  };

  const handleEmit = async (event: string, data: any, priority: 'high' | 'normal' | 'low' = 'normal') => {
    if (!socket) return;

    const clientId = socket.id;
    const ip = socket.handshake?.address || 'unknown';

    if (securityManager.current.canSendMessage(clientId, ip)) {
      const message: Message = {
        id: uuidv4(),
        event,
        data,
        timestamp: Date.now(),
        priority,
        security: {
          clientId,
          ip
        }
      };

      messageBatcher.current.add(message);
    }
  };

  const handleEmitWithAck = async <T,>(event: string, data: any, timeout: number = 5000): Promise<T> => {
    if (!socket) throw new Error('Not connected');

    const clientId = socket.id;
    const ip = socket.handshake?.address || 'unknown';

    if (!securityManager.current.canSendMessage(clientId, ip)) {
      throw new Error('Rate limit exceeded');
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Acknowledgment timeout'));
      }, timeout);

      socket.emit(event, data, (response: T) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  };

  const handleAuthenticate = async (token: string): Promise<boolean> => {
    if (!socket) return false;
    const isAuthenticated = await securityManager.current.authenticateConnection(socket, token);
    setSecurityStatus(isAuthenticated ? 'authenticated' : 'blocked');
    return isAuthenticated;
  };

  const handleDeauthenticate = () => {
    if (socket) {
      const token = socket.auth?.token;
      if (token) {
        securityManager.current.blacklistToken(token as string);
      }
      handleDisconnect();
    }
  };

  useEffect(() => {
    return () => {
      handleDisconnect();
      messageBatcher.current.clear();
      securityManager.current.destroy();
    };
  }, []);

  const contextValue = {
    socket,
    connectionState,
    healthStatus,
    securityStatus,
    metrics: {
      pool: connectionPool.current.getMetrics(),
      security: securityManager.current.getMetrics()
    },
    connect: handleConnect,
    disconnect: handleDisconnect,
    subscribe: handleSubscribe,
    unsubscribe: handleUnsubscribe,
    emit: handleEmit,
    emitWithAck: handleEmitWithAck,
    authenticate: handleAuthenticate,
    deauthenticate: handleDeauthenticate
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}; 