import { cn } from "@/lib/utils"

interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children, className, ...props }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "skip-link sr-only-focusable",
        "absolute top-4 left-4 z-50",
        "bg-primary text-primary-foreground",
        "px-4 py-2 rounded-md font-medium text-sm",
        "focus:not-sr-only focus:relative focus:top-0 focus:left-0",
        "transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}

export default SkipLink;