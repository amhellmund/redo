import express from "express";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = parseInt(process.env["PORT"] ?? "3000", 10);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export { app };
