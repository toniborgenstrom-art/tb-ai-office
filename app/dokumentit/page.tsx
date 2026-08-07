import { DocumentProject } from "@/components/dashboard/document-project";
import { Shell } from "@/components/dashboard/shell";
import { createClient } from "@/lib/supabase/server";

type Document = { id: string; name: string; storage_path: string; mime_type: string | null; project_id: string | null; created_at: string };
type Project = { id: string; name: string };

export default async function Documents() {
  const supabase = await createClient();
  const [{ data: documents }, { data: projects }] = await Promise.all([
    supabase.from("documents").select("id,name,storage_path,mime_type,project_id,created_at").order("created_at", { ascending: false }),
    supabase.from("projects").select("id,name").order("name")
  ]);
  const rows = (documents ?? []) as Document[];
  const targets = (projects ?? []) as Project[];
  const incoming = rows.filter((document) => !document.project_id).length;
  return <Shell>
    <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#a67a00]">Kenttadokumentit</p><h1 className="mt-2 text-3xl font-semibold">Dokumenttipankki</h1><p className="mt-2 max-w-3xl text-sm text-[#607188]">Valvontamuistiosta pilveen tallennetut katselmuspöytäkirjat tulevat tänne ensin saapuneina. Valitse niille kohde, jolloin ne liittyvät työmaan seurantaan.</p></div>
    {incoming > 0 && <p className="mt-6 border border-[#d9ae16] bg-[#fff8dc] p-4 text-sm text-[#5f4600]"><b>{incoming} saapunutta dokumenttia odottaa kohdistusta.</b> Katselmus on tallessa pilvessä; valitse vain oikea kohde.</p>}
    <div className="mt-8 overflow-hidden border border-[#d6dee7] bg-white"><div className="grid grid-cols-[1.2fr_.9fr_auto] gap-4 border-b bg-[#f4f7fa] px-5 py-3 text-xs font-semibold uppercase text-[#607188]"><span>Dokumentti</span><span>Tallennettu</span><span>Kohdistus</span></div>{rows.length ? rows.map((document) => <div key={document.id} className="grid grid-cols-[1.2fr_.9fr_auto] items-center gap-4 border-b border-[#e4e9ef] px-5 py-4 text-sm last:border-0"><div><b>{document.name}</b><p className="mt-1 text-xs text-[#607188]">{document.storage_path.startsWith("valvontamuistio:") ? "Valvontamuistio · katselmuspöytäkirja" : document.mime_type || "Dokumentti"}</p></div><span className="text-xs text-[#607188]">{new Date(document.created_at).toLocaleString("fi-FI")}</span><DocumentProject documentId={document.id} projectId={document.project_id} projects={targets} /></div>) : <p className="p-6 text-sm text-[#607188]">Ei vielä pilveen tallennettuja dokumentteja.</p>}</div>
  </Shell>;
}
