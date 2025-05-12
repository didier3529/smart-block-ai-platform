# React Query Best Practices

## Query Client Setup

### Configuration
1. Initialize QueryClient with proper defaults:
   ```tsx
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 60 * 1000, // 1 minute
         cacheTime: 5 * 60 * 1000, // 5 minutes
         retry: 3,
         retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
       },
     },
   });
   ```
2. Use singleton pattern:
   ```tsx
   const [queryClient] = React.useState(() => new QueryClient());
   ```
3. Configure proper error handling
4. Set up retry policies

### Provider Setup
1. Wrap application with provider:
   ```tsx
   <QueryClientProvider client={queryClient}>
     <App />
   </QueryClientProvider>
   ```
2. Handle SSR properly:
   ```tsx
   <HydrationBoundary state={dehydratedState}>
     <Component {...pageProps} />
   </HydrationBoundary>
   ```
3. Configure devtools in development
4. Set up error boundaries

## Query Patterns

### Query Keys
1. Use proper key structure:
   ```tsx
   const { data } = useQuery({
     queryKey: ['todos', todoId],
     queryFn: () => fetchTodoById(todoId),
   });
   ```
2. Include dependencies in keys
3. Use consistent naming
4. Handle dynamic keys

### Query Functions
1. Handle errors properly:
   ```tsx
   const queryFn = async ({ queryKey }) => {
     try {
       const [_key, id] = queryKey;
       const response = await fetch(`/api/todos/${id}`);
       if (!response.ok) {
         throw new Error('Network response was not ok');
       }
       return response.json();
     } catch (error) {
       throw new Error(`Error fetching todo: ${error.message}`);
     }
   };
   ```
2. Use proper typing
3. Handle timeouts
4. Implement retries

### Caching Strategy
1. Configure proper stale time:
   ```tsx
   useQuery({
     queryKey: ['todos'],
     queryFn: fetchTodos,
     staleTime: 5 * 60 * 1000, // 5 minutes
   });
   ```
2. Handle cache invalidation
3. Use prefetching
4. Implement optimistic updates

## Performance Optimization

### Render Optimization
1. Use select for data transformation:
   ```tsx
   const selectTodoCount = (data) => data.length;
   
   export const useTodoCount = () => {
     return useTodos(selectTodoCount);
   };
   ```
2. Memoize selectors:
   ```tsx
   const selectTodoById = useCallback(
     (data) => data.find((todo) => todo.id === id),
     [id]
   );
   ```
3. Control re-renders:
   ```tsx
   useQuery({
     queryKey: ['todos'],
     queryFn: fetchTodos,
     notifyOnChangeProps: ['data', 'error'],
   });
   ```
4. Use proper dependencies

### Request Optimization
1. Implement parallel queries:
   ```tsx
   const results = useQueries({
     queries: [
       { queryKey: ['todo', 1], queryFn: () => fetchTodoById(1) },
       { queryKey: ['todo', 2], queryFn: () => fetchTodoById(2) },
     ],
   });
   ```
2. Handle dependent queries:
   ```tsx
   const { data: user } = useQuery({
     queryKey: ['user', email],
     queryFn: getUserByEmail,
   });

   const { data: projects } = useQuery({
     queryKey: ['projects', user?.id],
     queryFn: () => getProjectsByUser(user.id),
     enabled: !!user?.id,
   });
   ```
3. Use prefetching
4. Implement infinite queries

### Cache Management
1. Handle cache updates:
   ```tsx
   queryClient.setQueryData(
     ['todos', id],
     (oldData) =>
       oldData
         ? {
             ...oldData,
             title: 'Updated Title',
           }
         : oldData
   );
   ```
2. Implement cache invalidation
3. Use optimistic updates
4. Handle background updates

## Server-Side Rendering

### Next.js Integration
1. Configure SSR properly:
   ```tsx
   export async function getStaticProps() {
     const queryClient = new QueryClient();

     await queryClient.prefetchQuery({
       queryKey: ['posts'],
       queryFn: getPosts,
     });

     return {
       props: {
         dehydratedState: dehydrate(queryClient),
       },
     };
   }
   ```
2. Handle hydration
3. Implement prefetching
4. Configure cache properly

### App Router Support
1. Use Server Components:
   ```tsx
   async function PostsPage() {
     const queryClient = new QueryClient();

     await queryClient.prefetchQuery({
       queryKey: ['posts'],
       queryFn: getPosts,
     });

     return (
       <HydrationBoundary state={dehydrate(queryClient)}>
         <Posts />
       </HydrationBoundary>
     );
   }
   ```
2. Handle streaming
3. Implement suspense
4. Configure boundaries

## Error Handling

### Error Boundaries
1. Implement error boundaries:
   ```tsx
   function QueryErrorBoundary({ children }) {
     return (
       <ErrorBoundary
         fallback={({ error }) => (
           <div>
             <h2>Something went wrong!</h2>
             <pre>{error.message}</pre>
           </div>
         )}
       >
         {children}
       </ErrorBoundary>
     );
   }
   ```
2. Handle retries
3. Show error states
4. Implement recovery

### Error States
1. Handle loading states:
   ```tsx
   const { data, isLoading, error } = useQuery({
     queryKey: ['todos'],
     queryFn: fetchTodos,
   });

   if (isLoading) return 'Loading...';
   if (error) return 'An error has occurred: ' + error.message;
   ```
2. Show error messages
3. Implement retry logic
4. Handle edge cases

## Development Tools

### Devtools
1. Configure devtools:
   ```tsx
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

   function App() {
     return (
       <QueryClientProvider client={queryClient}>
         <div>App Content</div>
         <ReactQueryDevtools initialIsOpen={false} />
       </QueryClientProvider>
     );
   }
   ```
2. Monitor performance
3. Debug queries
4. Track cache

### Testing
1. Implement proper tests:
   ```tsx
   test('fetches todos', async () => {
     const queryClient = new QueryClient();
     render(
       <QueryClientProvider client={queryClient}>
         <TodoList />
       </QueryClientProvider>
     );
     await waitFor(() => screen.getByText('Todo 1'));
   });
   ```
2. Mock responses
3. Test error states
4. Verify cache behavior 