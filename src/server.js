import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getAllMembers, getMemberById, buildTree } from "./members.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "genealogia-sefardi" });
});

app.get("/api/members", (req, res) => {
  res.json(getAllMembers());
});

app.get("/api/members/:id", (req, res) => {
  const member = getMemberById(Number(req.params.id));
  if (!member) {
    return res.status(404).json({ error: "Miembro no encontrado" });
  }
  res.json(member);
});

app.get("/api/tree", (req, res) => {
  res.json(buildTree());
});

// Only start listening when run directly, so tests can import the app freely.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, HOST, () => {
    console.log(`Genealogía Sefardí escuchando en http://${HOST}:${PORT}`);
  });
}

export default app;
