// server.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.post("/upload", (req, res) => {
  res.json({ message: "File uploaded successfully" });
});

app.get("/download", (req, res) => {
  res.json({ message: "Download started" });
});

app.get("/history", (req, res) => {
  res.json({ history: ["Build1.apk", "Build2.apk"] });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
