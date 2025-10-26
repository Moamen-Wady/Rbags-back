import express, { Application, Request, Response } from "express";
import mongoose, { Schema, Document, Model } from "mongoose";
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
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!process.env.MDBUSER || !process.env.MDBPWD || !process.env.MDBDB) {
  throw new Error("MongoDB credentials are missing in environment variables");
}

mongoose
  .connect(
    `mongodb+srv://${process.env.MDBUSER}:${process.env.MDBPWD}@cluster0.iumas.mongodb.net/${process.env.MDBDB}?retryWrites=true&w=majority`
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

interface IitemSchema extends Document {
  name: string;
  total: string;
  unit: string;
  available: string;
}
const itemSchema: Schema = new mongoose.Schema({
  name: { type: String, required: true },
  total: { type: String, required: true },
  unit: { type: String, required: true },
  available: { type: String, required: true },
});
const Item: Model<IitemSchema> = mongoose.model<IitemSchema>(
  "Item",
  itemSchema
);

app.get("/", async (req: Request, res: Response) => {
  res.status(200).send("ok");
  return;
});

app.post("/login", async (req: Request, res: Response) => {
  try {
    if (req.body.pw == process.env.AdminPw) {
      res.status(200).json({ user: "admin" });
      return;
    } else {
      res.status(401).json();
      return;
    }
  } catch {
    res.status(500).json();
    return;
  }
});

app.get("/items", async (req: Request, res: Response) => {
  try {
    const items = await Item.find().lean();
    res.status(200).json({ items: items });
    return;
  } catch {
    res.status(500).json();
    return;
  }
});

app.post("/items", async (req: Request, res: Response) => {
  try {
    await Item.insertMany(req.body);
    const allItems = await Item.find().lean();
    res.status(201).json({ items: allItems });
    return;
  } catch {
    res.status(500).json();
    return;
  }
});

app.put("/items", async (req: Request, res: Response) => {
  try {
    const bulkOps = req.body.map((item: IitemSchema) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: item },
      },
    }));
    await Item.bulkWrite(bulkOps);
    const allItems = await Item.find().lean();
    res.status(200).json({ items: allItems });
    return;
  } catch {
    res.status(500).json();
    return;
  }
});

app.delete("/items", async (req: Request, res: Response) => {
  try {
    const bulkOps = req.body.map((id: string) => ({
      deleteOne: {
        filter: { _id: id },
      },
    }));
    await Item.bulkWrite(bulkOps);
    const allItems = await Item.find().lean();
    res.status(200).json({ items: allItems });
    return;
  } catch {
    res.status(500).json();
    return;
  }
});

app.listen(3005, () => console.log(`Server running on port 3005`));
