export default async function handler(req: any, res: any) {
  try {
    // @ts-ignore
    const serverModule = await import("../dist/server.cjs");
    let app = serverModule.default || serverModule;
    if (app && typeof app === "object" && "default" in app) {
      app = app.default;
    }
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel API entrypoint error during handling:", err);
    res.setHeader("Content-Type", "text/plain");
    res.status(500).send(`Vercel API entrypoint crash during handling:
Error Message: ${err.message || String(err)}
Stack Trace: ${err.stack || "No stack trace available"}`);
  }
}

