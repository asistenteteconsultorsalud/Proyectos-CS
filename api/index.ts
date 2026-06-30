let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      const { default: app } = await import("../server");
      cachedApp = app;
    }
    return cachedApp(req, res);
  } catch (err: any) {
    console.error("Vercel API entrypoint error during import:", err);
    res.setHeader("Content-Type", "text/plain");
    res.status(500).send(`Vercel API entrypoint crash during import:
Error Message: ${err.message || String(err)}
Stack Trace: ${err.stack || "No stack trace available"}`);
  }
}

