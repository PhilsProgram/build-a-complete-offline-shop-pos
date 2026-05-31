import type { Category, Product } from "../types/models";
import { apiRequest } from "./http";

export type ProductPayload = Omit<
  Product,
  "id" | "categoryName" | "profitMargin"
>;

export const catalogService = {
  products(search = "", categoryId = "") {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    return apiRequest<{ products: Product[] }>(
      `/products?${params.toString()}`,
    );
  },
  createProduct(payload: ProductPayload) {
    return apiRequest<{ id: number }>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateProduct(id: number, payload: Partial<ProductPayload>) {
    return apiRequest<{ id: number }>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteProduct(id: number) {
    return apiRequest<void>(`/products/${id}`, { method: "DELETE" });
  },
  alerts() {
    return apiRequest<{ lowStock: Product[]; outOfStock: Product[] }>(
      "/products/alerts",
    );
  },
  categories() {
    return apiRequest<{ categories: Category[] }>("/categories");
  },
  createCategory(payload: Pick<Category, "name" | "description">) {
    return apiRequest<{ id: number }>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteCategory(id: number) {
    return apiRequest<void>(`/categories/${id}`, { method: "DELETE" });
  },
  productMovements(productId: number) {
    return apiRequest<{
      movements: any[];
    }>(`/products/${productId}/movements`);
  },
  toggleFavorite(id: number) {
    return apiRequest(`/products/${id}/favorite`, {
      method: "PATCH",
    });
  },
};
