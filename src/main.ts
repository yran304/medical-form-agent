import { model } from "./_internal/setup";
import { createSession } from "./session";
import { patient, type PatientData, workflowPrompt } from "./workflow";

export async function runWorkflow(patientData: PatientData) {
	// This will automatically create a chromium instance, connect, and navigate to the given url.
	// You are given a playwright page back.  
  console.log("Opening medical form...");
  
  const page = await createSession(
    "https://magical-medical-form.netlify.app/"
  );

  console.log("Medical form opened.");

  const browser = page.context().browser();
  if (!browser) {
    throw new Error("Browser was not available");
  }

  try {
    console.log("Loading AI agent...");

    const [{ generateText, stepCountIs }, { createBrowserTools }] =
      await Promise.all([
        import("ai"),
        import("./browser-tools"),
      ]);
    
    const tools = createBrowserTools(page);

    console.log("Starting medical-form agent...");
    // We've given you an model (gemini-3.5-flash), you can use the vercel AI SDK to generate text, setup tools, etc.
    // Ensure you have set the GOOGLE_GENERATIVE_AI_API_KEY environment variable.
    const response = await generateText({
      model,
      tools,
      stopWhen: stepCountIs(20),
      prompt: `${workflowPrompt}

Patient data:
${JSON.stringify(patientData, null, 2)}`,
    });

    console.log(response.text);
    console.log("Agent finished.");
    return response.text;
  } finally {
    await browser.close();
  }
}

export async function main() {
  await runWorkflow(patient);
}