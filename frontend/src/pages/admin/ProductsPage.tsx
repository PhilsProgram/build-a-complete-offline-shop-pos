import { FormEvent, useEffect, useState } from "react";

import {
  FolderPlus,
  Package2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Boxes,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Field, Input, Select, Textarea } from "../../components/ui/Input";
import { Table, Td, Th } from "../../components/ui/Table";
import { catalogService } from "../../services/catalogService";
import type { Category, Product } from "../../types/models";
import { money, numberInput } from "../../utils/money";
import { shortDateTime } from "../../utils/dates";
import { Modal } from "../../components/ui/Modal";
import { getImageUrl } from "../../utils/api";

const emptyProduct = {
  name: "",
  sku: "",
  barcode: "",
  description: "",
  categoryId: "",
  imageUrl: "",
  price: 0,
  costPrice: 0,
  stockQuantity: 0,
  reorderLevel: 5,
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const [movements, setMovements] = useState<any[]>([]);

  async function load() {
    const [productResult, categoryResult] = await Promise.all([
      catalogService.products(search),
      catalogService.categories(),
    ]);

    setProducts(productResult.products);
    setCategories(categoryResult.categories);
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    let imageUrl: string | null = editing?.imageUrl ?? null;

    const imageFile = form.get("imageFile") as File;

    if (imageFile && imageFile.size > 0) {
      const uploadForm = new FormData();

      uploadForm.append("image", imageFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      const data = await response.json();

      imageUrl = data.path;
    }

    const payload = {
      sku: String(form.get("sku") ?? "") || null,
      barcode: String(form.get("barcode") ?? "") || null,
      name: String(form.get("name")),
      description: String(form.get("description") ?? "") || null,
      categoryId: form.get("categoryId")
        ? Number(form.get("categoryId"))
        : null,

      imageUrl,

      price: numberInput(form.get("price")),
      costPrice: numberInput(form.get("costPrice")),
      stockQuantity: Number(form.get("stockQuantity") ?? 0),
      reorderLevel: Number(form.get("reorderLevel") ?? 5),
      active: true,
    };

    try {
      if (editing) {
        await catalogService.updateProduct(editing.id, payload);
      } else {
        await catalogService.createProduct(payload);
      }

      setEditing(null);
      event.currentTarget.reset();

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product.");
    }
  }

  async function handleDelete(id: number) {
    await catalogService.deleteProduct(id);
    await load();
  }

  async function handleCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    await catalogService.createCategory({
      name: String(form.get("name")),
      description: String(form.get("description") ?? ""),
    });

    event.currentTarget.reset();

    await load();
  }

  async function deleteCategory(id: number) {
    await catalogService.deleteCategory(id);
    await load();
  }

  const lowStock = products.filter(
    (product) => product.stockQuantity <= product.reorderLevel,
  ).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-300">
              Inventory Management
            </p>

            <h1 className="mt-2 text-4xl font-black">Products & Stock</h1>

            <p className="mt-3 max-w-2xl text-slate-300">
              Manage products, categories, pricing, stock levels and inventory
              tracking.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-slate-300">Products</p>

              <h2 className="mt-2 text-3xl font-black">{products.length}</h2>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-slate-300">Low Stock</p>

              <h2 className="mt-2 text-3xl font-black">{lowStock}</h2>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Products</p>

              <h2 className="mt-2 text-3xl font-black">{products.length}</h2>
            </div>

            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
              <Package2 size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Categories</p>

              <h2 className="mt-2 text-3xl font-black">{categories.length}</h2>
            </div>

            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Boxes size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Low Stock</p>

              <h2 className="mt-2 text-3xl font-black">{lowStock}</h2>
            </div>

            <div className="rounded-2xl bg-red-100 p-3 text-red-700">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        {/* LEFT PANEL */}
        <section className="space-y-6">
          {/* CATEGORY */}
          <form
            onSubmit={handleCategory}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <FolderPlus size={22} />
              </div>

              <div>
                <p className="text-sm text-slate-500">Product Groups</p>

                <h2 className="text-2xl font-black">Categories</h2>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Category Name">
                <Input name="name" required />
              </Field>

              <Field label="Description">
                <Input name="description" />
              </Field>

              <Button type="submit">
                <FolderPlus size={17} />
                Save Category
              </Button>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    {category.name}

                    <button
                      type="button"
                      onClick={() => void deleteCategory(category.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </form>

          {/* PRODUCT FORM */}
          <form
            key={editing?.id ?? "new"}
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Inventory Form</p>

                <h2 className="text-2xl font-black">
                  {editing ? "Edit Product" : "Add Product"}
                </h2>
              </div>

              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <Plus size={20} />
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <Field label="Product Name">
                <Input
                  name="name"
                  required
                  defaultValue={editing?.name ?? emptyProduct.name}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="SKU">
                  <Input
                    name="sku"
                    defaultValue={editing?.sku ?? emptyProduct.sku}
                  />
                </Field>

                <Field label="Barcode">
                  <Input
                    name="barcode"
                    defaultValue={editing?.barcode ?? emptyProduct.barcode}
                  />
                </Field>
              </div>

              <Field label="Category">
                <Select
                  name="categoryId"
                  defaultValue={editing?.categoryId ?? emptyProduct.categoryId}
                >
                  <option value="">Uncategorized</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Selling Price">
                  <Input
                    name="price"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={editing?.price ?? emptyProduct.price}
                  />
                </Field>

                <Field label="Cost Price">
                  <Input
                    name="costPrice"
                    type="number"
                    step="0.01"
                    defaultValue={editing?.costPrice ?? emptyProduct.costPrice}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Stock Quantity">
                  <Input
                    name="stockQuantity"
                    type="number"
                    required
                    defaultValue={
                      editing?.stockQuantity ?? emptyProduct.stockQuantity
                    }
                  />
                </Field>

                <Field label="Reorder Level">
                  <Input
                    name="reorderLevel"
                    type="number"
                    defaultValue={
                      editing?.reorderLevel ?? emptyProduct.reorderLevel
                    }
                  />
                </Field>
              </div>

              <Field label="Product Image">
                <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-till hover:bg-teal-50">
                  <ImageIcon size={32} className="text-slate-400" />

                  <div>
                    <p className="font-semibold text-slate-700">
                      Click to choose image
                    </p>

                    <p className="text-xs text-slate-500">PNG, JPG, WEBP</p>
                  </div>

                  <input
                    type="file"
                    name="imageFile"
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </Field>
              <Field label="Description">
                <Textarea
                  name="description"
                  defaultValue={
                    editing?.description ?? emptyProduct.description
                  }
                />
              </Field>
              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <Button type="submit">
                  <Plus size={17} />
                  Save Product
                </Button>

                {editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </form>
        </section>

        {/* PRODUCT TABLE */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">Inventory List</p>

              <h2 className="text-2xl font-black">Products</h2>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 text-slate-400"
                  size={18}
                />

                <Input
                  className="pl-10"
                  placeholder="Search products..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() => void load()}
              >
                <RefreshCcw size={17} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th>Price</Th>
                  <Th>Stock</Th>
                  <Th>Profit</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={async (event) => {
                            event.stopPropagation();

                            await catalogService.toggleFavorite(product.id);

                            await load();
                          }}
                          className="mr-2 text-lg transition hover:scale-125"
                        >
                          {product.isFavorite ? "⭐" : "☆"}
                        </button>
                        {product.imageUrl ? (
                          <img
                            src={getImageUrl(product.imageUrl)}
                            alt={product.name}
                            className="h-14 w-14 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 font-bold text-slate-500">
                            {product.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <button
                            className="text-left font-bold text-slate-800 hover:text-emerald-700"
                            onClick={() => setEditing(product)}
                          >
                            {product.name}
                          </button>

                          <p className="text-xs text-slate-500">
                            {product.barcode || product.sku || "No code"}
                          </p>
                        </div>
                      </div>
                    </Td>

                    <Td>{product.categoryName ?? "None"}</Td>

                    <Td>{money(product.price)}</Td>

                    <Td>
                      <Badge
                        tone={
                          product.stockQuantity <= product.reorderLevel
                            ? "warn"
                            : "good"
                        }
                      >
                        {product.stockQuantity}
                      </Badge>
                    </Td>

                    <Td>
                      {money(
                        product.profitMargin ??
                          product.price - product.costPrice,
                      )}
                    </Td>

                    <Td>
                      <Button
                        type="button"
                        variant="danger"
                        className="h-10 w-10 px-0"
                        onClick={() => void handleDelete(product.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setRestockProduct(product);
                          setRestockQuantity(1);
                        }}
                      >
                      +
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={async () => {
                          setHistoryProduct(product);

                          const result = await catalogService.productMovements(
                            product.id,
                          );

                          setMovements(result.movements);
                        }}
                      >
                        History
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </section>
        <Modal
          title="Update Stock"
          open={Boolean(restockProduct)}
          onClose={() => setRestockProduct(null)}
        >
          {restockProduct && (
            <div className="grid gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <h2 className="text-lg font-black">{restockProduct.name}</h2>

                <p className="text-sm text-slate-500">
                  Current Stock: <strong>{restockProduct.stockQuantity}</strong>
                </p>
              </div>

              <Field label="Add Quantity">
                <Input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(event) =>
                    setRestockQuantity(Number(event.target.value))
                  }
                />
              </Field>

              <Button
                onClick={async () => {
                  try {
                    await catalogService.updateProduct(restockProduct.id, {
                      name: restockProduct.name,
                      sku: restockProduct.sku,
                      barcode: restockProduct.barcode,
                      description: restockProduct.description,
                      categoryId: restockProduct.categoryId,
                      imageUrl: restockProduct.imageUrl,
                      price: restockProduct.price,
                      costPrice: restockProduct.costPrice,
                      stockQuantity:
                        restockProduct.stockQuantity + restockQuantity,
                      reorderLevel: restockProduct.reorderLevel,
                      active: true,
                    });

                    await load();

                    setRestockProduct(null);
                  } catch (error) {
                    console.error(error);
                  }
                }}
              >
                Update Stock
              </Button>

              <Modal
                title="Stock History"
                open={Boolean(historyProduct)}
                onClose={() => {
                  setHistoryProduct(null);
                  setMovements([]);
                }}
              >
                {historyProduct && (
                  <div className="grid gap-4">
                    <div>
                      <h2 className="text-xl font-black">
                        {historyProduct.name}
                      </h2>

                      <p className="text-sm text-slate-500">
                        Current Stock: {historyProduct.stockQuantity}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {movements.map((movement) => (
                        <div
                          key={movement.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold">{movement.type}</p>

                              <p className="text-sm text-slate-500">
                                {movement.userName ?? "System"}
                              </p>
                            </div>

                            <strong
                              className={
                                movement.quantity > 0
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                              }
                            >
                              {movement.quantity > 0 ? "+" : ""}
                              {movement.quantity}
                            </strong>
                          </div>

                          <p className="mt-2 text-xs text-slate-400">
                            {shortDateTime(movement.created_at)}
                          </p>
                        </div>
                      ))}

                      {movements.length === 0 && (
                        <p className="text-center text-sm text-slate-500">
                          No stock history yet
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Modal>
            </div>
          )}
        </Modal>
      </div>
      <Modal
        title="Stock History"
        open={Boolean(historyProduct)}
        onClose={() => {
          setHistoryProduct(null);
          setMovements([]);
        }}
      >
        {historyProduct && (
          <div className="grid gap-4">
            <div>
              <h2 className="text-xl font-black">{historyProduct.name}</h2>

              <p className="text-sm text-slate-500">
                Current Stock: {historyProduct.stockQuantity}
              </p>
            </div>

            <div className="grid gap-3">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">{movement.type}</p>

                      <p className="text-sm text-slate-500">
                        {movement.userName ?? "System"}
                      </p>
                    </div>

                    <strong
                      className={
                        movement.quantity > 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }
                    >
                      {movement.quantity > 0 ? "+" : ""}
                      {movement.quantity}
                    </strong>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {shortDateTime(movement.created_at)}
                  </p>
                </div>
              ))}

              {movements.length === 0 && (
                <p className="text-center text-sm text-slate-500">
                  No stock history yet
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
