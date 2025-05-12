'use client'

import { Card, CardContent } from "@/components/ui/card"
import { useInView } from "@/hooks/use-in-view"
import { SectionHeading } from "@/components/ui/section-heading"
import { BorderGlow } from "@/components/ui/border-glow"
import Image from 'next/image'

interface ChainCardProps {
  name: string
  logo: string
  delay: number
  variant: "purple" | "blue" | "teal" | "orange"
}

function ChainCard({ name, logo, delay, variant }: ChainCardProps) {
  const { ref, isInView } = useInView({ threshold: 0.1 })

  return (
    <div ref={ref}>
      <BorderGlow
        glowColor={variant}
        className={`transition-all duration-500 hover:-translate-y-2 hover:shadow-lg ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <Card className="bg-black/40 border-0 relative overflow-hidden">
          {/* Add subtle geometric shape in background */}
          <div className="absolute -right-10 -bottom-10 w-32 h-32 opacity-10 rotate-45 blur-sm">
            <div className={`w-full h-full gradient-${variant}`}></div>
          </div>

          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 mb-4 flex items-center justify-center transition-transform duration-500 hover:scale-110">
              <div className={`w-16 h-16 rounded-md gradient-${variant} flex items-center justify-center p-3`}>
                <Image 
                  src={logo}
                  alt={name}
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
              </div>
            </div>
            <h3 className="text-xl font-medium mt-2">{name}</h3>
          </CardContent>
        </Card>
      </BorderGlow>
    </div>
  )
}

export function MultiChainSection() {
  const { ref: titleRef, isInView: titleInView } = useInView({ threshold: 0.1 })

  const chains = [
    {
      name: "Ethereum",
      logo: "/ethereum-logo.png",
      variant: "purple" as const,
    },
    {
      name: "Polygon",
      logo: "/polygon-logo.png",
      variant: "blue" as const,
    },
    {
      name: "Optimism",
      logo: "/optimism-logo-inspired.png",
      variant: "teal" as const,
    },
    {
      name: "Solana",
      logo: "/solana-logo.png",
      variant: "orange" as const,
    },
  ]

  return (
    <section className="section-padding relative bg-black" id="chains">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-orange-950/5 to-black -z-10" />

      {/* Add geometric shapes in background */}
      <div className="absolute top-20 right-10 w-60 h-60 rotate-12 opacity-5 blur-xl">
        <div className="w-full h-full gradient-orange-pink"></div>
      </div>
      <div className="absolute bottom-20 left-10 w-40 h-40 -rotate-20 opacity-5 blur-xl">
        <div className="w-full h-full gradient-teal-green"></div>
      </div>

      <BorderGlow containerClassName="container mx-auto max-w-7xl" className="container-padding">
        <div ref={titleRef} className={`transition-all duration-1000 ${titleInView ? "opacity-100" : "opacity-0"}`}>
          <SectionHeading
            title="Multi-Chain Support"
            description="Analyze data across multiple blockchains for comprehensive insights"
            gradientText="orange"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {chains.map((chain, index) => (
            <ChainCard key={index} name={chain.name} logo={chain.logo} delay={index * 100} variant={chain.variant} />
          ))}
        </div>
      </BorderGlow>
    </section>
  )
} 