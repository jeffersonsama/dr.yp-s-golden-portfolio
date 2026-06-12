import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

const NAV = [
  { to: "/a-propos", label: "À propos" },
  { to: "/services", label: "Services" },
  { to: "/realisations", label: "Réalisations" },
  { to: "/contact", label: "Contact" },
] as const;

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display italic text-gold ${className}`} style={{ letterSpacing: "0.04em" }}>
      dr.yp
    </span>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-navy text-offwhite">
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#0A2342]/85 hairline border-x-0 border-t-0">
        <nav className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link to="/" onClick={() => setOpen(false)}>
            <Logo className="text-2xl" />
          </Link>
          <ul className="hidden md:flex items-center gap-10 text-[12px] uppercase tracking-[0.25em] text-muted-foreground">
            {NAV.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="hover:text-gold transition-colors duration-300"
                  activeProps={{ className: "text-gold" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            className="md:hidden text-gold text-xs uppercase tracking-[0.25em]"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? "Fermer" : "Menu"}
          </button>
        </nav>
        {open && (
          <ul className="md:hidden border-t hairline border-x-0 border-b-0 bg-[#0A2342]/95 px-6 py-6 space-y-4 text-[13px] uppercase tracking-[0.25em]">
            {NAV.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block text-muted-foreground hover:text-gold"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      <main className="flex-1 pt-16">{children}</main>

      <footer className="border-t hairline border-x-0 border-b-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo className="text-xl" />
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground text-center">
            © 2025 dr.yp — Faradito Fibi Florent
          </p>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <header className="text-center max-w-3xl mx-auto pt-32 pb-16 px-6">
      <p className="text-[11px] uppercase tracking-[0.4em] text-gold mb-5">— {eyebrow}</p>
      <h1 className="font-display italic text-5xl md:text-7xl text-offwhite">{title}</h1>
      <div className="gold-divider w-24 mt-8 mx-auto" />
      {subtitle && <p className="mt-6 text-muted-foreground font-light">{subtitle}</p>}
    </header>
  );
}
