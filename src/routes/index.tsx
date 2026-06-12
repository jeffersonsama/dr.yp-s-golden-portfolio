import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "dr.yp — Faradito Fibi Florent · Designer graphique" },
      { name: "description", content: "Portfolio de dr.yp — designer graphique : logos, affiches, flyers, cartes, montage vidéo." },
    ],
  }),
  component: Index,
});

const NAV = [
  { href: "#about", label: "À propos" },
  { href: "#services", label: "Services" },
  { href: "#work", label: "Réalisations" },
  { href: "#contact", label: "Contact" },
];

const SERVICES = [
  { n: "01", t: "Logos", d: "Identités visuelles distinctives, pensées pour durer." },
  { n: "02", t: "Affiches", d: "Compositions percutantes pour vos campagnes et événements." },
  { n: "03", t: "Flyers", d: "Supports promotionnels élégants, clairs et efficaces." },
  { n: "04", t: "Cartes de visite & d'invitation", d: "Une première impression à la hauteur de votre marque." },
  { n: "05", t: "Montage vidéo", d: "Récits visuels rythmés, montés avec précision." },
];

const CATS = ["Tous", "Logos", "Affiches", "Flyers", "Cartes"] as const;
type Cat = (typeof CATS)[number];

const WORKS: { title: string; cat: Exclude<Cat, "Tous"> }[] = [
  { title: "Identité — Maison Aurea", cat: "Logos" },
  { title: "Affiche — Nuit Blanche", cat: "Affiches" },
  { title: "Flyer — Soirée Lounge", cat: "Flyers" },
  { title: "Carton d'invitation — Gala", cat: "Cartes" },
  { title: "Logo — Studio Onyx", cat: "Logos" },
  { title: "Affiche — Festival Doré", cat: "Affiches" },
  { title: "Flyer — Promo Été", cat: "Flyers" },
  { title: "Carte de visite — Atelier", cat: "Cartes" },
  { title: "Logo — Café Mirage", cat: "Logos" },
];

const CONTACTS = [
  { label: "WhatsApp +229 61 46 30 01", href: "https://wa.me/22961463001" },
  { label: "Email · fibiflorent@gmail.com", href: "mailto:fibiflorent@gmail.com" },
  { label: "TikTok · @dr.yopcity", href: "https://www.tiktok.com/@dr.yopcity" },
  { label: "Instagram · @florent_dr", href: "https://instagram.com/florent_dr" },
  { label: "Facebook · Florent Faradito", href: "https://facebook.com/" },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display italic text-gold ${className}`} style={{ letterSpacing: "0.04em" }}>
      dr.yp
    </span>
  );
}

function Index() {
  const [cat, setCat] = useState<Cat>("Tous");
  const filtered = cat === "Tous" ? WORKS : WORKS.filter((w) => w.cat === cat);

  return (
    <div className="min-h-screen bg-navy text-offwhite">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#0A2342]/80 hairline border-x-0 border-t-0">
        <nav className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <a href="#top"><Logo className="text-2xl" /></a>
          <ul className="hidden md:flex items-center gap-10 text-[12px] uppercase tracking-[0.25em] text-muted-foreground">
            {NAV.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-gold transition-colors duration-300">{l.label}</a>
              </li>
            ))}
          </ul>
          <a href="#contact" className="md:hidden text-[11px] uppercase tracking-[0.25em] text-gold">Contact</a>
        </nav>
      </header>

      {/* HERO */}
      <section id="top" className="relative min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="text-center max-w-5xl">
          <p className="text-[11px] md:text-xs uppercase tracking-[0.45em] text-muted-foreground mb-8">
            Faradito Fibi Florent
          </p>
          <h1
            className="font-display italic text-gold leading-[0.95]"
            style={{ fontSize: "clamp(5rem, 18vw, 16rem)", letterSpacing: "0.02em" }}
          >
            dr.yp
          </h1>
          <div className="mx-auto my-10 gold-divider w-40" />
          <p className="text-sm md:text-base uppercase tracking-[0.35em] text-offwhite/90">
            Designer graphique <span className="text-gold mx-2">·</span> Créateur visuel
          </p>
          <div className="mt-14">
            <a
              href="#work"
              className="inline-block hairline px-10 py-4 text-[11px] uppercase tracking-[0.3em] text-gold hover:bg-gold hover:text-navy transition-all duration-500"
            >
              Voir mes réalisations
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <Section id="about" eyebrow="01" title="À propos">
        <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
          <div className="space-y-6 text-[15px] leading-relaxed text-offwhite/85 font-light">
            <p>
              Je suis <span className="text-gold">Faradito Fibi Florent</span>, designer graphique sous le pseudo
              <Logo className="text-lg mx-2" />, passionné par la création d'identités visuelles élégantes
              et de supports de communication qui racontent une histoire.
            </p>
            <p>
              Mon approche conjugue minimalisme, raffinement et précision. Chaque projet est l'occasion
              de traduire une vision en images, avec un soin particulier porté aux détails. [...]
            </p>
            <p>
              Basé au Bénin, je collabore avec des marques, événements et particuliers qui recherchent
              une signature visuelle distinctive et un partenaire à l'écoute. [...]
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold mb-8">Mes engagements</p>
            <ul className="space-y-6">
              {[
                "Je prends le temps de comprendre votre vision",
                "Ouvert aux retours et modifications",
                "Livraisons dans les délais convenus",
              ].map((s) => (
                <li key={s} className="flex items-start gap-4 text-[15px] text-offwhite/90 font-light">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* SERVICES */}
      <Section id="services" eyebrow="02" title="Services">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--gold-line)] hairline">
          {SERVICES.map((s) => (
            <article
              key={s.n}
              className="bg-navy p-10 lg:p-12 group transition-colors duration-500 hover:bg-[#0d2a52] min-h-[260px] flex flex-col"
            >
              <span className="font-display text-gold/70 text-3xl mb-8">{s.n}</span>
              <h3 className="text-2xl text-offwhite mb-4 group-hover:text-gold transition-colors duration-300">{s.t}</h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">{s.d}</p>
            </article>
          ))}
          <a
            href="#contact"
            className="bg-navy p-10 lg:p-12 min-h-[260px] flex flex-col justify-center items-center text-center group hover:bg-gold hover:text-navy transition-all duration-500"
          >
            <span className="font-display italic text-gold text-3xl mb-4 group-hover:text-navy">06</span>
            <p className="font-display text-2xl text-offwhite group-hover:text-navy">Un projet en tête ?</p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-gold group-hover:text-navy">Parlons-en →</p>
          </a>
        </div>
      </Section>

      {/* PORTFOLIO */}
      <Section id="work" eyebrow="03" title="Réalisations">
        <div className="flex flex-wrap gap-3 mb-12">
          {CATS.map((c) => {
            const active = c === cat;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`hairline px-5 py-2 text-[11px] uppercase tracking-[0.25em] transition-all duration-300 ${
                  active ? "bg-gold text-navy border-gold" : "text-muted-foreground hover:text-gold"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filtered.map((w, i) => (
            <figure key={i} className="group relative aspect-square hairline overflow-hidden cursor-pointer">
              <div className="absolute inset-0 flex items-center justify-center bg-[#0d2a52]">
                <Logo className="text-5xl opacity-20" />
              </div>
              <figcaption className="absolute inset-0 bg-navy/90 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center text-center p-6">
                <span className="text-[10px] uppercase tracking-[0.35em] text-gold mb-3">{w.cat}</span>
                <span className="font-display text-xl text-offwhite">{w.title}</span>
                <div className="mt-4 gold-divider w-10" />
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* CONTACT */}
      <Section id="contact" eyebrow="04" title="Contact" center>
        <p className="text-center text-muted-foreground font-light max-w-xl mx-auto mb-12">
          Une idée, un projet, une collaboration ? Choisissez le canal qui vous convient.
        </p>
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
          {CONTACTS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className="w-full text-center hairline px-6 py-4 text-[12px] uppercase tracking-[0.25em] text-offwhite hover:text-navy hover:bg-gold hover:border-gold transition-all duration-500"
            >
              {c.label}
            </a>
          ))}
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="border-t hairline border-x-0 border-b-0 mt-10">
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

function Section({
  id,
  eyebrow,
  title,
  children,
  center = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <section id={id} className="py-28 lg:py-40 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <header className={`mb-16 lg:mb-20 ${center ? "text-center" : ""}`}>
          <p className="text-[11px] uppercase tracking-[0.4em] text-gold mb-5">— {eyebrow}</p>
          <h2 className="font-display text-5xl lg:text-7xl text-offwhite italic">{title}</h2>
          <div className={`gold-divider w-24 mt-8 ${center ? "mx-auto" : ""}`} />
        </header>
        {children}
      </div>
    </section>
  );
}
