import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tagVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary/80 text-primary-foreground backdrop-blur-sm",
        secondary:
          "bg-secondary/80 text-secondary-foreground backdrop-blur-sm",
        outline: 
          "border border-input bg-background/80 backdrop-blur-sm",
        chain: 
          "bg-primary/80 text-primary-foreground backdrop-blur-sm",
        status: 
          "bg-green-500/80 text-white backdrop-blur-sm",
        warning:
          "bg-yellow-500/80 text-black backdrop-blur-sm",
        danger:
          "bg-red-500/80 text-white backdrop-blur-sm",
      },
      size: {
        default: "h-6 px-2.5 py-0.5 text-xs",
        sm: "h-5 px-2 text-xs",
        lg: "h-7 px-3 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface TagProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagVariants> {}

export function Tag({ className, variant, size, ...props }: TagProps) {
  return (
    <div className={cn(tagVariants({ variant, size }), className)} {...props} />
  );
} 