import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const itemsTable = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  total: integer("total").notNull(),
  unit: text("unit").notNull(),
  available: integer("available").notNull(),
});

export type Item = typeof itemsTable.$inferSelect;
export type NewItem = typeof itemsTable.$inferInsert;
