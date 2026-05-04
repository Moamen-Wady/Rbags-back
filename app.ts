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

// Disable caching for all API responses (fix stale data on DELETE)
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.setHeader("Pragma", "no-cache");
  next();
});

// Helper: convert frontend _id (string) to number
const toNumberId = (id: string | number): number => {
  return typeof id === "string" ? parseInt(id, 10) : id;
};

// Helper: strip _id and ensure numeric id for updates
const sanitizeForUpdate = (item: any): Partial<Item> => {
  const { _id, ...rest } = item;
  return rest;
};

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
    const itemsWithId = items.map((item) => ({
      ...item,
      _id: item.id,
    }));
    res.status(200).json({ items: itemsWithId });
  } catch (err) {
    console.error(err);
    res.status(500).json();
  }
});

// POST /items - handles both single object and array
app.post("/items", async (req: Request, res: Response) => {
  try {
    let newItems: NewItem[] = [];

    if (Array.isArray(req.body)) {
      // Array of items
      newItems = req.body.map((item: any) => {
        const { _id, ...clean } = item; // remove any _id field
        return clean;
      });
    } else {
      // Single object
      const { _id, ...clean } = req.body;
      newItems = [clean];
    }

    if (newItems.length === 0) {
      res.status(400).json({ error: "No items to insert" });
      return;
    }

    await db.insert(itemsTable).values(newItems);
    const allItems = await db.select().from(itemsTable);
    const allWithId = allItems.map((item) => ({
      ...item,
      _id: item.id,
    }));
    res.status(201).json({ items: allWithId });
  } catch (err) {
    console.error(err);
    res.status(500).json();
  }
});

// PUT /items - bulk update (accepts _id as string or number)
app.put("/items", async (req: Request, res: Response) => {
  try {
    const updates = req.body; // array of items with _id field
    if (!Array.isArray(updates)) {
      res.status(400).json({ error: "Expected array of items" });
      return;
    }

    await db.transaction(async (tx) => {
      for (const item of updates) {
        const idNum = toNumberId(item._id);
        const updateData = sanitizeForUpdate(item);

        await tx
          .update(itemsTable)
          .set(updateData)
          .where(eq(itemsTable.id, idNum));
      }
    });

    const allItems = await db.select().from(itemsTable);
    const allWithId = allItems.map((item) => ({
      ...item,
      _id: item.id,
    }));
    res.status(200).json({ items: allWithId });
  } catch (err) {
    console.error(err);
    res.status(500).json();
  }
});

// DELETE /items - bulk delete (accepts array of _id strings or numbers)
app.delete("/items", async (req: Request, res: Response) => {
  try {
    let ids = req.body;
    if (!Array.isArray(ids)) {
      ids = [ids];
    }

    const numericIds = ids.map((id: string | number) => toNumberId(id));
    await db.delete(itemsTable).where(inArray(itemsTable.id, numericIds));

    const allItems = await db.select().from(itemsTable);
    const allWithId = allItems.map((item) => ({
      ...item,
      _id: item.id,
    }));
    res.status(200).json({ items: allWithId });
  } catch (err) {
    console.error(err);
    res.status(500).json();
  }
});

app.listen(3005, () => console.log(`Server running on port 3005`));
