'use client'

import Link from 'next/link'
import { Github, Twitter, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const navigation = {
  solutions: [
    { name: 'AI Agents', href: '/agents' },
    { name: 'Blockchain Integration', href: '/blockchain' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'API Access', href: '/api' },
  ],
  support: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Guides', href: '/guides' },
    { name: 'API Reference', href: '/api-reference' },
    { name: 'Status', href: '/status' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
    { name: 'Careers', href: '/careers' },
  ],
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
  social: [
    {
      name: 'GitHub',
      href: 'https://github.com/chainoracle',
      icon: Github,
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/chainoracle',
      icon: Twitter,
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/chainoracle',
      icon: Linkedin,
    },
  ],
}

export function Footer() {
  return (
    <footer className="bg-background border-t" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 xl:py-16">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8">
              <Link href="/" className="flex items-center gap-2">
                <span className="font-bold text-xl">ChainOracle</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs">
                Empowering the future of blockchain with intelligent AI agents. Join us in revolutionizing decentralized technology.
              </p>
              <div className="flex space-x-5">
                {navigation.social.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">{item.name}</span>
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold">Solutions</h3>
                  <ul role="list" className="mt-4 space-y-3">
                    {navigation.solutions.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold">Support</h3>
                  <ul role="list" className="mt-4 space-y-3">
                    {navigation.support.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold">Company</h3>
                  <ul role="list" className="mt-4 space-y-3">
                    {navigation.company.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-10 md:mt-0">
                  <h3 className="text-sm font-semibold">Legal</h3>
                  <ul role="list" className="mt-4 space-y-3">
                    {navigation.legal.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t pt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} ChainOracle. All rights reserved.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Subscribe to our newsletter"
                    className="w-64"
                  />
                  <Button>
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 