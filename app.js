const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173","https://ramadan-bags.vercel.app"],
    credentials: true,
    optionSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

const itemSchema = new mongoose.Schema({
  name: String,
  total: String,
  unit: String,
  available: String,
});
const Item = mongoose.model("Item", itemSchema);

app.post("/login", async (req, res) => {
  try {
    if (req.body.pw == process.env.AdminPw) {
      return res.send({ status: "ok", user: "admin" });
    } else {
      return res.send({ status: "error" });
    }
  } catch {
    res.status(500).send({ status: "error", message: err.message });
  }
});

app.get("/items", async (req, res) => {
  try {
    const items = await Item.find();
    res.send({ status: "ok", items: items });
  } catch (err) {
    res.status(500).send({ status: "error", message: err.message });
  }
});

app.post("/items", async (req, res) => {
  try {
    await Item.insertMany(req.body);
    const allItems = await Item.find();
    res.status(201).send({ status: "ok", items: allItems });
  } catch (err) {
    res.status(500).send({ status: "error", message: err.message });
  }
});

app.put("/items", async (req, res) => {
  try {
    const bulkOps = req.body.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: item },
      },
    }));
    await Item.bulkWrite(bulkOps);
    const allItems = await Item.find();
    res.send({ status: "ok", items: allItems });
  } catch (err) {
    res.status(500).send({ status: "error", message: err.message });
  }
});

app.delete("/items", async (req, res) => {
  try {
    const bulkOps = req.body.map((id) => ({
      deleteOne: {
        filter: { _id: id },
      },
    }));
    await Item.bulkWrite(bulkOps);
    const allItems = await Item.find();
    res.send({ status: "ok", items: allItems });
  } catch (err) {
    res.status(500).send({ status: "error", message: err.message });
  }
});

app.listen(3005, () => console.log(`Server running on port 3005`));
