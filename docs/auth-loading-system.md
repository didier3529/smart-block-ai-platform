# Authentication and Loading System Documentation

## Overview of Issues and Solutions

### 1. Initial Loading UI Change
We started by modifying the loading spinner UI, which revealed deeper architectural issues:

```tsx
// src/components/ui/loading-screen.tsx
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* Loading UI implementation */}
    </div>
  )
}
```

### 2. LoadingProvider Dependencies
The LoadingProvider was designed to aggregate loading states from multiple sources:

```tsx
// src/lib/providers/loading-provider.tsx
export function LoadingProvider({ children }) {
  const { isLoading: authLoading, canAccess } = useAuthGuard()
  const { isLoading: portfolioLoading } = usePortfolio()
  const { isLoading: marketLoading } = useMarket()
  const { isLoading: contractLoading } = useContract()
  const { isLoading: nftLoading } = useNFT()

  const isLoading = authLoading || portfolioLoading || marketLoading || 
                    contractLoading || nftLoading
  // ...
}
```

### 3. Provider Order Issues
The order of providers is critical for proper functionality:

```tsx
// Current implementation (problematic)
<AuthProvider>
  <LoadingProvider>  // Caused hook ordering issues
    <UnifiedLayout>
      {children}
    </UnifiedLayout>
  </LoadingProvider>
</AuthProvider>

// Correct implementation for future data fetching
<AuthProvider>
  <QueryClientProvider>
    <LoadingProvider>
      <UnifiedLayout>
        {children}
      </UnifiedLayout>
    </LoadingProvider>
  </QueryClientProvider>
</AuthProvider>
```

### 4. Hook Dependencies
Original complex implementation with React Query:

```tsx
// Original implementation with issues
export function useMarket() {
  const { isAuthenticated } = useAuth();
  const { isLoading, data } = useMarketData(); // Used React Query
  
  if (!isAuthenticated) {
    return { isLoading: false, data: null };
  }
  return { isLoading, data };
}
```

Simplified solution:

```tsx
// Simplified implementation
export function useMarket() {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  return { isLoading, data: null }
}
```

## Current Solution

We simplified the implementation by:
1. Removing React Query dependencies
2. Simplifying hook implementations
3. Ensuring consistent hook structure
4. Maintaining basic loading states

## Future Implementation Guide

When implementing data fetching:

1. **Provider Setup**:
   ```tsx
   // src/app/layout.tsx or similar
   export default function RootLayout({ children }) {
     return (
       <AuthProvider>
         <QueryClientProvider client={queryClient}>
           <LoadingProvider>
             {children}
           </LoadingProvider>
         </QueryClientProvider>
       </AuthProvider>
     )
   }
   ```

2. **Hook Implementation**:
   ```tsx
   export function useMarket() {
     const { isAuthenticated } = useAuth()
     const { data, isLoading } = useQuery({
       queryKey: ['market'],
       queryFn: fetchMarketData,
       enabled: isAuthenticated
     })
     
     return { isLoading, data }
   }
   ```

3. **Loading States**:
   - Implement proper loading indicators
   - Handle error states
   - Show appropriate feedback to users

## Best Practices

1. **Provider Order**:
   - AuthProvider should be at the top level
   - Data fetching providers (like QueryClientProvider) should wrap data-dependent components
   - UI-related providers can be nested inside

2. **Hook Rules**:
   - Follow React's rules of hooks
   - Keep hooks at the top level
   - Don't nest hooks conditionally

3. **Loading States**:
   - Centralize loading state management
   - Provide clear loading indicators
   - Handle edge cases (errors, timeouts)

4. **Authentication**:
   - Ensure auth state is available before data fetching
   - Handle unauthenticated states gracefully
   - Protect routes and data appropriately

## Common Issues to Watch For

1. **Hook Ordering**:
   ```tsx
   // Incorrect - hooks called conditionally
   if (condition) {
     useEffect(() => {}, [])
   }

   // Correct - always call hooks
   useEffect(() => {
     if (condition) {
       // do something
     }
   }, [condition])
   ```

2. **Provider Missing**:
   ```tsx
   // Will cause errors - hook used outside provider
   function Component() {
     const { data } = useQuery() // Error: No QueryClient set
   }

   // Correct - ensure provider is present
   function App() {
     return (
       <QueryClientProvider>
         <Component />
       </QueryClientProvider>
     )
   }
   ```

3. **State Management**:
   - Be careful with multiple loading states
   - Consider using a reducer for complex state
   - Keep state updates synchronized

## Debugging Tips

1. Check provider order in component tree
2. Verify hook dependencies
3. Monitor React Query dev tools
4. Use React Dev Tools to inspect component hierarchy
5. Check for hook ordering issues in development 