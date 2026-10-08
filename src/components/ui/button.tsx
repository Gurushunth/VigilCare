import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-soft hover:bg-primary-hover",
        outline: "border border-line-strong bg-surface text-ink hover:border-primary hover:text-primary-ink",
        ghost: "text-ink hover:bg-primary-soft hover:text-primary-ink",
        soft: "bg-primary-soft text-primary-ink hover:bg-[#cfeaec]",
        danger: "bg-danger text-white shadow-soft hover:bg-[#931c13]",
      },
      size: {
        default: "h-11 px-5 text-[15px] [&_svg]:size-4",
        sm: "h-9 rounded-lg px-3 text-sm [&_svg]:size-4",
        lg: "h-14 px-7 text-base [&_svg]:size-5",
        xl: "min-h-20 px-8 text-xl [&_svg]:size-7",
        icon: "size-11 [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
