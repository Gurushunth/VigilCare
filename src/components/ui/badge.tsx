import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-soft text-primary-ink",
        outline: "border-line-strong bg-surface text-muted",
        live: "border-primary/30 bg-primary-soft text-primary-ink",
        roadmap: "border-line-strong bg-page text-muted",
        safe: "border-safe-line bg-safe-soft text-safe",
        warn: "border-warn-line bg-warn-soft text-warn",
        danger: "border-danger-line bg-danger-soft text-danger",
        ink: "border-transparent bg-ink text-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
