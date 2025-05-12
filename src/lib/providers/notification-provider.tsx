"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { NotificationService, Notification, NotificationCategory, NotificationPriority } from '../services/notification-service';
import { useWebSocket } from './websocket-provider';
import { useToast } from '@/components/ui/use-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearNotifications: (category?: NotificationCategory) => void;
  getNotificationsByCategory: (category: NotificationCategory) => Notification[];
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { connectionState, subscribe, unsubscribe, isConnected } = useWebSocket();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationService, setNotificationService] = useState<NotificationService | null>(null);
  const [providerState, setProviderState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeService = () => {
      if (!isConnected || !mounted) return;

      try {
        const service = NotificationService.getInstance({
          connectionState,
          subscribe,
          unsubscribe,
          isConnected
        });
        setNotificationService(service);
        setProviderState('connected');

        // Handle delivered notifications
        const onDelivered = (notification: Notification) => {
          if (!mounted) return;
          setNotifications(prev => [notification, ...prev]);
          
          if (notification.priority === NotificationPriority.HIGH) {
            toast({
              title: notification.title,
              description: notification.body,
              variant: "default",
            });
          }
        };

        // Handle read status changes
        const onRead = (notification: Notification) => {
          if (!mounted) return;
          setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
          );
        };

        // Handle cleared notifications
        const onCleared = ({ category }: { category?: NotificationCategory }) => {
          if (!mounted) return;
          setNotifications(prev => 
            category 
              ? prev.filter(n => n.category !== category)
              : []
          );
        };

        // Handle errors
        const onError = (error: any) => {
          console.error('Notification error:', error);
          setProviderState('error');
          toast({
            title: "Notification Error",
            description: "Failed to deliver notification. Retrying...",
            variant: "destructive",
          });
        };

        // Handle connection state changes
        const onConnectionStateChange = (state: string) => {
          if (!mounted) return;
          setProviderState(state as any);
        };

        // Register event listeners
        service.on('delivered', onDelivered);
        service.on('read', onRead);
        service.on('cleared', onCleared);
        service.on('error', onError);
        service.on('connectionStateChange', onConnectionStateChange);

        // Store cleanup function
        cleanupRef.current = () => {
          service.removeListener('delivered', onDelivered);
          service.removeListener('read', onRead);
          service.removeListener('cleared', onCleared);
          service.removeListener('error', onError);
          service.removeListener('connectionStateChange', onConnectionStateChange);
          service.emit('destroy');
        };

      } catch (error) {
        console.error('Failed to initialize notification service:', error);
        setProviderState('error');
        toast({
          title: "Initialization Error",
          description: "Failed to initialize notification service",
          variant: "destructive",
        });
      }
    };

    // Initialize service when connected
    if (isConnected) {
      setProviderState('connecting');
      initializeService();
    } else {
      setProviderState('disconnected');
    }

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [isConnected, connectionState, subscribe, unsubscribe, toast]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    notificationService?.markAsRead(id);
  };

  const clearNotifications = (category?: NotificationCategory) => {
    notificationService?.clearNotifications(category);
  };

  const getNotificationsByCategory = (category: NotificationCategory): Notification[] => {
    return notificationService?.getNotificationsByCategory(category) || [];
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        clearNotifications,
        getNotificationsByCategory,
        connectionState: providerState
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 