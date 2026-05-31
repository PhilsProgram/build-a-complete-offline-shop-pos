import { createContext, useContext, useMemo, useState } from "react";

import type { CartLine, Product } from "../types/models";

interface SuspendedSale {
  id: number;
  cart: CartLine[];
  createdAt: string;
}

interface PosContextValue {
  cart: CartLine[];

  suspendedSales: SuspendedSale[];

  addProduct: (product: Product, quantity?: number) => void;

  updateQuantity: (productId: number, quantity: number) => void;

  updateDiscount: (productId: number, discount: number) => void;

  removeProduct: (productId: number) => void;

  clearCart: () => void;

  suspendSale: () => void;

  resumeSale: (id: number) => void;

  subtotal: number;

  itemCount: number;
}

const PosContext = createContext<PosContextValue | undefined>(undefined);

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);

  const [suspendedSales, setSuspendedSales] = useState<SuspendedSale[]>([]);

  const value = useMemo<PosContextValue>(
    () => ({
      cart,

      suspendedSales,

      addProduct(product) {
        setCart((lines) => {
          const existing = lines.find((line) => line.product.id === product.id);

          if (existing) {
            return lines.map((line) =>
              line.product.id === product.id
                ? {
                    ...line,
                    quantity: Math.min(
                      line.quantity + 1,
                      product.stockQuantity,
                    ),
                  }
                : line,
            );
          }

          return [
            ...lines,
            {
              product,
              quantity: 1,
              discount: 0,
            },
          ];
        });
      },

      updateQuantity(productId, quantity) {
        setCart((lines) =>
          lines.map((line) =>
            line.product.id === productId
              ? {
                  ...line,
                  quantity: Math.max(
                    1,
                    Math.min(quantity, line.product.stockQuantity),
                  ),
                }
              : line,
          ),
        );
      },

      updateDiscount(productId, discount) {
        setCart((lines) =>
          lines.map((line) =>
            line.product.id === productId
              ? {
                  ...line,
                  discount: Math.max(0, discount),
                }
              : line,
          ),
        );
      },

      removeProduct(productId) {
        setCart((lines) =>
          lines.filter((line) => line.product.id !== productId),
        );
      },

      clearCart() {
        setCart([]);
      },

      suspendSale() {
        if (!cart.length) return;

        setSuspendedSales((sales) => [
          ...sales,
          {
            id: Date.now(),
            cart,
            createdAt: new Date().toISOString(),
          },
        ]);

        setCart([]);
      },

      resumeSale(id) {
        const sale = suspendedSales.find((sale) => sale.id === id);

        if (!sale) return;

        setCart(sale.cart);

        setSuspendedSales((sales) => sales.filter((sale) => sale.id !== id));
      },

      subtotal: Number(
        cart
          .reduce(
            (sum, line) =>
              sum + (line.product.price * line.quantity - line.discount),
            0,
          )
          .toFixed(2),
      ),

      itemCount: cart.reduce((sum, line) => sum + line.quantity, 0),
    }),
    [cart, suspendedSales],
  );

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos() {
  const context = useContext(PosContext);

  if (!context) {
    throw new Error("usePos must be used within PosProvider");
  }

  return context;
}
