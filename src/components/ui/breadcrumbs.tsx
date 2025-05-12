import * as React from "react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  href: string;
  label: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  homeHref?: string;
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, items, homeHref = "/", ...props }, ref) => {
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex", className)}
        {...props}
      >
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li>
            <a
              href={homeHref}
              className="flex items-center hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </a>
          </li>
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              <a
                href={item.href}
                className={cn(
                  "hover:text-foreground",
                  index === items.length - 1 && "font-medium text-foreground"
                )}
                aria-current={index === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);
Breadcrumbs.displayName = "Breadcrumbs";

export { Breadcrumbs }; 