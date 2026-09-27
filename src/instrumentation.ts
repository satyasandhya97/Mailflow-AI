export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureTaskScheduler } = await import(
      "@/server/services/task-scheduler.service"
    );
    ensureTaskScheduler();
  }
}
