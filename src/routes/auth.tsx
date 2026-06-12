import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminExists, claimAdmin } from "@/lib/portfolio.functions";
import { Logo } from "@/components/site-layout";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — dr.yp" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const fetchExists = useServerFn(adminExists);
  const doClaim = useServerFn(claimAdmin);
  const { data: existsData } = useQuery({ queryKey: ["admin-exists"], queryFn: () => fetchExists() });

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin" });
    });
  }, [navigate]);

  // If no admin yet, force signup mode
  useEffect(() => {
    if (existsData && !existsData.exists) setMode("signup");
    if (existsData && existsData.exists) setMode("login");
  }, [existsData]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (existsData?.exists) {
          toast.error("L'inscription est verrouillée.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        // Try to claim admin if signed in immediately (email confirm disabled)
        const { data: s } = await supabase.auth.getSession();
        if (s.session) {
          await doClaim();
          toast.success("Compte administrateur créé.");
          navigate({ to: "/admin" });
        } else {
          toast.success("Compte créé. Vérifiez votre email pour confirmer.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await doClaim().catch(() => {});
        toast.success("Connexion réussie.");
        navigate({ to: "/admin" });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy text-offwhite px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Logo className="text-5xl" />
          <p className="mt-4 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            Espace administrateur
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 hairline p-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold text-center mb-4">
            {mode === "signup" ? "Créer le compte admin" : "Connexion"}
          </p>

          <label className="block">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent hairline px-4 py-3 text-offwhite text-sm focus:border-gold focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Mot de passe</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent hairline px-4 py-3 text-offwhite text-sm focus:border-gold focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full hairline px-6 py-4 text-[11px] uppercase tracking-[0.3em] text-gold hover:bg-gold hover:text-navy transition-all duration-500 disabled:opacity-50"
          >
            {loading ? "…" : mode === "signup" ? "Créer le compte" : "Se connecter"}
          </button>

          {existsData?.exists === false && (
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground text-center">
              Aucun admin — premier compte = vous
            </p>
          )}
          {existsData?.exists && (
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground text-center">
              Inscription verrouillée. Connexion uniquement.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
