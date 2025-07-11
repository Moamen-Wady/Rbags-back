import express, {Application, Request, Response } from "express";
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
      "https://rbags-back.vercel.app",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URI || "")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

interface IitemSchema extends Document {
  name: String;
  total: String;
  unit: String;
  available: String;
}
const itemSchema: Schema = new mongoose.Schema({
  name: String,
  total: String,
  unit: String,
  available: String,
});
const Item: Model<IitemSchema> = mongoose.model<IitemSchema>(
  "Item",
  itemSchema
);

app.post("/login", async (req: Request, res: Response) => {
  try {
    if (req.body.pw == process.env.AdminPw) {
      res.status(200).json({ user: "admin" });
      return;
    } else {
      res.status(401).json();
      return;
    }
  } catch (err) {
    res.status(500).json();
    return;
  }
});

app.get("/items", async (req: Request, res: Response) => {
  try {
    const items = await Item.find();
    res.status(200).send({ items: items });
    return;
  } catch (err) {
    res.status(500).json();
    return;
  }
});

app.post("/items", async (req: Request, res: Response) => {
  try {
    await Item.insertMany(req.body);
    const allItems = await Item.find();
    res.status(201).json({ items: allItems });
    return;
  } catch (err) {
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
    const allItems = await Item.find();
    res.status(200).json({ items: allItems });
    return;
  } catch (err) {
    res.status(500).json();
    return;
  }
});

app.delete("/items", async (req: Request, res: Response) => {
  try {
    const bulkOps = req.body.map((id: mongoose.Schema.Types.ObjectId) => ({
      deleteOne: {
        filter: { _id: id },
      },
    }));
    await Item.bulkWrite(bulkOps);
    const allItems = await Item.find();
    res.status(200).json({ status: "ok", items: allItems });
    return;
  } catch (err) {
    res.status(500).json();
    return;
  }
});

app.listen(3005, () => console.log(`Server running on port 3005`));
