import { z } from "zod";
import { db } from "../database/connection.js";
import { audit } from "../utils/audit.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const productSchema = z.object({
  sku: z.string().trim().optional().nullable(),
  barcode: z.string().trim().optional().nullable(),
  name: z.string().trim().min(2),
  description: z.string().trim().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().default(0),
  stockQuantity: z.number().int().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(5),
  active: z.boolean().default(true),
});

export const listProducts = asyncHandler((req, res) => {
  const search =
    typeof req.query.search === "string" ? `%${req.query.search}%` : null;
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
  const includeInactive = req.query.includeInactive === "true";

  const products = db
    .prepare(
      `
    SELECT
      p.id,
      p.sku,
      p.barcode,
      p.name,
      p.description,
      p.category_id as categoryId,
      c.name as categoryName,
      p.image_url as imageUrl,
      p.price,
      p.cost_price as costPrice,
      p.stock_quantity as stockQuantity,
      p.reorder_level as reorderLevel,
      p.active,
      ROUND(p.price - p.cost_price, 2) as profitMargin,
      p.created_at as createdAt,
      p.updated_at as updatedAt,
      p.is_favorite as isFavorite
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE (@includeInactive = 1 OR p.active = 1)
      AND (@search IS NULL OR p.name LIKE @search OR p.barcode LIKE @search OR p.sku LIKE @search)
      AND (@categoryId IS NULL OR p.category_id = @categoryId)
    ORDER BY p.name ASC
  `,
    )
    .all({
      search,
      categoryId,
      includeInactive: includeInactive ? 1 : 0,
    });

  res.json({ products });
});

export const getProduct = asyncHandler((req, res) => {
  const product = db
    .prepare(
      `
    SELECT
      id, sku, barcode, name, description, category_id as categoryId, image_url as imageUrl,
      price, cost_price as costPrice, stock_quantity as stockQuantity, reorder_level as reorderLevel,
      active, created_at as createdAt, updated_at as updatedAt
    FROM products
    WHERE id = ?
  `,
    )
    .get(Number(req.params.id));

  if (!product) {
    res.status(404).json({ message: "Product not found." });
    return;
  }

  res.json({ product });
});

export const createProduct = asyncHandler((req, res) => {
  const input = productSchema.parse(req.body);
  const result = db
    .prepare(
      `
    INSERT INTO products (
      sku, barcode, name, description, category_id, image_url,
      price, cost_price, stock_quantity, reorder_level, active
    )
    VALUES (
      @sku, @barcode, @name, @description, @categoryId, @imageUrl,
      @price, @costPrice, @stockQuantity, @reorderLevel, @active
    )
  `,
    )
    .run({
      sku: input.sku ?? null,
      barcode: input.barcode ?? null,
      name: input.name,
      description: input.description ?? null,
      categoryId: input.categoryId ?? null,
      imageUrl: input.imageUrl ?? null,
      price: input.price,
      costPrice: input.costPrice,
      stockQuantity: input.stockQuantity,
      reorderLevel: input.reorderLevel,
      active: input.active ? 1 : 0,
    });

  const id = Number(result.lastInsertRowid);
  audit(req.user?.id, "CREATE", "products", id, input);
  res.status(201).json({ id });
});

export const updateProduct = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const input = productSchema.partial().parse(req.body);
  const result = db
    .prepare(
      `
    UPDATE products
    SET
      sku = COALESCE(@sku, sku),
      barcode = COALESCE(@barcode, barcode),
      name = COALESCE(@name, name),
      description = COALESCE(@description, description),
      category_id = COALESCE(@categoryId, category_id),
      image_url = COALESCE(@imageUrl, image_url),
      price = COALESCE(@price, price),
      cost_price = COALESCE(@costPrice, cost_price),
      stock_quantity = COALESCE(@stockQuantity, stock_quantity),
      reorder_level = COALESCE(@reorderLevel, reorder_level),
      active = COALESCE(@active, active)
    WHERE id = @id
  `,
    )
    .run({
      id,
      sku: input.sku ?? null,
      barcode: input.barcode ?? null,
      name: input.name ?? null,
      description: input.description ?? null,
      categoryId: input.categoryId ?? null,
      imageUrl: input.imageUrl ?? null,
      price: input.price ?? null,
      costPrice: input.costPrice ?? null,
      stockQuantity: input.stockQuantity ?? null,
      reorderLevel: input.reorderLevel ?? null,
      active: input.active === undefined ? null : input.active ? 1 : 0,
    });

  const existingProduct = db.prepare(`
  SELECT stock_quantity
  FROM products
  WHERE id = ?
`).get(req.params.id) as
  | { stock_quantity: number }
  | undefined;

if (!existingProduct) {
  throw new Error("Product not found");
}

const quantityDifference =
  Number(req.body.stockQuantity) -
  Number(existingProduct.stock_quantity);
    
  if (quantityDifference !== 0) {
    db.prepare(
      `
    INSERT INTO stock_movements (
      product_id,
      user_id,
      type,
      quantity,
      note
    )
    VALUES (?, ?, ?, ?, ?)
  `,
    ).run(
      req.params.id,
      req.user?.id ?? null,
      quantityDifference > 0 ? "RESTOCK" : "ADJUSTMENT",
      quantityDifference,
      "Manual stock update",
    );
  }

  if (result.changes === 0) {
    res.status(404).json({ message: "Product not found." });
    return;
  }

  audit(req.user?.id, "UPDATE", "products", id, input);
  res.json({ id });
});

export const deleteProduct = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const transactionCount = db
    .prepare(
      "SELECT COUNT(*) as count FROM transaction_items WHERE product_id = ?",
    )
    .get(id) as { count: number };

  const result =
    transactionCount.count > 0
      ? db.prepare("UPDATE products SET active = 0 WHERE id = ?").run(id)
      : db.prepare("DELETE FROM products WHERE id = ?").run(id);

  if (result.changes === 0) {
    res.status(404).json({ message: "Product not found." });
    return;
  }

  audit(req.user?.id, "DELETE_OR_ARCHIVE", "products", id);
  res.status(204).send();
});

export const inventoryAlerts = asyncHandler((_req, res) => {
  const lowStock = db
    .prepare(
      `
    SELECT id, name, barcode, stock_quantity as stockQuantity, reorder_level as reorderLevel
    FROM products
    WHERE active = 1 AND stock_quantity <= reorder_level
    ORDER BY stock_quantity ASC, name ASC
  `,
    )
    .all();

  const outOfStock = db
    .prepare(
      `
    SELECT id, name, barcode
    FROM products
    WHERE active = 1 AND stock_quantity = 0
    ORDER BY name ASC
  `,
    )
    .all();

  res.json({ lowStock, outOfStock });
});

export const productMovements = asyncHandler((req, res) => {
  const productId = Number(req.params.id);

  const movements = db.prepare(`
    SELECT32
      sm.*,
      u.name as userName
    FROM stock_movements sm
    LEFT JOIN users u ON u.id = sm.user_id
    WHERE sm.product_id = ?
    ORDER BY sm.created_at DESC
  `).all(productId);

  res.json({ movements });
});

export const toggleFavorite = asyncHandler(
  (req, res) => {
    const id = Number(req.params.id);

    const product = db.prepare(`
      SELECT is_favorite
      FROM products
      WHERE id = ?
    `).get(id) as any;

    const nextValue =
      product.is_favorite ? 0 : 1;

    db.prepare(`
      UPDATE products
      SET is_favorite = ?
      WHERE id = ?
    `).run(nextValue, id);

    res.json({
      success: true,
      isFavorite: nextValue,
    });
  },
);