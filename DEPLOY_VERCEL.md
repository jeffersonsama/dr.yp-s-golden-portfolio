# Déployer ce projet sur Vercel (en parallèle de Lovable)

Le projet reste déployable via Lovable (runtime Cloudflare Workers). Ce guide ajoute Vercel comme **cible alternative** sans casser Lovable.

## Fichiers ajoutés

- `vite.config.vercel.ts` — configuration Vite qui utilise le preset `target: "vercel"` de TanStack Start (au lieu du plugin Cloudflare).
- `vercel.json` — indique à Vercel d'exécuter `bun run build:vercel`.
- Script `build:vercel` dans `package.json`.

Le `vite.config.ts` d'origine n'est **pas** modifié — Lovable continue de fonctionner.

## Étapes

1. Pousse le projet sur un repo Git (GitHub / GitLab / Bitbucket) via le bouton **GitHub** dans Lovable (en haut à droite).
2. Sur [vercel.com](https://vercel.com), **Add New → Project**, importe le repo.
3. Vercel détecte `vercel.json` automatiquement. Laisse les réglages par défaut.
4. Dans **Project Settings → Environment Variables**, ajoute :
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(si tu utilises `client.server.ts`)*
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `LOVABLE_API_KEY` *(si tu utilises Lovable AI Gateway)*

   Tu trouves les valeurs `VITE_*` dans le `.env` local du projet. Les variantes serveur (`SUPABASE_URL`, etc.) ont les mêmes valeurs sans le préfixe `VITE_`.
5. Clique **Deploy**.

## Limites connues

- Toute modif faite dans Lovable doit être push sur Git pour être prise en compte sur Vercel.
- Les **secrets Lovable Cloud** (gérés via l'UI Lovable) ne sont pas synchronisés vers Vercel : tu dois les recopier manuellement dans le dashboard Vercel.
- Si tu ajoutes plus tard des dépendances qui ne tournent pas sur Cloudflare Workers, ton build Lovable cassera — garde les deux cibles compatibles (Web standards, fetch, pas de `child_process`, etc.).
- Les Edge Functions Supabase continueront à fonctionner identiquement depuis les deux hébergements.

## Tester en local la version Vercel

```bash
bun run build:vercel
```

Le build sort dans `.output/` (format compatible Vercel).
