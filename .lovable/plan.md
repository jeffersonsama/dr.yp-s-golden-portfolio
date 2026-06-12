# Plan — Multi-pages + Espace admin dr.yp

## 1. Restructuration en pages séparées

Conserver le design actuel (charte navy/or, Cormorant + Montserrat, hairlines 0.5px). La home devient un hero condensé qui renvoie vers chaque section.

Routes publiques :
- `/` — Hero + tagline + aperçu (3 dernières réalisations en vedette) + CTA vers chaque page
- `/a-propos` — Texte de présentation, compétences, photo de profil (depuis le profil admin)
- `/services` — Grille 3×2 + carte CTA contact
- `/realisations` — Grille filtrable, alimentée depuis la base (uniquement statut "Publié")
- `/contact` — Boutons sociaux + **formulaire** (Nom, Email/WhatsApp, Sujet, Message) qui crée un message dans la base

Nav fixe partagée (logo `dr.yp` à gauche, liens À propos / Services / Réalisations / Contact). Footer partagé. Scroll smooth, transitions douces.

Chaque route a son `head()` (title, description, og:title, og:description) distinct pour le SEO.

## 2. Back-office admin

Activation de **Lovable Cloud** (base, auth, stockage, fonctions serveur).

### Authentification
- Route `/admin` (non listée dans la nav publique, exclue du sitemap, `robots` disallow `/admin`)
- Auth email + mot de passe, **un seul compte admin** (création initiale par l'utilisateur via la page `/admin` à la première visite, puis verrouillage : pas de signup public)
- Session persistante, redirection auto vers `/admin/login` si non connecté
- Gate via le layout intégré `_authenticated`

### `/admin` — Dashboard
- 3 compteurs : total réalisations, vues du portfolio, messages reçus (dont non lus)
- Boutons d'accès rapide : Ajouter une réalisation, Voir messages, Modifier profil
- Liste des 5 dernières réalisations (titre, catégorie, date)

### `/admin/realisations` — CRUD réalisations
- Tableau : miniature, titre, catégorie, statut, vedette, date, actions
- Filtres : catégorie + statut
- Formulaire add/edit : upload image (drag & drop, JPG/PNG/WEBP, max 5 Mo, aperçu), titre, catégorie (Logo/Affiche/Flyer/Carte/Vidéo), description, statut (Publié/Brouillon), mois/année, checkbox "En vedette"
- Suppression avec modale de confirmation, image supprimée du stockage

### `/admin/messages` — Boîte de réception
- Liste des messages avec badge rouge "non lu"
- Actions : marquer lu, répondre (ouvre `mailto:`), archiver, supprimer
- Notification email vers `fibiflorent@gmail.com` à chaque nouveau message (via Lovable Emails — étape ultérieure, après config du domaine)

### `/admin/profil` — Profil éditable
- Champs : slogan, texte "À propos" (long), photo de profil, liens sociaux (WhatsApp, Email, TikTok, Instagram, Facebook), services actifs (checkboxes)
- Sauvegarde immédiate (les pages publiques lisent ces données en live)

## 3. Base de données (Lovable Cloud)

Tables :
- `realisations` (id, title, category, description, image_url, status, featured, date_month, date_year, views, created_at)
- `messages` (id, name, contact, subject, body, read, archived, created_at)
- `site_profile` (id=1, tagline, about, photo_url, social_links jsonb, active_services jsonb)
- `portfolio_views` (id, created_at) — compteur de vues
- `user_roles` (user_id, role) + fonction `has_role` (sécurité : seul admin écrit/lit messages/profil-admin)

RLS :
- `realisations` : SELECT public si `status='published'`, full CRUD pour admin
- `messages` : INSERT public (formulaire de contact), SELECT/UPDATE/DELETE admin uniquement
- `site_profile` : SELECT public, UPDATE admin
- `user_roles` : lecture authentifiée, écriture admin

Storage : bucket public `portfolio` pour les images de réalisations et la photo de profil.

## 4. Détails techniques

- TanStack Start (routes file-based), pas de SPA router
- Server functions `createServerFn` pour les opérations admin (avec `requireSupabaseAuth` + vérif rôle admin)
- Server function publique (sans auth) pour soumission du formulaire de contact + insertion message
- Composants admin avec shadcn (Dialog, Table, Form, Toggle, etc.)
- `react-hook-form` + `zod` pour validation
- `/admin/*` sous `_authenticated` (géré par l'intégration Supabase)
- Sitemap exclut `/admin/*`, `robots.txt` `Disallow: /admin`

## 5. Découpage en lots de livraison

**Lot 1 (cette itération) :**
1. Activer Lovable Cloud
2. Créer le schéma DB + RLS + bucket storage + rôle admin
3. Restructurer en pages séparées (`/`, `/a-propos`, `/services`, `/realisations`, `/contact`) avec nav/footer partagés et formulaire de contact fonctionnel
4. Mettre en place auth admin + layout `_authenticated`
5. Dashboard `/admin` avec compteurs + activité récente
6. CRUD complet `/admin/realisations` avec upload image
7. Boîte `/admin/messages` (lu/non lu, archiver, supprimer, répondre via mailto)
8. Éditeur `/admin/profil` (tous champs, photo)
9. Sitemap + robots.txt mis à jour

**Lot 2 (à faire ensuite, pas dans cette itération) :**
- Notifications email automatiques vers `fibiflorent@gmail.com` (nécessite configuration du domaine email — étape distincte que je proposerai après)

## Questions de validation

- **Compte admin** : je verrouille la création d'un compte après le premier signup (toi). À la première visite de `/admin`, tu crées ton compte avec ton email + un mot de passe, puis plus aucun signup n'est possible. OK ?
- **Vues du portfolio** : on incrémente à chaque visite de `/realisations` (compteur global). OK ?
- **Notif email** : on valide d'abord tout le reste, puis on branche les emails dans un second tour ?
