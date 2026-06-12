import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/portfolio.functions";
import { Logo } from "@/components/site-layout";
import { toast } from "sonner";

const NAV = [
  { to: "/admin", label: "Tableau de bord" },
  { to: "/admin/realisations", label: "Réalisations" },
  { to: "/admin/messages", label: "Messages" },
  { to: "/admin/profil", label: "Profil" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const fetchIsAdmin = useServerFn(checkIsAdmin);
  const { data, isLoading } = useQuery({ queryKey: ["is-admin"], queryFn: () => fetchIsAdmin() });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoading && data && !data.isAdmin) {
      toast.error("Accès réservé à l'administrateur.");
      navigate({ to: "/" });
    }
  }, [data, isLoading, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading || !data?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy text-muted-foreground text-sm">
        Vérification…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-navy text-offwhite">
      <aside className="md:w-64 md:min-h-screen md:border-r hairline md:border-y-0 md:border-l-0 p-6 md:p-8">
        <Link to="/" className="block mb-10">
          <Logo className="text-2xl" />
          <p className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground mt-1">Admin</p>
        </Link>
        <nav className="flex md:flex-col gap-2 md:gap-1 flex-wrap">
          {NAV.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`block px-4 py-3 text-[11px] uppercase tracking-[0.25em] transition-colors ${
                  active ? "bg-gold text-navy" : "text-muted-foreground hover:text-gold"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={signOut}
          className="mt-10 hairline w-full px-4 py-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-gold hover:border-gold transition-colors"
        >
          Déconnexion
        </button>
      </aside>
      <main className="flex-1 p-6 md:p-12">{children}</main>
    </div>
  );
}

export function AdminPageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-10 flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 className="font-display italic text-3xl md:text-4xl text-gold">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground font-light">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
