"use client"

import React from 'react';
import { useNotifications } from '@/lib/providers/notification-provider';
import { Notification, NotificationCategory, NotificationPriority } from '@/lib/services/notification-service';
import { Bell, Shield, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface NotificationListProps {
  notifications: Notification[];
}

const getCategoryIcon = (category: NotificationCategory) => {
  switch (category) {
    case NotificationCategory.BLOCKCHAIN:
      return <TrendingUp className="h-5 w-5" />;
    case NotificationCategory.SECURITY:
      return <Shield className="h-5 w-5" />;
    case NotificationCategory.SYSTEM:
      return <Info className="h-5 w-5" />;
    case NotificationCategory.MARKET:
      return <TrendingUp className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getPriorityStyles = (priority: NotificationPriority) => {
  switch (priority) {
    case NotificationPriority.HIGH:
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case NotificationPriority.MEDIUM:
      return 'bg-warning/10 text-warning border-warning/20';
    case NotificationPriority.LOW:
      return 'bg-muted/50 text-muted-foreground border-muted';
    default:
      return 'bg-muted/50 text-muted-foreground border-muted';
  }
};

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export function NotificationList({ notifications }: NotificationListProps) {
  const { markAsRead } = useNotifications();

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  if (notifications.length === 0) {
    return (
      <Card className="p-6 bg-black/30 backdrop-blur-md border-white/10">
        <div className="flex flex-col items-center justify-center text-center">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-white">No notifications</h3>
          <p className="text-sm text-muted-foreground">
            You're all caught up! Check back later for new updates.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={cn(
            'border transition-colors bg-black/30 backdrop-blur-md',
            !notification.read && 'bg-muted/30',
            getPriorityStyles(notification.priority)
          )}
        >
          <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
            <div className="mt-1">
              {getCategoryIcon(notification.category)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base text-white">{notification.title}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {formatTimestamp(notification.timestamp)}
              </CardDescription>
            </div>
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMarkAsRead(notification.id)}
                className="text-muted-foreground hover:text-white"
              >
                Mark as read
              </Button>
            )}
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-white/90">{notification.body}</p>
          </CardContent>
          {notification.data && (
            <CardFooter>
              <pre className="text-xs text-muted-foreground bg-black/20 p-2 rounded-md w-full overflow-x-auto">
                {JSON.stringify(notification.data, null, 2)}
              </pre>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
} 