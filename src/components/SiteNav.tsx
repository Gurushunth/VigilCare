import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { OnlineChip } from "@/components/OnlineChip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#problem", label: "Problem" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#compare", label: "Why different" },
  { href: "/#architecture", label: "Under the hood" },
  { href: "/#principles", label: "Principles" },
];

/*
 * Plain <a> tags on purpose: full document navigations are served by the
 * service worker when offline, which is more reliable on stage than a soft
 * navigation that needs an RSC fetch.
 */
export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-page/90 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <a href="/" className="shrink-0 rounded-lg" aria-label="VigilCare home">
          <Logo />
        </a>
        <ul className="ml-6 hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-primary-soft hover:text-primary-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <OnlineChip className="hidden sm:inline-flex" />
          <a href="/demo" className={cn(buttonVariants({ size: "sm" }), "h-10 px-4")}>
            Try the demo <ArrowRight aria-hidden />
          </a>
        </div>
      </nav>
    </header>
  );
}
