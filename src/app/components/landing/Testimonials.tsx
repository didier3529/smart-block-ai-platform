'use client'

import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star } from 'lucide-react'

interface Testimonial {
  name: string
  role: string
  company: string
  content: string
  avatar: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    name: "Alex Thompson",
    role: "Lead Developer",
    company: "TechCorp",
    content: "ChainOracle's AI agents have transformed how we handle complex blockchain queries. The speed and accuracy are unmatched.",
    avatar: "/placeholder-1.jpg",
    rating: 5
  },
  {
    name: "Sarah Chen",
    role: "Blockchain Architect",
    company: "DeFi Solutions",
    content: "The intelligent orchestration of AI agents makes solving complex problems feel effortless. A game-changer for our development workflow.",
    avatar: "/placeholder-2.jpg",
    rating: 5
  },
  {
    name: "Michael Patel",
    role: "CTO",
    company: "Web3 Innovations",
    content: "We've seen a 10x improvement in our development velocity since implementing ChainOracle. The AI-powered insights are invaluable.",
    avatar: "/placeholder-3.jpg",
    rating: 5
  }
]

export function Testimonials() {
  return (
    <section className="py-24 bg-background/50">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Trusted by Developers
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what developers and teams are saying about their experience with ChainOracle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-lg mb-6 italic text-muted-foreground">
                "{testimonial.content}"
              </blockquote>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
} 