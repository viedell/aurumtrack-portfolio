import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/register")({
  head: () => ({ meta: [{ title: "Register Asset — AurumTrack" }] }),
  component: RegisterAsset,
});

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  asset_type: z.enum(["gold", "silver", "platinum", "palladium", "diamond", "other"]),
  serial_number: z.string().trim().min(1).max(80),
  weight_g: z.number().positive().max(1_000_000),
  purity: z.number().min(0).max(1000).optional(),
  purchase_value: z.number().nonnegative().max(1_000_000_000),
});

const types = ["gold", "silver", "platinum", "palladium", "diamond", "other"] as const;

function RegisterAsset() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", asset_type: "gold" as (typeof types)[number],
    serial_number: "", weight_g: "", purity: "", purchase_value: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse({
        ...form,
        weight_g: Number(form.weight_g),
        purity: form.purity ? Number(form.purity) : undefined,
        purchase_value: Number(form.purchase_value),
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("assets").insert({
        ...parsed, owner_id: user.id, photos, current_value: parsed.purchase_value, status: "pending", authentication_status: "pending",
      }).select().single();
      if (error) throw error;
      await supabase.from("transactions").insert({
        user_id: user.id, asset_id: data.id, asset_name: data.name, type: "registration",
        weight_g: parsed.weight_g, value: parsed.purchase_value, notes: "Initial registration",
      });
      return data;
    },
    onSuccess: (asset) => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Asset registered. Awaiting authentication.");
      router.navigate({ to: "/assets/$id", params: { id: asset.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPhotos((p) => [...p, url].slice(0, 4));
    });
  }

  return (
    <AppShell title="Register New Asset">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="max-w-3xl mx-auto space-y-gutter">
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-display text-lg text-on-surface mb-4">Photographic Evidence</h3>
          <label className="block border-2 border-dashed border-glass-stroke rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 transition">
            <input type="file" accept="image/*" multiple className="hidden" onChange={onPhoto} />
            <Icon name="add_photo_alternate" className="text-on-surface-variant text-4xl mb-2 block" />
            <p className="text-sm text-on-surface-variant">Upload up to 4 photos (front, back, serial, certificate)</p>
          </label>
          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {photos.map((p, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-glass-stroke">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Asset Name" required>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required maxLength={120} className="input" placeholder="Gold Bullion Bar 1kg" />
          </Field>
          <Field label="Asset Type" required>
            <select value={form.asset_type} onChange={(e) => setForm((f) => ({ ...f, asset_type: e.target.value as (typeof types)[number] }))} className="input">
              {types.map((t) => <option key={t} value={t} className="bg-charcoal-surface">{t}</option>)}
            </select>
          </Field>
          <Field label="Serial Number" required>
            <input value={form.serial_number} onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value }))} required minLength={1} maxLength={80} className="input font-mono" placeholder="PAMP-2024-99887" />
          </Field>
          <Field label="Weight (grams)" required>
            <input value={form.weight_g} onChange={(e) => setForm((f) => ({ ...f, weight_g: e.target.value }))} required type="number" step="0.001" min="0.001" className="input font-mono" placeholder="1000" />
          </Field>
          <Field label="Purity (0–1000 fineness)">
            <input value={form.purity} onChange={(e) => setForm((f) => ({ ...f, purity: e.target.value }))} type="number" step="0.001" min="0" max="1000" className="input font-mono" placeholder="999.9" />
          </Field>
          <Field label="Purchase Value (USD)" required>
            <input value={form.purchase_value} onChange={(e) => setForm((f) => ({ ...f, purchase_value: e.target.value }))} required type="number" step="0.01" min="0" className="input font-mono" placeholder="65000" />
          </Field>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.navigate({ to: "/assets" })} className="px-5 py-3 rounded-lg border border-glass-stroke text-on-surface-variant hover:text-on-surface">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-6 py-3 rounded-lg font-display uppercase tracking-widest text-sm hover:bg-primary-fixed transition glow-gold disabled:opacity-60">
            {mutation.isPending ? "Submitting…" : (<><Icon name="check_circle" /> Submit for authentication</>)}
          </button>
        </div>
      </form>

      <style>{`.input { width: 100%; background: #131313; border: 1px solid rgba(255,255,255,0.08); border-radius: 0.5rem; padding: 0.75rem 1rem; color: #e5e2e1; font-size: 14px; outline: none; transition: border-color 0.2s; } .input:focus { border-color: #c6c6c6; }`}</style>
    </AppShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-display text-[11px] tracking-widest text-on-surface-variant uppercase block mb-2">{label}{required && <span className="text-status-alert ml-1">*</span>}</span>
      {children}
    </label>
  );
}
