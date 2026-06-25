import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import {
  Barcode,
  Minus,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Trash2,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { usePos } from "../../context/PosContext";
import { catalogService } from "../../services/catalogService";
import { customerService } from "../../services/customerService";
import { managementService } from "../../services/managementService";
import { transactionService } from "../../services/transactionService";
import type {
  Category,
  Customer,
  PaymentMethod,
  Product,
  Transaction,
} from "../../types/models";
import { shortDateTime } from "../../utils/dates";
import { money, numberInput } from "../../utils/money";
import { getImageUrl } from "../../utils/api";
import { ReceiptView } from "../../components/ReceiptView";
import { socket } from "../../lib/socket";

interface PaymentLine {
  method: PaymentMethod;
  amount: number;
  reference: string;
}

export function PosPage() {
  const {
    cart,
    addProduct,
    updateQuantity,
    updateDiscount,
    removeProduct,
    clearCart,
    subtotal,
    itemCount,
  } = usePos();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState<
    Record<string, string | number | boolean | null>
  >({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [payments, setPayments] = useState<PaymentLine[]>([
    { method: "CASH", amount: 0, reference: "" },
  ]);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [quantityOpen, setQuantityOpen] = useState(false);
  const { suspendSale, suspendedSales, resumeSale } = usePos();
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [scanType, setScanType] = useState<"success" | "error">("success");
  const [saleType, setSaleType] = useState<"PACK" | "HALF" | "SINGLE">("PACK");

  const taxRate = Number(settings.taxRate ?? 0);
  const taxable = Math.max(subtotal - orderDiscount, 0);
  const tax = Number(((taxable * taxRate) / 100).toFixed(2));
  const total = Number((taxable + tax).toFixed(2));
  const lowStockProducts = products.filter(
    (product) => product.stockQuantity < 20,
  );

  const favoriteProducts = products.filter((product) => product.isFavorite);

  const successBeep = useRef(new Audio("/sounds/beep.mp3"));

  const errorBeep = useRef(new Audio("/sounds/error.mp3"));

  const lowStockCount = lowStockProducts.length;

  async function loadCatalog(nextSearch = search, nextCategoryId = categoryId) {
    const [productResult, categoryResult, customerResult, settingsResult] =
      await Promise.all([
        catalogService.products(nextSearch, nextCategoryId),
        catalogService.categories(),
        customerService.customers(),
        managementService.settings(),
      ]);
    setProducts(productResult.products);
    setCategories(categoryResult.categories);
    setCustomers(customerResult.customers);
    setSettings(settingsResult.settings);
  }

  useEffect(() => {
    void loadCatalog();
  }, []);

  useEffect(() => {
    socket.on("stock-updated", () => {
      void loadCatalog();
    });

    return () => {
      socket.off("stock-updated");
    };
  }, []);

  const paidWithoutDebt = useMemo(
    () =>
      payments
        .filter((payment) => payment.method !== "DEBT")
        .reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore typing inside inputs
      const target = event.target as HTMLElement;

      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (event.key === "Enter") {
        const barcode = barcodeBuffer.trim();

        if (!barcode) return;

        const product = products.find((p) => p.barcode === barcode);

        if (product) {
          addProduct(product);

          successBeep.current.currentTime = 0;
          void successBeep.current.play().catch(() => {});

          showScanSuccess(product.name);
        } else {
          errorBeep.current.currentTime = 0;
          void errorBeep.current.play().catch(() => {});

          showScanError(barcode);
        }

        setBarcodeBuffer("");
        return;
      }

      if (event.key.length === 1) {
        setBarcodeBuffer((current) => current + event.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [barcodeBuffer, products, addProduct]);

  const balanceDue = Number(Math.max(total - paidWithoutDebt, 0).toFixed(2));

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const exact = products.find(
      (product) => product.barcode && product.barcode === search,
    );
    if (exact) {
      addProduct(exact);
      setSearch("");
      return;
    }
    void loadCatalog(search, categoryId);
  }

  function openCheckout() {
    setPayments([{ method: "CASH", amount: total, reference: "" }]);
    setCheckoutOpen(true);
  }

  function showScanSuccess(productName: string) {
    setScanType("success");
    setScanMessage(`✓ ${productName} added`);

    setTimeout(() => {
      setScanMessage("");
    }, 1500);
  }

  function showScanError(barcode: string) {
    setScanType("error");
    setScanMessage(`⚠ Product not found (${barcode})`);

    setTimeout(() => {
      setScanMessage("");
    }, 2000);
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const customerId = form.get("customerId")
      ? Number(form.get("customerId"))
      : null;
    const normalizedPayments = payments.map((payment) => ({
      ...payment,
      amount: payment.method === "DEBT" ? balanceDue : payment.amount,
    }));

    try {
      const result = await transactionService.checkout({
        customerId,
        items: cart.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
          discount: line.discount,
          saleType: line.saleType ?? "PACK",
        })),
        discount: orderDiscount,
        tax,
        payments: normalizedPayments,
        notes: String(form.get("notes") ?? ""),
        debtDueDate: String(form.get("debtDueDate") ?? ""),
      });
      setReceipt(result.transaction);
      setCheckoutOpen(false);
      clearCart();
      setOrderDiscount(0);
      await loadCatalog("", categoryId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    }
  }

  function updatePayment(index: number, patch: Partial<PaymentLine>) {
    setPayments((current) =>
      current.map((payment, itemIndex) =>
        itemIndex === index ? { ...payment, ...patch } : payment,
      ),
    );
  }

  function printReceipt() {
    const content = document.getElementById("receipt-print");

    if (!content) return;

    const printWindow = window.open("", "", "width=420,height=800");

    if (!printWindow) return;

    printWindow.document.write(`
    <html>
      <head>
        <title>Receipt</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
            background: white;
            color: #000;
            font-size: 12px;
          }

          h1,
          h2,
          h3,
          h4,
          h5,
          p {
            margin: 0;
          }

          .text-center {
            text-align: center;
          }

          .font-bold {
            font-weight: bold;
          }

          .text-xs {
            font-size: 11px;
          }

          .text-sm {
            font-size: 12px;
          }

          .text-lg {
            font-size: 16px;
          }

          .mt-1 { margin-top: 4px; }
          .mt-2 { margin-top: 8px; }
          .mt-4 { margin-top: 16px; }
          .mt-5 { margin-top: 20px; }

          .pt-3 {
            padding-top: 12px;
          }

          .grid {
            display: grid;
            gap: 8px;
          }

          .flex {
            display: flex;
          }

          .justify-between {
            justify-content: space-between;
          }

          .items-start {
            align-items: flex-start;
          }

          .gap-2 {
            gap: 8px;
          }

          .gap-3 {
            gap: 12px;
          }

          img {
            width: 40px;
            height: 40px;
            object-fit: cover;
            border-radius: 6px;
            border: 1px solid #ddd;

            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          hr {
            border: none;
            border-top: 1px dashed #999;
            margin: 10px 0;
          }

          .receipt-total {
            font-size: 18px;
            font-weight: bold;
          }

          .receipt-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10px;
            margin-bottom: 12px;
          }
               
          .receipt-item-total {
            font-weight: bold;
            white-space: nowrap;
            text-align: right;
            min-width: 70px;
          }

          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
            color: #555;
          }
        </style>
      </head>

      <body>
        ${content.innerHTML}
      </body>
    </html>
  `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }

  function openProductModal(product: Product) {
    setSelectedProduct(product);
    setSelectedQuantity(1);
  }

  function addSelectedProduct() {
    if (!selectedProduct) return;
    addProduct(selectedProduct, selectedQuantity);
    setSelectedProduct(null);
    setSelectedQuantity(1);
  }

  return (
    <main className="relative min-h-screen bg-slate-100 p-4">
      <section className="grid gap-4">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg md:grid-cols-[1fr_220px_auto]"
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-3 text-slate-400"
              size={18}
            />

            <Input
              className="pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product or scan barcode"
            />
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500"></span>
              Barcode Scanner Ready
            </div>
          </div>

          <Select
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              void loadCatalog(search, event.target.value);
            }}
          >
            <option value="">All Categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Button type="submit">
            <Barcode size={17} />
            Find
          </Button>
        </form>

        {lowStockCount > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
            <AlertTriangle className="text-amber-700" size={22} />

            <div>
              <p className="font-bold text-amber-900">
                {lowStockCount} product{lowStockCount > 1 ? "s" : ""} running
                low
              </p>

              <p className="text-sm text-amber-700">
                Please inform admin for restock.
              </p>
            </div>
          </div>
        )}

        {/* FAVOURITE PRODUCTS */}
        {favoriteProducts.length > 0 && (
          <section className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-xl font-black">Favorites</h2>

              <span>⭐</span>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
              {favoriteProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addProduct(product)}
                  className="rounded-2xl bg-till p-4 text-left text-white shadow-lg transition hover:scale-105"
                >
                  {product.imageUrl ? (
                    <img
                      src={getImageUrl(product.imageUrl)}
                      alt={product.name}
                      className="mb-4 h-40 w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="mb-4 grid h-40 place-items-center rounded-2xl bg-slate-100 text-lg font-black text-slate-500">
                      {product.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <p className="font-black">{product.name}</p>

                  <p className="mt-1 text-sm opacity-80">
                    {money(product.price)}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              disabled={product.stockQuantity <= 0}
              onClick={() => {
                const timer = window.setTimeout(() => {
                  setSelectedProduct(product);
                  setSelectedQuantity(1);
                  setSaleType("PACK");
                  setQuantityOpen(true);
                }, 220);

                window.clearTimeout((window as any).clickTimer);

                (window as any).clickTimer = timer;
              }}
              onDoubleClick={() => {
                window.clearTimeout((window as any).clickTimer);

                setQuantityOpen(false);

                addProduct(product);
              }}
              className="group grid min-h-[250px] content-between rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-emerald-500 hover:shadow-xl"
            >
              <div>
                {product.imageUrl ? (
                  <img
                    src={getImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="mb-4 h-40 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="mb-4 grid h-40 place-items-center rounded-2xl bg-slate-100 text-lg font-black text-slate-500">
                    {product.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <h2 className="line-clamp-2 text-lg font-extrabold text-slate-900">
                  {product.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {product.categoryName ?? "General"}
                </p>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <strong className="text-lg text-till">
                    {money(product.price, String(settings.currency ?? "GHS"))}
                  </strong>

                  <Badge
                    tone={
                      product.stockQuantity <= product.reorderLevel
                        ? "warn"
                        : "good"
                    }
                  >
                    {Number.isInteger(product.stockQuantity)
                      ? product.stockQuantity
                      : product.stockQuantity.toFixed(2)}
                  </Badge>
                </div>

                {product.allowSplitSales ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    {product.unitsPerPack ?? 1} units per pack
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">
                    Sold as full pack only
                  </p>
                )}

                {product.stockQuantity < 20 && (
                  <p className="mt-2 text-sm font-bold text-amber-700">
                    Only {product.stockQuantity} left
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Floating Cart Button */}
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-5 left-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-till text-white shadow-2xl transition-transform hover:scale-105"
      >
        <div className="relative">
          <ShoppingCart size={26} />

          {cart.length > 0 && (
            <span className="absolute -right-3 -top-3 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {itemCount}
            </span>
          )}
        </div>
      </button>

      {/* Cart Drawer */}
      {cartOpen && (
        <>
          <div
            className="animate-in fade-in zoom-in-95 duration-200"
            onClick={() => setCartOpen(false)}
          />

          <aside className="fixed bottom-0 left-0 top-0 z-[70] w-full max-w-[430px] overflow-auto border-r border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase text-till">Cart</p>

                <h2 className="text-xl font-black">{itemCount} Items</h2>
              </div>

              <div className="flex items-center gap-2">
                <ReceiptText className="text-ledger" size={24} />

                <Button variant="ghost" onClick={() => setCartOpen(false)}>
                  Close
                </Button>
              </div>
            </div>

            <div className="grid gap-3 p-4">
              {cart.map((line) => (
                <div
                  key={line.product.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      {line.product.imageUrl ? (
                        <img
                          src={getImageUrl(line.product.imageUrl)}
                          alt={line.product.name}
                          className="h-12 w-12 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg border bg-slate-100" />
                      )}

                      <div>
                        <h3 className="font-bold">{line.product.name}</h3>

                        <p className="text-sm text-slate-500">
                          {line.quantity}{" "}
                          {line.saleType === "HALF"
                            ? line.quantity > 1
                              ? "Halves"
                              : "Half"
                            : line.saleType === "SINGLE"
                              ? line.quantity > 1
                                ? "Singles"
                                : "Single"
                              : line.quantity > 1
                                ? "Packs"
                                : "Pack"}{" "}
                          × {money(line.product.price)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="h-9 w-9 px-0"
                      onClick={() => removeProduct(line.product.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-[120px_1fr] gap-3">
                    <div className="flex h-10 overflow-hidden rounded-md border border-slate-300">
                      <button
                        className="grid w-10 place-items-center bg-slate-50"
                        onClick={() =>
                          updateQuantity(line.product.id, line.quantity - 1)
                        }
                        type="button"
                      >
                        <Minus size={15} />
                      </button>

                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(event) => {
                          updateQuantity(
                            line.product.id,
                            Number(event.target.value),
                          );
                        }}
                        className="w-16 rounded-xl border border-slate-300 bg-white px-2 py-1 text-center font-bold outline-none"
                      />

                      <button
                        className="grid w-10 place-items-center bg-slate-50"
                        onClick={() =>
                          updateQuantity(line.product.id, line.quantity + 1)
                        }
                        type="button"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.discount}
                      onChange={(event) =>
                        updateDiscount(
                          line.product.id,
                          Number(event.target.value),
                        )
                      }
                      aria-label="Line discount"
                    />
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                  Cart is empty
                </p>
              )}

              <div className="grid gap-2 border-t border-slate-200 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>

                  <strong>
                    {money(subtotal, String(settings.currency ?? "GHS"))}
                  </strong>
                </div>

                <label className="flex items-center justify-between gap-3">
                  <span>Discount</span>

                  <Input
                    className="w-32"
                    type="number"
                    step="0.01"
                    min="0"
                    value={orderDiscount}
                    onChange={(event) =>
                      setOrderDiscount(Number(event.target.value))
                    }
                  />
                </label>

                <div className="flex justify-between">
                  <span>Tax</span>

                  <strong>
                    {money(tax, String(settings.currency ?? "GHS"))}
                  </strong>
                </div>

                <div className="flex justify-between text-xl">
                  <span>Total</span>

                  <strong>
                    {money(total, String(settings.currency ?? "GHS"))}
                  </strong>
                </div>

                <Button variant="secondary" onClick={suspendSale}>
                  Suspend Sale
                </Button>

                <Button
                  disabled={cart.length === 0}
                  onClick={() => {
                    setCartOpen(false);
                    openCheckout();
                  }}
                  className="h-14 rounded-2xl text-lg font-black shadow-lg"
                >
                  Checkout
                </Button>
              </div>
            </div>

            {/* SUSPEND SALES */}
            {suspendedSales.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                <h3 className="mb-3 font-black">Suspended Sales</h3>

                <div className="grid gap-2">
                  {suspendedSales.map((sale) => (
                    <button
                      key={sale.id}
                      onClick={() => resumeSale(sale.id)}
                      className="rounded-xl border border-slate-200 p-3 text-left transition hover:bg-slate-100"
                    >
                      <p className="font-bold">Sale #{sale.id}</p>

                      <p className="text-sm text-slate-500">
                        {sale.cart.length} items
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </>
      )}

      <Modal
        title=""
        open={quantityOpen}
        onClose={() => setQuantityOpen(false)}
      >
        {selectedProduct && (
          <div
            className="relative overflow-hidden rounded-[32px]"
            style={{
              backgroundImage: `url(${getImageUrl(selectedProduct.imageUrl)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Blur + Dark Overlay */}
            <div className="absolute inset-0 bg-white/20 " />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/90" />

            {/* Content */}
            <div className="relative z-10 p-6">
              {/* Product Info */}
              <div className="text-center">
                <h2 className="text-3xl font-black tracking-tight text-white">
                  {selectedProduct.name}
                </h2>

                <p className="mt-2 text-lg font-semibold text-white/70">
                  {money(selectedProduct.price)}
                </p>
              </div>

              {/* Quantity Controller */}
              <div className="mt-10 flex items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedQuantity((qty) => Math.max(1, qty - 1))
                  }
                  className="grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-xl transition hover:scale-110"
                >
                  <Minus size={22} />
                </button>

                <div className="min-w-[120px] rounded-3xl border border-white/10 bg-white/10 px-6 py-4 text-center backdrop-blur-xl">
                  <span className="text-5xl font-black text-white">
                    <div className="text-center">
                      <p className="text-5xl font-black text-white">
                        {selectedQuantity}
                      </p>

                      {selectedProduct.allowSplitSales && (
                        <p className="mt-2 text-sm text-white/70">
                          of {selectedProduct.unitsPerPack} units per pack
                        </p>
                      )}
                    </div>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedQuantity((qty) =>
                      Math.min(selectedProduct.stockQuantity, qty + 1),
                    )
                  }
                  className="grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-xl transition hover:scale-110"
                >
                  <Plus size={22} />
                </button>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-white">
                  Quantity
                </label>

                <input
                  type="number"
                  min={1}
                  max={selectedProduct.stockQuantity}
                  value={selectedQuantity}
                  onChange={(e) => {
                    const value = Number(e.target.value);

                    if (Number.isNaN(value)) return;

                    setSelectedQuantity(
                      Math.max(
                        1,
                        Math.min(selectedProduct.stockQuantity, value),
                      ),
                    );
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-lg font-bold text-white outline-none backdrop-blur-xl"
                />
              </div>

              {/* Quick Quantity */}
              {/* Quick Quantity */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {/* Normal quantity buttons */}
                {[1, 5, 10].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() =>
                      setSelectedQuantity((current) =>
                        Math.min(selectedProduct.stockQuantity, current + qty),
                      )
                    }
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-xl transition hover:scale-105"
                  >
                    +{qty}
                  </button>
                ))}

                {/* Split sale buttons */}
                {selectedProduct.allowSplitSales && (
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSaleType("PACK");
                        setSelectedQuantity(1);
                      }}
                      className={`rounded-2xl px-4 py-3 font-bold ${
                        saleType === "PACK"
                          ? "bg-emerald-600 text-white"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      Pack
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSaleType("HALF");
                        setSelectedQuantity(1);
                      }}
                      className={`rounded-2xl px-4 py-3 font-bold ${
                        saleType === "HALF"
                          ? "bg-amber-500 text-white"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      Half
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSaleType("SINGLE");
                        setSelectedQuantity(1);
                      }}
                      className={`rounded-2xl px-4 py-3 font-bold ${
                        saleType === "SINGLE"
                          ? "bg-sky-600 text-white"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      Single
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-5 text-center backdrop-blur-xl">
                <p className="text-sm text-white/70">Remaining after sale</p>

                <p className="mt-1 text-lg font-bold text-white">
                  {selectedProduct.stockQuantity - selectedQuantity}
                </p>

                <div className="my-4 h-px bg-white/10" />

                <p className="text-sm text-white/70">Total</p>

                <h2 className="mt-2 text-4xl font-black text-white">
                  {money(
                    selectedProduct.price * selectedQuantity,
                    String(settings.currency ?? "GHS"),
                  )}
                </h2>
              </div>

              {/* Add To Cart */}
              <button
                onClick={() => {
                  let productToSell = { ...selectedProduct };

                  if (
                    selectedProduct.allowSplitSales &&
                    selectedProduct.unitsPerPack
                  ) {
                    if (saleType === "HALF") {
                      productToSell.price = selectedProduct.price / 2;
                    }

                    if (saleType === "SINGLE") {
                      productToSell.price =
                        selectedProduct.price / selectedProduct.unitsPerPack;
                    }
                  }

                  addProduct(productToSell, selectedQuantity, saleType);

                  setQuantityOpen(false);
                }}
                className="mt-8 h-16 w-full rounded-3xl bg-white text-lg font-black text-slate-900 transition hover:scale-[1.02]"
              >
                Add To Cart
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Checkout"
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      >
        <form onSubmit={(event) => void checkout(event)} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer">
              <Select name="customerId">
                <option value="">Walk-in</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Debt Due Date">
              <Input name="debtDueDate" type="date" />
            </Field>
          </div>

          <div className="grid gap-2">
            {payments.map((payment, index) => (
              <div
                key={index}
                className="grid gap-2 sm:grid-cols-[150px_1fr_1fr_auto]"
              >
                <Select
                  value={payment.method}
                  onChange={(event) =>
                    updatePayment(index, {
                      method: event.target.value as PaymentMethod,
                    })
                  }
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="DEBT">Debt</option>
                </Select>

                <Input
                  type="number"
                  step="0.01"
                  value={
                    payment.method === "DEBT" ? balanceDue : payment.amount
                  }
                  disabled={payment.method === "DEBT"}
                  onChange={(event) =>
                    updatePayment(index, {
                      amount: Number(event.target.value),
                    })
                  }
                />

                <Input
                  value={payment.reference}
                  placeholder="Reference"
                  onChange={(event) =>
                    updatePayment(index, {
                      reference: event.target.value,
                    })
                  }
                />

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setPayments((current) =>
                      current.filter(
                        (_, paymentIndex) => paymentIndex !== index,
                      ),
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setPayments((current) => [
                  ...current,
                  {
                    method: "CARD",
                    amount: balanceDue,
                    reference: "",
                  },
                ])
              }
            >
              <Plus size={17} />
              Add Payment
            </Button>
          </div>

          <Field label="Notes">
            <Input name="notes" />
          </Field>

          <div className="rounded-md bg-slate-50 p-3">
            <div className="flex justify-between">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>

            <div className="flex justify-between">
              <span>Paid</span>
              <strong>{money(paidWithoutDebt)}</strong>
            </div>

            <div className="flex justify-between">
              <span>Balance</span>
              <strong>{money(balanceDue)}</strong>
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-danger">
              {error}
            </p>
          )}

          <Button type="submit">Complete Sale</Button>
        </form>
      </Modal>

      <Modal
        title="Receipt"
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
      >
        {receipt && (
          <div className="grid gap-4">
            <ReceiptView receipt={receipt} settings={settings} />

            {/* Actions */}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button className="h-12" onClick={printReceipt}>
                <Printer size={17} />
                Print Receipt
              </Button>

              <Button
                variant="secondary"
                className="h-12"
                onClick={() => setReceipt(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {scanMessage && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-2xl px-6 py-4 font-bold shadow-2xl transition-all ${
            scanType === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {scanMessage}
        </div>
      )}
    </main>
  );
}
