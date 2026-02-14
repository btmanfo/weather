const { createApp } = require("./app");
const { initDb } = require("./db/database");

async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  try {
    await initDb();
    const app = createApp();
    app.listen(port, () => {
      console.log(`Weather app listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize app:", error);
    process.exit(1);
  }
}

module.exports = { startServer };
