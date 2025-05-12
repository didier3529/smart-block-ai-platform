import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'white';
  label?: string;
}

const variantStyles = {
  primary: 'border-primary',
  secondary: 'border-secondary',
  white: 'border-white',
};

const sizeStyles = {
  sm: 'h-6 w-6 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ 
    className, 
    size = 'md', 
    variant = 'primary',
    label = 'Loading...',
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        className={cn('flex flex-col items-center justify-center', className)}
        {...props}
      >
        <div
          className={cn(
            'animate-spin rounded-full border-t-2 border-b-2',
            sizeStyles[size],
            variantStyles[variant]
          )}
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner'; 