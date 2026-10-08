import "dotenv-defaults/config";
import { patient } from "./workflow";

const intervalMs = 5 * 60 * 1000;
let workflowIsRunning = false;

async function runScheduledWorkflow() {
  if (workflowIsRunning) {
    console.log("[scheduler] Skipping run: a workflow is already running.");
    return;
  }

  workflowIsRunning = true;

  try {
    console.log("[scheduler] Starting scheduled workflow...");

    const { runWorkflow } = await import("./main");
    await runWorkflow(patient);

    console.log("[scheduler] Scheduled workflow finished.");
  } catch (error) {
    console.log(
      "[scheduler] Scheduled workflow failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  } finally {
    workflowIsRunning = false;
  }
}

console.log("[scheduler] Running immediately, then every 5 minutes.");

void runScheduledWorkflow();

setInterval(() => {
  void runScheduledWorkflow();
}, intervalMs);