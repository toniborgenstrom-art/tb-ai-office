import Link from "next/link";
import { Shell } from "@/components/dashboard/shell";
import { ProjectStatus } from "@/components/dashboard/project-status";
import { createClient } from "@/lib/supabase/server";

const tarjousUrl = "https://lvi-tarjoustyokalu.netlify.app/?fresh=tb-tarjoustyokalu-cache-cleanup-v1";
const muistioUrl = "https://lvi-valvontamuistio-app.netlify.app/";
type Project = { id: string; name: string; location: string | null; project_type: string | null; status: string; customer: { name: string }[] };
function handoff(url: string, project: Project) { const target = new URL(url); target.searchParams.set("project", project.name); if (project.location) target.searchParams.set("location", project.location); if (project.customer[0]?.name) target.searchParams.set("customer", project.customer[0].name); return target.toString(); }

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id,name,location,project_type,status,customer:customers(name)").is("archived_at", null).order("created_at", { ascending: false });
  const projects = (data ?? []) as Project[];
  return <Shell><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#a67a00]">Yhteinen työtila</p><h1 className="mt-2 text-3xl font-semibold">Kohteet</h1><p className="mt-2 max-w-3xl text-sm text-[#607188]">Yksi selkeä päärekisteri: kohde/työmaa on aina pääasia. Tilaaja, laskut, valvontamuistiot ja tarjoukset liitetään siihen.</p><div className="mt-8 overflow-hidden border border-[#d6dee7] bg-white shadow-sm"><div className="grid grid-cols-[1.15fr_.85fr_.7fr_auto] gap-4 border-b border-[#d6dee7] bg-[#f4f7fa] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#607188]"><span>Kohde / työmaa</span><span>Tilaaja</span><span>Tila</span><span>Toiminnot</span></div>{projects.length ? projects.map(project => <div key={project.id} className="grid grid-cols-[1.15fr_.85fr_.7fr_auto] items-center gap-4 border-b border-[#e4e9ef] px-5 py-4 text-sm last:border-0"><div><Link href={`/tyomaat/${project.id}`} className="font-semibold text-[#142b45] underline">{project.name}</Link><p className="mt-1 text-xs text-[#607188]">{[project.location, project.project_type].filter(Boolean).join(" · ") || "Täydennä työmaatiedot"}</p></div><span className={project.customer[0]?.name ? "text-[#142b45]" : "font-semibold text-red-700"}>{project.customer[0]?.name ?? "Tilaaja puuttuu"}</span><ProjectStatus id={project.id} status={project.status} /><div className="flex flex-wrap justify-end gap-2"><Link href={`/tyomaat/${project.id}`} className="rounded bg-[#d9ae16] px-3 py-2 text-xs font-semibold text-[#142b45]">Avaa työmaa</Link><a href={handoff(tarjousUrl, project)} target="_blank" rel="noreferrer" className="rounded border border-[#112b49] px-3 py-2 text-xs font-semibold text-[#142b45]">Tarjous ↗</a><a href={handoff(muistioUrl, project)} target="_blank" rel="noreferrer" className="rounded bg-[#112b49] px-3 py-2 text-xs font-semibold text-white">Muistio ↗</a></div></div>) : <p className="p-8 text-sm text-[#607188]">Ei vielä työmaita. Luo tilaajalle työmaa Tilaajat-sivulta.</p>}</div></Shell>;
}
