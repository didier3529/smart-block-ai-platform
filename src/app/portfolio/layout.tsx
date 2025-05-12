import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio - SmartBlockAI',
  description: 'Track and analyze your blockchain portfolio with AI-powered insights.',
}

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 