export default async function handler(req: any, res: any) {
  try {
    const { default: app } = await import("../server");
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel API entrypoint error during import:", err);
    res.status(500).json({
      error: "Vercel API entrypoint crash during import",
      message: err.message || String(err),
      stack: err.stack,
    });
  }
}

