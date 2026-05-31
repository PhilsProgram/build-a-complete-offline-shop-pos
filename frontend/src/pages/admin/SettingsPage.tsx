import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Field, Input, Textarea } from "../../components/ui/Input";
import { managementService } from "../../services/managementService";
import { numberInput } from "../../utils/money";
import { getStoredToken, API_BASE_URL } from "../../services/http";

export function SettingsPage() {
  const [settings, setSettings] = useState<
    Record<string, string | number | boolean | null>
  >({});
  const [saved, setSaved] = useState("");
  const [backups, setBackups] = useState<
    Array<{
      file: string;
      kind: "manual" | "auto" | "unknown";
      size: number;
      createdAt: string;
    }>
  >([]);

  const [backupMessage, setBackupMessage] = useState("");

  useEffect(() => {
    managementService
      .settings()
      .then((result) => setSettings(result.settings))
      .catch(() => undefined);

    managementService
      .backups()
      .then((result) => setBackups(result.backups))
      .catch(() => undefined);
  }, []);

  async function exportBackup() {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/backups/export`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Backup export failed.");
  }

  return response.blob();
}

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      shopName: String(form.get("shopName") ?? ""),
      shopPhone: String(form.get("shopPhone") ?? ""),
      shopAddress: String(form.get("shopAddress") ?? ""),
      currency: String(form.get("currency") ?? "GHS"),
      receiptFooter: String(form.get("receiptFooter") ?? ""),
      taxRate: numberInput(form.get("taxRate")),
      lowStockThreshold: numberInput(form.get("lowStockThreshold")),
    };
    const result = await managementService.updateSettings(payload);
    setSettings(result.settings);
    setSaved("Saved");
    window.setTimeout(() => setSaved(""), 1800);
  }

  async function createBackup() {
  try {
    const blob =
      await managementService.exportBackup();
    const url =
      window.URL.createObjectURL(blob);
    const link =
      document.createElement("a");
    link.href = url;
    link.download =
      `pos-backup-${Date.now()}.db`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    const result =
      await managementService.backups();
    setBackups(result.backups);
    setBackupMessage(
      "Backup downloaded successfully."
    );
    setTimeout(() => {
      setBackupMessage("");
    }, 3000);
  } catch {
    setBackupMessage(
      "Backup failed."
    );
  }
}



  return (
    <div className="max-w-5xl">
      <form
        key={JSON.stringify(settings)}
        onSubmit={(event) => void save(event)}
        className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/30"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Shop Settings
            </h1>

            <p className="text-sm text-slate-500">
              Configure store information, receipts, taxes, and inventory
              preferences.
            </p>
          </div>

          {saved && (
            <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              {saved}
            </div>
          )}
        </div>

        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
            General Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Shop Name">
              <Input
                name="shopName"
                defaultValue={String(settings.shopName ?? "")}
                className="h-12 rounded-xl"
              />
            </Field>

            <Field label="Phone">
              <Input
                name="shopPhone"
                defaultValue={String(settings.shopPhone ?? "")}
                className="h-12 rounded-xl"
              />
            </Field>

            <Field label="Currency">
              <Input
                name="currency"
                defaultValue={String(settings.currency ?? "GHS")}
                className="h-12 rounded-xl"
              />
            </Field>

            <Field label="Tax Rate (%)">
              <Input
                name="taxRate"
                type="number"
                step="0.01"
                defaultValue={Number(settings.taxRate ?? 0)}
                className="h-12 rounded-xl"
              />
            </Field>

            <Field label="Low Stock Threshold">
              <Input
                name="lowStockThreshold"
                type="number"
                defaultValue={Number(settings.lowStockThreshold ?? 5)}
                className="h-12 rounded-xl"
              />
            </Field>
          </div>
        </section>

        <section className="mt-8 grid gap-5">
          <Field label="Shop Address">
            <Textarea
              name="shopAddress"
              defaultValue={String(settings.shopAddress ?? "")}
              className="min-h-[110px] rounded-xl"
              placeholder="Enter your store address..."
            />
          </Field>

          <Field label="Receipt Footer">
            <Textarea
              name="receiptFooter"
              defaultValue={String(settings.receiptFooter ?? "")}
              className="min-h-[110px] rounded-xl"
              placeholder="Thank you for shopping with us..."
            />
          </Field>
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            className="h-12 rounded-xl px-6 text-base font-semibold shadow-lg"
          >
            <Save size={18} />
            Save Settings
          </Button>

          <p className="text-sm text-slate-500">
            Changes are applied immediately after saving.
          </p>
        </div>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">Database Backups</h2>

            <p className="text-sm text-slate-500">
              Create and download database backups.
            </p>
          </div>

          <Button type="button" onClick={() => void createBackup()}>
            Create Backup
          </Button>
        </div>

        {backupMessage && (
          <div className="mt-4 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            {backupMessage}
          </div>
        )}

        <div className="mt-6 space-y-2">
          {backups.map((backup) => (
            <div
              key={backup.file}
              className="rounded-xl border border-slate-200 p-3"
            >
              <div className="font-semibold">{backup.file}</div>

              <div className="text-sm text-slate-500">
                {backup.kind} • {(backup.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          ))}

          {backups.length === 0 && (
            <div className="text-sm text-slate-500">No backups found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
