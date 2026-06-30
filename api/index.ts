export default async function handler(req: any, res: any) {
  try {
    // @ts-ignore
    const { default: app } = await import("../dist/server.cjs");
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel API entrypoint error during handling:", err);
    res.setHeader("Content-Type", "text/plain");
    res.status(500).send(`Vercel API entrypoint crash during handling:
Error Message: ${err.message || String(err)}
Stack Trace: ${err.stack || "No stack trace available"}`);
  }
}

