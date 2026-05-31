import { z } from 'zod';
import { db } from '../database/connection.js';
import { audit } from '../utils/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const categorySchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional().nullable()
});

export const listCategories = asyncHandler((_req, res) => {
  const categories = db.prepare(`
    SELECT id, name, description, created_at, updated_at
    FROM categories
    ORDER BY name ASC
  `).all();

  res.json({ categories });
});

export const createCategory = asyncHandler((req, res) => {
  const input = categorySchema.parse(req.body);
  const result = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(input.name, input.description ?? null);
  const id = Number(result.lastInsertRowid);
  audit(req.user?.id, 'CREATE', 'categories', id, input);
  res.status(201).json({ id });
});

export const updateCategory = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const input = categorySchema.partial().parse(req.body);
  const result = db.prepare(`
    UPDATE categories
    SET name = COALESCE(@name, name),
        description = COALESCE(@description, description)
    WHERE id = @id
  `).run({ id, name: input.name ?? null, description: input.description ?? null });

  if (result.changes === 0) {
    res.status(404).json({ message: 'Category not found.' });
    return;
  }

  audit(req.user?.id, 'UPDATE', 'categories', id, input);
  res.json({ id });
});

export const deleteCategory = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  db.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?').run(id);
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);

  if (result.changes === 0) {
    res.status(404).json({ message: 'Category not found.' });
    return;
  }

  audit(req.user?.id, 'DELETE', 'categories', id);
  res.status(204).send();
});
