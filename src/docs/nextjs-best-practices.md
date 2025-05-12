# Next.js Best Practices

## App Router Architecture

### Server Components
1. Use Server Components by default:
   - Better performance
   - Smaller client bundle
   - SEO-friendly
   - Direct data access
2. Implement proper data fetching:
   ```tsx
   async function getData() {
     const res = await fetch('https://api.example.com', {
       cache: 'no-store' // or 'force-cache'
     });
     return res.json();
   }

   export default async function Page() {
     const data = await getData();
     return <Component data={data} />;
   }
   ```
3. Handle caching appropriately:
   - `force-cache`: Static data (default)
   - `no-store`: Dynamic data
   - `next: { revalidate: N }`: ISR

### Client Components
1. Mark with 'use client' directive
2. Keep client components lean
3. Use proper hooks:
   ```tsx
   'use client'
   import { useRouter, usePathname, useSearchParams } from 'next/navigation'

   export default function Component() {
     const router = useRouter();
     const pathname = usePathname();
     const searchParams = useSearchParams();
     // ...
   }
   ```

### Layouts
1. Implement nested layouts:
   ```tsx
   // app/layout.tsx
   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode
   }) {
     return (
       <html lang="en">
         <body>{children}</body>
       </html>
     );
   }
   ```
2. Use loading states:
   ```tsx
   // app/loading.tsx
   export default function Loading() {
     return <div>Loading...</div>;
   }
   ```
3. Handle errors:
   ```tsx
   // app/error.tsx
   'use client'
   export default function Error({
     error,
     reset,
   }: {
     error: Error;
     reset: () => void;
   }) {
     return (
       <div>
         <h2>Something went wrong!</h2>
         <button onClick={reset}>Try again</button>
       </div>
     );
   }
   ```

## Performance Optimization

### Data Fetching
1. Use proper caching strategies:
   - Static data
   - Dynamic data
   - Incremental Static Regeneration
2. Implement parallel data fetching
3. Use streaming for large datasets
4. Handle loading states

### Route Optimization
1. Use dynamic imports:
   ```tsx
   const Component = dynamic(() => import('./Component'));
   ```
2. Implement proper routing patterns
3. Use route groups for organization
4. Handle dynamic routes efficiently

### Image Optimization
1. Use Next.js Image component:
   ```tsx
   import Image from 'next/image'

   export default function Component() {
     return (
       <Image
         src="/image.jpg"
         alt="Description"
         width={500}
         height={300}
         priority={true}
       />
     );
   }
   ```
2. Implement proper loading strategies
3. Use appropriate image formats
4. Handle responsive images

## Security

### Headers
1. Use security headers:
   ```typescript
   // next.config.js
   const securityHeaders = [
     {
       key: 'X-DNS-Prefetch-Control',
       value: 'on'
     },
     {
       key: 'Strict-Transport-Security',
       value: 'max-age=63072000; includeSubDomains; preload'
     }
   ];
   ```
2. Implement CORS properly
3. Handle authentication headers
4. Use CSP headers

### Authentication
1. Implement proper auth patterns
2. Use middleware for protection:
   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     const token = request.cookies.get('token');
     if (!token) {
       return NextResponse.redirect(new URL('/login', request.url));
     }
   }
   ```
3. Handle session management
4. Secure API routes

## Development Workflow

### Environment Variables
1. Use proper env files:
   - `.env.local`
   - `.env.development`
   - `.env.production`
2. Type environment variables
3. Handle secrets properly
4. Use runtime configuration

### Testing
1. Implement proper testing:
   - Unit tests
   - Integration tests
   - E2E tests
2. Use testing utilities:
   - Jest
   - React Testing Library
   - Cypress
3. Test Server Components
4. Test Client Components

### Deployment
1. Use proper build configuration:
   ```typescript
   // next.config.js
   module.exports = {
     output: 'standalone',
     experimental: {
       serverActions: true,
     },
   };
   ```
2. Implement CI/CD
3. Handle environment variables
4. Monitor performance

## Monitoring

### Web Vitals
1. Track performance metrics:
   ```tsx
   'use client'
   export function WebVitals() {
     useReportWebVitals((metric) => {
       switch (metric.name) {
         case 'FCP':
           // handle First Contentful Paint
           break;
         case 'LCP':
           // handle Largest Contentful Paint
           break;
       }
     });
   }
   ```
2. Monitor server performance
3. Track client errors
4. Implement logging

### Error Handling
1. Use error boundaries
2. Handle API errors
3. Implement proper logging
4. Monitor performance impact

## SEO

### Metadata
1. Implement proper metadata:
   ```tsx
   export const metadata = {
     title: 'Page Title',
     description: 'Page description',
     openGraph: {
       title: 'Page Title',
       description: 'Page description',
       images: ['/og-image.jpg'],
     },
   };
   ```
2. Handle dynamic metadata
3. Implement social metadata
4. Use proper structured data

### Performance
1. Optimize Core Web Vitals
2. Implement proper caching
3. Handle dynamic content
4. Monitor SEO impact 