import React from 'react';
import { TimelineItem } from '@/types/common';

interface TimelineProps {
  items: TimelineItem[];
  title?: string;
  description?: string;
}

export function Timeline({ items, title, description }: TimelineProps) {
  return (
    <div className="rounded-lg border p-6">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="relative flex h-6 w-6 flex-none items-center justify-center">
              <div
                className={`h-2 w-2 rounded-full ${
                  item.status === 'success'
                    ? 'bg-green-500'
                    : item.status === 'warning'
                    ? 'bg-yellow-500'
                    : item.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-muted-foreground'
                }`}
              />
              {items.indexOf(item) !== items.length - 1 && (
                <div className="absolute top-6 bottom-0 left-1/2 -ml-px w-px bg-border" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{item.title}</h4>
                <time className="text-sm text-muted-foreground">{item.timestamp}</time>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 