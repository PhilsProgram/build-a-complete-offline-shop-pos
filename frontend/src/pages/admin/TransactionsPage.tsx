import { FormEvent, useEffect, useState } from "react";
import { Printer, Search } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Table, Td, Th } from "../../components/ui/Table";
import { transactionService } from "../../services/transactionService";
import type { Transaction } from "../../types/models";
import { shortDateTime } from "../../utils/dates";
import { money } from "../../utils/money";

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [error, setError] = useState("");

  async function search(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const form = event ? new FormData(event.currentTarget) : new FormData();
    try {
      const result = await transactionService.transactions(
        String(form.get("search") ?? ""),
      );
      setTransactions(result.transactions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load transactions.",
      );
    }
  }

  useEffect(() => {
    void search();
  }, []);

  async function openReceipt(id: number) {
    const result = await transactionService.transaction(id);
    setSelected(result.transaction);
  }

  function printReceipt() {
    window.print();
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-300">
              Sales & Receipt Management
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight">
              Transactions
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Track receipts, monitor employee sales, and manage all completed
              transactions from one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-slate-300">
                Total
              </p>
              <h3 className="mt-1 text-2xl font-black">
                {transactions.length}
              </h3>
            </div>

            <div className="rounded-2xl bg-emerald-500/20 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-emerald-200">
                Paid
              </p>
              <h3 className="mt-1 text-2xl font-black">
                {transactions.filter((t) => t.paymentStatus === "PAID").length}
              </h3>
            </div>

            <div className="rounded-2xl bg-amber-500/20 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-amber-100">
                Pending
              </p>
              <h3 className="mt-1 text-2xl font-black">
                {transactions.filter((t) => t.paymentStatus !== "PAID").length}
              </h3>
            </div>

            <div className="rounded-2xl bg-indigo-500/20 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-indigo-100">
                Revenue
              </p>
              <h3 className="mt-1 text-xl font-black">
                {money(transactions.reduce((sum, t) => sum + t.total, 0))}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <form
        onSubmit={(event) => void search(event)}
        className="sticky top-4 z-20 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur"
      >
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <Input
              name="search"
              placeholder="Search receipt, employee or customer..."
              className="h-12 rounded-2xl border-slate-200 pl-11 text-sm shadow-sm"
            />
          </div>

          <Button className="h-12 rounded-2xl px-6" type="submit">
            <Search size={18} />
            Search
          </Button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Transactions */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <Th>Receipt</Th>
                <Th>Employee</Th>
                <Th>Total</Th>
                <Th>Profit</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th>Action</Th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="transition hover:bg-slate-50"
                >
                  <Td>
                    <div className="inline-flex rounded-xl bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                      {transaction.receiptNo}
                    </div>
                  </Td>

                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                        {transaction.employeeName?.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {transaction.employeeName}
                        </p>
                      </div>
                    </div>
                  </Td>

                  <Td>
                    <span className="text-base font-black text-slate-900">
                      {money(transaction.total)}
                    </span>
                  </Td>

                  <Td>
                    <span className="font-bold text-emerald-600">
                      {money(transaction.profit)}
                    </span>
                  </Td>

                  <Td>
                    <Badge
                      tone={
                        transaction.paymentStatus === "PAID" ? "good" : "warn"
                      }
                    >
                      {transaction.paymentStatus}
                    </Badge>
                  </Td>

                  <Td>
                    <span className="text-sm text-slate-500">
                      {shortDateTime(transaction.createdAt)}
                    </span>
                  </Td>

                  <Td>
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-xl"
                      onClick={() => void openReceipt(transaction.id)}
                    >
                      <Printer size={16} />
                      Receipt
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          {transactions.length === 0 && (
            <div className="grid place-items-center px-6 py-20 text-center">
              <div className="rounded-full bg-slate-100 p-6">
                <Printer size={40} className="text-slate-400" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-800">
                No transactions found
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Completed sales and receipts will appear here once transactions
                are made.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Receipt Modal */}
      <Modal
        title="Receipt"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <div
              id="receipt-print"
              className="mx-auto max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
            >
              <div className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-900 text-xl font-black text-white">
                  POS
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-900">
                  Store Receipt
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selected.receiptNo}
                </p>
              </div>

              <div className="mt-6 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier</span>
                  <strong>{selected.employeeName}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <strong>{shortDateTime(selected.createdAt)}</strong>
                </div>
              </div>

              <div className="my-6 border-t border-dashed border-slate-300" />

              <div className="grid gap-3">
                {selected.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.productName}
                      </p>

                      <p className="text-xs text-slate-500">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <strong>{money(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>

              <div className="my-6 border-t border-dashed border-slate-300" />

              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <strong>{money(selected.subtotal)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Discount</span>
                  <strong>{money(selected.discount)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Tax</span>
                  <strong>{money(selected.tax)}</strong>
                </div>

                <div className="mt-3 flex justify-between rounded-2xl bg-slate-900 px-4 py-4 text-lg text-white">
                  <span>Total</span>
                  <strong>{money(selected.total)}</strong>
                </div>
              </div>

              <p className="mt-6 text-center text-xs text-slate-500">
                Thank you for shopping with us
              </p>
            </div>

            <Button
              className="mt-6 h-12 w-full rounded-2xl"
              onClick={printReceipt}
            >
              <Printer size={18} />
              Print Receipt
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}
