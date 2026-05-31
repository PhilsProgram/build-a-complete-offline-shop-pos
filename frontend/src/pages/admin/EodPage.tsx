import { FormEvent, useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Field, Input, Textarea } from "../../components/ui/Input";
import { StatCard } from "../../components/ui/StatCard";
import { Table, Td, Th } from "../../components/ui/Table";
import { managementService } from "../../services/managementService";
import { todayDateInput } from "../../utils/dates";
import { money, numberInput } from "../../utils/money";

type Expected = {
  cashExpected: number;
  cardExpected: number;
  mobileExpected: number;
  expensesTotal: number;
};

export function EodPage() {
  const [date, setDate] = useState(todayDateInput());
  const [expected, setExpected] = useState<Expected | null>(null);
  const [records, setRecords] = useState<
    Array<Record<string, number | string | null>>
  >([]);

  async function load(targetDate = date) {
    const [expectedResult, recordsResult] = await Promise.all([
      managementService.eodExpected(targetDate),
      managementService.eodRecords(),
    ]);
    setExpected(expectedResult.expected);
    setRecords(recordsResult.records);
  }

  useEffect(() => {
    void load();
  }, []);

  async function close(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await managementService.closeEod({
      businessDate: date,
      cashCounted: numberInput(form.get("cashCounted")),
      cardCounted: numberInput(form.get("cardCounted")),
      mobileCounted: numberInput(form.get("mobileCounted")),
      notes: String(form.get("notes") ?? ""),
    });
    await load();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={(event) => void close(event)}
        className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/30"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              End Of Day Closing
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review expected totals and close today’s business activities.
            </p>
          </div>

          <div className="w-full max-w-xs">
            <Field label="Business Date">
              <Input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  void load(event.target.value);
                }}
                className="h-12 rounded-xl"
              />
            </Field>
          </div>
        </div>

        {expected && (
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Cash Expected"
              value={money(expected.cashExpected)}
              accent="from-emerald-500 to-emerald-700"
            />

            <StatCard
              label="Card Expected"
              value={money(expected.cardExpected)}
              accent="from-blue-500 to-blue-700"
            />

            <StatCard
              label="Mobile Expected"
              value={money(expected.mobileExpected)}
              accent="from-violet-500 to-violet-700"
            />

            <StatCard
              label="Expenses"
              value={money(expected.expensesTotal)}
              accent="from-amber-500 to-amber-700"
            />
          </section>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Field label="Cash Counted">
            <Input
              name="cashCounted"
              type="number"
              step="0.01"
              defaultValue="0"
              className="h-12 rounded-xl"
            />
          </Field>

          <Field label="Card Counted">
            <Input
              name="cardCounted"
              type="number"
              step="0.01"
              defaultValue="0"
              className="h-12 rounded-xl"
            />
          </Field>

          <Field label="Mobile Counted">
            <Input
              name="mobileCounted"
              type="number"
              step="0.01"
              defaultValue="0"
              className="h-12 rounded-xl"
            />
          </Field>
        </div>

        <div className="mt-5">
          <Field label="Closing Notes">
            <Textarea
              name="notes"
              className="min-h-[120px] rounded-xl"
              placeholder="Add notes about shortages, overages, or any observations..."
            />
          </Field>
        </div>

        <Button
          className="mt-6 h-12 rounded-xl px-6 text-base font-semibold shadow-lg"
          type="submit"
        >
          <ClipboardCheck size={18} />
          Close Day
        </Button>
      </form>

      <section className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/30">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Closing History
            </h2>

            <p className="text-sm text-slate-500">
              Previously closed end-of-day records
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Cash</Th>
                <Th>Card</Th>
                <Th>Mobile</Th>
                <Th>Variance</Th>
                <Th>Closed By</Th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr
                  key={String(record.id)}
                  className="transition hover:bg-slate-50"
                >
                  <Td>
                    <span className="font-medium text-slate-700">
                      {String(record.businessDate)}
                    </span>
                  </Td>

                  <Td>{money(Number(record.cashCounted ?? 0))}</Td>

                  <Td>{money(Number(record.cardCounted ?? 0))}</Td>

                  <Td>{money(Number(record.mobileCounted ?? 0))}</Td>

                  <Td>
                    <span
                      className={
                        Number(record.variance ?? 0) < 0
                          ? "font-semibold text-rose-600"
                          : "font-semibold text-emerald-600"
                      }
                    >
                      {money(Number(record.variance ?? 0))}
                    </span>
                  </Td>

                  <Td>
                    <span className="font-medium text-slate-700">
                      {String(record.closedBy ?? "")}
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
