const express = require("express");
const cors = require("cors");
const auditRouter = require("./routes/audit");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", auditRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Page Pulse API running on port ${PORT}`);
  });
}

module.exports = app;
