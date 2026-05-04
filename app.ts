import express, { Application, Request, Response } from "express";
import { db } from "./db";
import { itemsTable, Item, NewItem } from "./db/schema";
import { eq, inArray } from "drizzle-orm";
import cors from "cors";
import dotenv from "dotenv";

const app: Application = express();
dotenv.config();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ramadan-bags.vercel.app",
      "https://ramadan-bags.pages.dev",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable caching to prevent stale data after delete
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.setHeader("Pragma", "no-cache");
  next();
});

// Helper: convert frontend _id (string) to database id (number)
const toNumberId = (id: string | number): number => {
  return typeof id === "string" ? parseInt(id, 10) : id;
};

// Helper: ensure an incoming item has all required fields with defaults
const sanitizeNewItem = (item: any): NewItem => ({
  name: item.name ?? "",
  total: item.total ?? 0,
  unit: item.unit ?? "",
  available: item.available ?? 0,
});

// Helper: ensure update data has all required fields (for PUT)
const sanitizeUpdateItem = (item: any): Omit<Item, "id"> => ({
  name: item.name ?? "",
  total: item.total ?? 0,
  unit: item.unit ?? "",
  available: item.available ?? 0,
});

// Helper: convert DB row (with numeric id) to frontend format (string _id)
const toFrontendItem = (item: Item) => ({
  ...item,
  _id: String(item.id),
});

app.get("/", async (req: Request, res: Response) => {
  res.status(200).send("ok");
});

app.post("/login", async (req: Request, res: Response) => {
  try {
    if (req.body.pw === process.env.AdminPw) {
      res.status(200).json({ user: "admin" });
    } else {
      res.status(401).json();
    }
  } catch {
    res.status(500).json();
  }
});

app.get("/items", async (req: Request, res: Response) => {
  try {
    const items = await db.select().from(itemsTable);
    res.status(200).json({ items: items.map(toFrontendItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json();
  }
});

// POST /items – handles both single object and array, fills missing fields
app.post("/items", async (req: Request, res: Response) => {
  try {
    let rawItems: any[] = [];
    if (Array.isArray(req.body)) {
      rawItems = req.body;
    } else {
      rawItems = [req.body];
    }

    if (rawItems.length === 0) {
      res.status(400).json({ error: "No items to insert" });
      return;
    }

    const cleanItems = rawItems.map((item) => {
      const { _id, ...rest } = item;
      return sanitizeNewItem(rest);
    });

    await db.insert(itemsTable).values(cleanItems);
    const allItems = await db.select().from(itemsTable);
    res.status(201).json({ items: allItems.map(toFrontendItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json();
  }
});

// PUT /items – bulk update (no transaction because neon-http doesn't support them)
app.put("/items", async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    if (!Array.isArray(updates)) {
      res.status(400).json({ error: "Expected array of items" });
      return;
    }

    // Execute each update sequentially (no transaction → simple and works)
    // Not the best approach for large datasets, but it works for now
    for (const item of updates) {
      const idNum = toNumberId(item._id);
      const { _id, ...updateData } = item;
      const finalUpdate = sanitizeUpdateItem(updateData);
      await db
        .update(itemsTable)
        .set(finalUpdate)
        .where(eq(itemsTable.id, idNum));
    }

    const allItems = await db.select().from(itemsTable);
    res.status(200).json({ items: allItems.map(toFrontendItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json();
  }
});

// DELETE /items – accepts array of string _ids or a single string
app.delete("/items", async (req: Request, res: Response) => {
  try {
    let ids = req.body;
    if (!Array.isArray(ids)) {
      ids = [ids];
    }
    const numericIds = ids.map((id: string | number) => toNumberId(id));
    await db.delete(itemsTable).where(inArray(itemsTable.id, numericIds));

    const allItems = await db.select().from(itemsTable);
    res.status(200).json({ items: allItems.map(toFrontendItem) });
  } catch (err) {
    console.error(err);
    res.status(500).json();
  }
});

app.listen(3005, () => console.log(`Server running on port 3005`));
