import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AdminShell, AdminPageHeader } from "@/components/admin-shell";
import { adminListMessages, adminUpdateMessage, adminDeleteMessage } from "@/lib/portfolio.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  head: () => ({
    meta: [{ title: "Messages — Admin dr.yp" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminMessages,
});

function AdminMessages() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(adminListMessages);
  const update = useServerFn(adminUpdateMessage);
  const remove = useServerFn(adminDeleteMessage);

  const { data } = useQuery({ queryKey: ["admin-messages"], queryFn: () => fetchAll() });
  const [tab, setTab] = useState<"inbox" | "archived">("inbox");
  const [open, setOpen] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-messages"] });

  const list = (data ?? []).filter((m) => (tab === "inbox" ? !m.archived : m.archived));

  const act = async (id: string, patch: any) => {
    await update({ data: { id, ...patch } });
    refresh();
  };

  return (
    <AdminShell>
      <AdminPageHeader title="Messages" subtitle="Boîte de réception du formulaire de contact" />

      <div className="flex gap-2 mb-6">
        {(["inbox", "archived"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`hairline px-4 py-2 text-[11px] uppercase tracking-[0.25em] ${
              tab === t ? "bg-gold text-navy border-gold" : "text-muted-foreground hover:text-gold"
            }`}
          >
            {t === "inbox" ? "Reçus" : "Archivés"}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground font-light text-center py-20">Aucun message.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((m) => {
            const isOpen = open === m.id;
            return (
              <li key={m.id} className="hairline">
                <button
                  onClick={() => {
                    setOpen(isOpen ? null : m.id);
                    if (!m.read && !isOpen) act(m.id, { read: true });
                  }}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left flex-wrap"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {!m.read && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${m.read ? "text-muted-foreground" : "text-offwhite"}`}>
                        {m.subject}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1 truncate">
                        {m.name} · {m.contact}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground shrink-0">
                    {new Date(m.created_at).toLocaleString("fr-FR")}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t hairline border-x-0 border-b-0 p-6 space-y-4">
                    <p className="text-sm text-offwhite/90 font-light whitespace-pre-wrap">{m.body}</p>
                    <div className="flex gap-2 flex-wrap">
                      {m.contact.includes("@") && (
                        <a
                          href={`mailto:${m.contact}?subject=Re: ${encodeURIComponent(m.subject)}`}
                          className="hairline px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-navy"
                        >
                          Répondre
                        </a>
                      )}
                      <button
                        onClick={() => act(m.id, { archived: !m.archived })}
                        className="hairline px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-gold"
                      >
                        {m.archived ? "Désarchiver" : "Archiver"}
                      </button>
                      <button
                        onClick={async () => {
                          await remove({ data: { id: m.id } });
                          toast.success("Supprimé.");
                          setOpen(null);
                          refresh();
                        }}
                        className="hairline px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-red-300/80 hover:bg-red-500/20"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}
