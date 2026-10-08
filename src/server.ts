import "dotenv-defaults/config";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "http";
import { patient, type PatientData } from "./workflow";

const port = 3001;
let workflowIsRunning = false;

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  response.end(JSON.stringify(body));
}

function readJsonBody(
  request: IncomingMessage,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "POST" && request.url === "/run") {
    let requestBody: Record<string, unknown>;

    try {
      requestBody = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, {
        success: false,
        error: error instanceof Error ? error.message : "Invalid request body.",
      });
      return;
    }

    const { firstName, lastName } = requestBody;

    if ( 
      (firstName !== undefined && (typeof firstName !== "string" || !firstName.trim())) ||
      (lastName !== undefined && (typeof lastName !== "string" || !lastName.trim()))
    ) {
      sendJson(response, 400, {
        success: false,
        error: "firstName and lastName must be non-empty strings.",
      });
      return;
    }
    
    if (workflowIsRunning) {
      sendJson(response, 409, {
        success: false,
        error: "A workflow is already running.",
      });
      return;
    }

    const patientData: PatientData = {
      ...patient,
      ...(typeof firstName === "string" ? { firstName } : {}),
      ...(typeof lastName === "string" ? { lastName } : {}),
    };

    workflowIsRunning = true;

    try {
      const { runWorkflow } = await import("./main");
      const summary = await runWorkflow(patientData);

      sendJson(response, 200, {
        success: true,
        summary,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      workflowIsRunning = false;
    }

    return;
  }

  sendJson(response, 404, { error: "Route not found" });
});

server.listen(port, () => {
  console.log(`Workflow API listening at http://localhost:${port}`);
});