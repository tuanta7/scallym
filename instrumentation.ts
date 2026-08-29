/** Connect to Mongo once at server start so an unreachable database is reported
 *  immediately, not on the first analysis 60 seconds in. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { analyses } = await import("@/lib/mongo");
  try {
    await analyses();
    console.log("[scallym] connected to MongoDB");
  } catch (e) {
    console.error(
      `[scallym] MongoDB is unreachable: ${e instanceof Error ? e.message : e}`,
    );
  }
}
