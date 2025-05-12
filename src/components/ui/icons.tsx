import React from 'react';

export const Icons = {
  plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  download: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 4v12m0 0l-4-4m4 4l4-4m-8 8h8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  portfolio: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth={2}/><path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  trendingUp: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  trendingDown: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M21 7l-6 6-4-4-8 8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  nft: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth={2}/><text x="12" y="16" textAnchor="middle" fontSize="8" fill="currentColor">NFT</text></svg>
  ),
  arrowUp: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  arrowDown: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  arrowRight: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  filter: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M4 4h16M6 8h12M8 12h8M10 16h4" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>
  ),
  externalLink: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth={2}/><path d="M15 3h6v6" stroke="currentColor" strokeWidth={2}/><path d="M10 14L21 3" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  alertTriangle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth={2}/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth={2}/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  pieChart: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M21 12A9 9 0 1 1 12 3v9z" stroke="currentColor" strokeWidth={2}/><path d="M12 3a9 9 0 0 1 9 9h-9z" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  activity: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" fill="none" {...props}><circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth={4}/><text x="24" y="30" textAnchor="middle" fontSize="16" fill="currentColor">CO</text></svg>
  ),
  spinner: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={4} opacity="0.75"/></svg>
  ),
  sun: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={2}/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  moon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  user: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={2}/><path d="M4 20c0-4 8-4 8-4s8 0 8 4" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  logout: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth={2}/><path d="M4 4v16h8" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  dashboard: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth={2}/><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth={2}/><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth={2}/><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  chart: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><rect x="3" y="12" width="4" height="8" stroke="currentColor" strokeWidth={2}/><rect x="10" y="8" width="4" height="12" stroke="currentColor" strokeWidth={2}/><rect x="17" y="4" width="4" height="16" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  contract: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth={2}/><path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  settings: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2}/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  arrowUpDown: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M8 9l4-4 4 4M16 15l-4 4-4-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  refresh: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M4 4v6h6" stroke="currentColor" strokeWidth={2}/><path d="M20 20v-6h-6" stroke="currentColor" strokeWidth={2}/><path d="M4 20a9 9 0 0 1 16-8.485M20 4a9 9 0 0 0-16 8.485" stroke="currentColor" strokeWidth={2}/></svg>
  ),
  ethereum: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><polygon points="12,2 22,12 12,22 2,12" stroke="currentColor" strokeWidth={2} fill="none"/><polygon points="12,2 12,12 22,12" stroke="currentColor" strokeWidth={2} fill="currentColor" opacity="0.2"/></svg>
  ),
  polygon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><polygon points="12,2 22,7 22,17 12,22 2,17 2,7" stroke="currentColor" strokeWidth={2} fill="currentColor" opacity="0.2"/></svg>
  ),
  binance: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth={2} fill="currentColor" opacity="0.2"/></svg>
  ),
  arbitrum: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><ellipse cx="12" cy="12" rx="10" ry="6" stroke="currentColor" strokeWidth={2} fill="currentColor" opacity="0.2"/></svg>
  ),
  optimism: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><rect x="4" y="8" width="16" height="8" rx="4" stroke="currentColor" strokeWidth={2} fill="currentColor" opacity="0.2"/></svg>
  ),
  shield: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 2l7 4v5c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V6l7-4z" stroke="currentColor" strokeWidth={2} strokeLinejoin="round"/></svg>
  ),
  alertCircle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2}/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/></svg>
  ),
};

export const Star = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}><polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 9 8.5 12 2" stroke="currentColor" strokeWidth={2} fill="currentColor"/></svg>
); 