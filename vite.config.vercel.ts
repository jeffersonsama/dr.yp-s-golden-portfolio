// Configuration Vite alternative pour déployer sur Vercel.
// Utilisée via : `vite build -c vite.config.vercel.ts`
// (le fichier vite.config.ts d'origine reste utilisé par Lovable / Cloudflare).
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      target: "vercel",
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
  ],
});
