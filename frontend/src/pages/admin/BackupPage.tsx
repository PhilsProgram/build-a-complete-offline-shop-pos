import { ChangeEvent, useEffect, useState } from "react";
import { DatabaseBackup, Download, Upload } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Table, Td, Th } from "../../components/ui/Table";
import { getStoredToken } from "../../services/http";
import { managementService } from "../../services/managementService";
import { shortDateTime } from "../../utils/dates";

type Backup = {
  file: string;
  kind: "manual" | "auto" | "unknown";
  size: number;
  createdAt: string;
};

export function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const result = await managementService.backups();
    setBackups(result.backups);
  }

  useEffect(() => {
    void load();
  }, []);

  async function exportBackup() {
    const blob = await managementService.exportBackup();

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    const now = new Date();

    const timestamp =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0") +
      "-" +
      String(now.getHours()).padStart(2, "0") +
      "-" +
      String(now.getMinutes()).padStart(2, "0");

    link.download = `pos-backup-${timestamp}.db`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    await load();
  }

  async function restore(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await managementService.restoreBackup(file);
    setMessage(result.message);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/30">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Backup & Restore
            </h1>

            <p className="text-sm text-slate-500">
              Secure your business data by exporting or restoring your database
              backups.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button
            type="button"
            onClick={() => void exportBackup()}
            className="h-12 rounded-xl px-5 text-base font-semibold shadow-lg"
          >
            <Download size={18} />
            Export Database
          </Button>

          <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800">
            <Upload size={18} />
            Restore Database
            <input
              type="file"
              accept=".db,.sqlite"
              className="hidden"
              onChange={(event) => void restore(event)}
            />
          </label>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">{message}</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/30">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <DatabaseBackup size={20} />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">
              Backup History
            </h2>

            <p className="text-sm text-slate-500">
              Recently created database backup files
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>File</Th>
                <Th>Kind</Th>
                <Th>Size</Th>
                <Th>Created</Th>
              </tr>
            </thead>

            <tbody>
              {backups.map((backup) => (
                <tr key={backup.file} className="transition hover:bg-slate-50">
                  <Td>
                    <div className="font-medium text-slate-700">
                      {backup.file}
                    </div>
                  </Td>

                  <Td>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {backup.kind}
                    </span>
                  </Td>

                  <Td>{(backup.size / 1024 / 1024).toFixed(2)} MB</Td>

                  <Td>
                    <span className="text-slate-600">
                      {shortDateTime(backup.createdAt)}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>
    </div>
  );
}
