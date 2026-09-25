import { getStaff } from "@/src/lib/auth";
import { can, Permission } from "@/src/lib/permissions";
import { listPrograms } from "@/src/modules/credentials/queries";
import { DEV_TEMPLATE_FIELD_CONFIG } from "@/src/modules/credentials/template-config";
import { activateTemplateAction, createDevTemplateAction, retireTemplateAction, uploadTemplateAction } from "../actions";
import { Card, Flash, fmtDateTime, inputCls, PageHeader, primaryBtn, secondaryBtn } from "../_ui";

export const dynamic = "force-dynamic";

const OK: Record<string, string> = {
  created: "Development template created as a draft. Preview it, then activate.",
  uploaded: "Template version uploaded as a draft. Preview it carefully, then activate.",
  activated: "Template activated. The previous active version was retired; credentials already issued keep their version.",
  retired: "Template retired. This program cannot issue until another version is activated.",
};

const TONE: Record<string, string> = { ACTIVE: "bg-emerald-100 text-emerald-800", DRAFT: "bg-sky-100 text-sky-800", RETIRED: "bg-slate-200 text-slate-700" };

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await getStaff();
  if (!staff || !can(staff.role, Permission.CredentialsView)) return null;
  const manage = can(staff.role, Permission.TemplatesManage);
  const sp = await searchParams;
  const programs = await listPrograms();
  const layoutExample = JSON.stringify({ fieldConfig: DEV_TEMPLATE_FIELD_CONFIG, signatures: [] }, null, 2);

  return (
    <div className="space-y-5">
      <PageHeader title="Certificate templates" subtitle="Versioned artwork and field layout per program. Activated versions are frozen; changes need a new version." />
      <Flash error={sp.error} ok={sp.ok ? OK[sp.ok] : undefined} />
      <p className="rounded-msc border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        The final approved certificate design is pending. Until it is uploaded as a production template, programs can only use the watermarked
        development template, which cannot issue on production.
      </p>

      {programs.map((p) => (
        <Card key={p.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-brand-navy">{p.name}</h2>
            {manage && (
              <form action={createDevTemplateAction}>
                <input type="hidden" name="courseId" value={p.id} />
                <button className={secondaryBtn}>New development template</button>
              </form>
            )}
          </div>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="py-2">Version</th><th className="py-2">Name</th><th className="py-2">Status</th><th className="py-2">Production</th><th className="py-2">Created</th><th className="py-2"></th></tr>
            </thead>
            <tbody>
              {p.certificate_templates.map((t) => (
                <tr key={t.id} className="border-t border-brand-navy/5">
                  <td className="py-2 font-mono">v{t.version}</td>
                  <td className="py-2">{t.name}</td>
                  <td className="py-2"><span className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${TONE[t.status]}`}>{t.status.toLowerCase()}</span></td>
                  <td className="py-2">{t.is_production ? "Yes" : "No (specimen)"}</td>
                  <td className="py-2 text-muted">{fmtDateTime(t.created_at)}</td>
                  <td className="py-2">
                    <div className="flex justify-end gap-2">
                      <a href={`/api/admin/credentials/templates/${t.id}/preview`} target="_blank" rel="noopener" className="text-xs font-semibold text-brand-blue hover:underline">Preview</a>
                      {manage && t.status === "DRAFT" && (
                        <form action={activateTemplateAction}><input type="hidden" name="templateId" value={t.id} /><button className="text-xs font-semibold text-success hover:underline">Activate</button></form>
                      )}
                      {manage && t.status === "ACTIVE" && (
                        <form action={retireTemplateAction}><input type="hidden" name="templateId" value={t.id} /><button className="text-xs font-semibold text-danger hover:underline">Retire</button></form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {p.certificate_templates.length === 0 && <tr><td colSpan={6} className="py-3 text-muted">No templates yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      ))}

      {manage && (
        <Card>
          <details>
            <summary className="cursor-pointer font-display text-lg font-semibold text-brand-navy">Upload approved artwork as a new version</summary>
            <form action={uploadTemplateAction} className="mt-4 space-y-4" encType="multipart/form-data">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold text-brand-navy">Program
                  <select name="courseId" required className={inputCls}>
                    {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-semibold text-brand-navy">Version name
                  <input name="name" required maxLength={120} placeholder="Approved design, October 2026" className={inputCls} />
                </label>
                <label className="space-y-1 text-sm font-semibold text-brand-navy">Artwork: one-page PDF (preferred) or PNG/JPEG, with the dynamic areas left blank
                  <input name="background" type="file" required accept="application/pdf,image/png,image/jpeg" className="block w-full text-sm" />
                </label>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-brand-navy">Extra assets, referenced in the layout as &quot;asset:asset1&quot; and so on</p>
                  {[1, 2, 3, 4].map((n) => (
                    <label key={n} className="flex items-center gap-2 text-xs text-muted">asset{n}
                      <input name={`asset${n}`} type="file" accept="image/png,image/jpeg,font/ttf,font/otf,.ttf,.otf" className="text-xs" />
                    </label>
                  ))}
                  <p className="text-xs text-muted">Signature images (PNG/JPEG) and brand fonts (TTF/OTF). Signatures are configured per template.</p>
                </div>
              </div>
              <label className="block space-y-1 text-sm font-semibold text-brand-navy">Layout (JSON: field boxes, QR box and signature blocks, in PDF points from the bottom-left)
                <textarea name="layout" required rows={14} defaultValue={layoutExample} className="w-full rounded-msc border border-brand-navy/15 p-3 font-mono text-xs" />
              </label>
              <label className="block space-y-1 text-sm font-semibold text-brand-navy">Notes
                <input name="notes" maxLength={1000} className={inputCls} />
              </label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isProduction" className="h-4 w-4 accent-brand-blue" /> This is approved production artwork</label>
              <button className={primaryBtn}>Upload as draft</button>
            </form>
          </details>
        </Card>
      )}
    </div>
  );
}
