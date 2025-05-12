"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Container } from './container'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  className?: string
  containerSize?: 'default' | 'small' | 'large'
  containerClassName?: string
  fullWidth?: boolean
  noSpacing?: boolean
}

export function Section({
  children,
  className,
  containerSize = 'default',
  containerClassName,
  fullWidth = false,
  noSpacing = false,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        !noSpacing && 'section-padding section-spacing',
        className
      )}
      {...props}
    >
      {fullWidth ? (
        children
      ) : (
        <Container size={containerSize} className={containerClassName}>
          {children}
        </Container>
      )}
    </section>
  )
} 