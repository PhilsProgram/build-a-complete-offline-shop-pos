import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  inventoryAlerts,
  listProducts,
  updateProduct,
  productMovements,
  toggleFavorite,
} from "../controllers/productController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const productRoutes = Router();

productRoutes.use(authenticate);
productRoutes.get("/", listProducts);
productRoutes.get("/alerts", requireRole("ADMIN"), inventoryAlerts);
productRoutes.get("/:id", getProduct);
productRoutes.get("/:id/movements", productMovements);
productRoutes.post("/", requireRole("ADMIN"), createProduct);
productRoutes.put("/:id", requireRole("ADMIN"), updateProduct);
productRoutes.delete("/:id", requireRole("ADMIN"), deleteProduct);
productRoutes.patch("/:id/favorite", toggleFavorite);
