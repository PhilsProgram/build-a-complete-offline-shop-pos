import { TransactionItem } from "../types/models";
import { shortDateTime } from "../utils/dates";
import { money } from "../utils/money";
import { getImageUrl } from "../utils/api";

interface ReceiptViewProps {
  receipt: any;
  settings: any;
}

export function ReceiptView({ receipt, settings }: ReceiptViewProps) {
  console.log(receipt.items);
  return (
    <div
      id="receipt-print"
      className="mx-auto w-full max-w-sm bg-white p-2 text-sm text-ink"
    >
      {/* Shop Header */}
      <div className="text-center">
        <h2 className="text-xl font-black uppercase tracking-wide">
          {String(settings.shopName ?? "Offline Shop POS")}
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {String(settings.shopAddress ?? "")}
        </p>

        <p className="text-xs text-slate-500">
          {String(settings.shopPhone ?? "")}
        </p>
      </div>

      {/* Receipt Info */}
      <div className="mt-4 grid gap-1 py-2 text-sm">
        <div className="flex justify-between">
          <span>Receipt No</span>
          <strong>{receipt.receiptNo}</strong>
        </div>

        <div className="flex justify-between">
          <span>Cashier</span>
          <strong>{receipt.employeeName}</strong>
        </div>

        <div className="flex justify-between">
          <span>Date</span>
          <strong>{shortDateTime(receipt.createdAt)}</strong>
        </div>
      </div>

      {/* Items */}

      <div className="mt-4 grid gap-3">
        {receipt.items?.map((item: TransactionItem) => (
          <div key={item.id} className="receipt-item">
            <div className="receipt-item-left">
              <div>
                <div className="receipt-item-name">{item.productName}</div>

                <div className="receipt-item-meta">
                  <p className="text-xs text-slate-500">
                    {item.quantity}{" "}
                    {item.saleType === "HALF"
                      ? item.quantity > 1
                        ? "Halves"
                        : "Half"
                      : item.saleType === "SINGLE"
                        ? item.quantity > 1
                          ? "Singles"
                          : "Single"
                        : item.quantity > 1
                          ? "Packs"
                          : "Pack"}{" "}
                    × {money(item.unitPrice)}
                  </p>
                </div>
              </div>
            </div>

            <div className="receipt-item-total">{money(item.lineTotal)}</div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-5 grid gap-2 pt-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <strong>{money(receipt.subtotal)}</strong>
        </div>

        <div className="flex justify-between">
          <span>Discount</span>
          <strong>{money(receipt.discount)}</strong>
        </div>

        <div className="flex justify-between">
          <span>Tax</span>
          <strong>{money(receipt.tax)}</strong>
        </div>

        <div className="flex justify-between text-lg">
          <span className="font-black">Total</span>

          <strong className="font-black text-till">
            {money(receipt.total)}
          </strong>
        </div>

        <div className="flex justify-between">
          <span>Change</span>
          <strong>{money(receipt.changeDue)}</strong>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-3 text-center">
        <p className="text-sm font-semibold text-slate-700">
          Thank you for shopping with us
        </p>

        <p className="mt-2 text-xs text-slate-500">
          {String(settings.receiptFooter ?? "")}
        </p>
      </div>
    </div>
  );
}
