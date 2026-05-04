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

// ----------------------
// Routes (identical response shape)
// ----------------------

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

// GET /items – returns all items with _id alias (frontend expects _id)
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

// POST /items – insert multiple items (array of objects without id)
app.post("/items", async (req: Request, res: Response) => {
  try {
    const newItems: NewItem[] = req.body;
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

// PUT /items – bulk update (each item must have _id field)
app.put("/items", async (req: Request, res: Response) => {
  try {
    const updates = req.body as (Item & { _id: number })[];
    await db.transaction(async (tx) => {
      for (const item of updates) {
        await tx
          .update(itemsTable)
          .set({
            name: item.name,
            total: item.total,
            unit: item.unit,
            available: item.available,
          })
          .where(eq(itemsTable.id, item._id));
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

// DELETE /items – bulk delete (array of ids)
app.delete("/items", async (req: Request, res: Response) => {
  try {
    const ids: number[] = req.body;
    await db.delete(itemsTable).where(inArray(itemsTable.id, ids));
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
