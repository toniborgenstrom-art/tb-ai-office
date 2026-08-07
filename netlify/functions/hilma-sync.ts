import { syncHilmaForAllCompanies } from "../../lib/hilma/sync";

export default async () => {
  try {
    const result = await syncHilmaForAllCompanies((name) => process.env[name]);
    return Response.json({ ok: true, ...result });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Hilma-ajastus epäonnistui.";
    console.error(message);
    return Response.json({ error: message }, { status: 502 });
  }
};

// One daily production run keeps the first version inexpensive while the
// filtering rules are being refined. Manual sync remains available in UI.
export const config = { schedule: "@daily" };
