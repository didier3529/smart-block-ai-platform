"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  size?: 'default' | 'small' | 'large'
}

export function Container({
  children,
  className,
  size = 'default',
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full container-padding',
        {
          'max-w-[var(--container-default)]': size === 'default',
          'max-w-[var(--container-small)]': size === 'small',
          'max-w-[var(--container-large)]': size === 'large',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 