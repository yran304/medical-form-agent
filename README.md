# Medical Form AI Agent

An LLM-driven browser automation agent. It uses Gemini (via the Vercel AI SDK) to drive
Playwright through a real multi-section web form — reading the page, deciding what to do next,
and calling tools to fill fields, open collapsed sections, select dropdown options, scroll, and
submit — without any hardcoded per-field selectors.

The target form is a sample multi-section healthcare intake form
(https://magical-medical-form.netlify.app/) with three sections: Personal Information, Medical
Information, and Emergency Contact.

## Features

- **Agentic loop**: the model inspects the page, decides the next action, and calls one of five
  browser tools (`inspectPage`, `fillField`, `clickButton`, `selectOption`, `scrollPage`) until
  the form is submitted and the result is verified.
- **Handles dynamic UI**: opens collapsed sections, fills text/date fields, and selects dropdown
  values based on what the model actually observes on the page.
- **Runs three ways**: as a one-off script, behind a local HTTP API, or on a recurring schedule.
- **Dynamic input**: first and last name can be overridden per run via the API; all other patient
  fields default to the values in `src/workflow.ts`.

## Setup

### Requirements

- Node.js 20+

### Install

```bash
npm install
npx playwright install
```

### Configure

Create a `.env` file with your Gemini API key (get one from
[Google AI Studio](https://aistudio.google.com/apikey)):

```bash
cp .env.example .env
```

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
```

### Typecheck

```bash
npm run typecheck
```

## Running it

### As a script

```bash
npm run dev
```

Opens Chromium, completes all three sections of the medical form using the default patient data,
submits it, prints the agent's result, and closes the browser.

### As an API

```bash
npm run api
```

The server listens at `http://localhost:3001`.

```bash
curl http://localhost:3001/health
```

```bash
curl -X POST http://localhost:3001/run
```

With dynamic first/last name:

```bash
curl -X POST http://localhost:3001/run \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Alice","lastName":"Smith"}'
```

Only `firstName` and `lastName` are overridden by the request; the rest of the patient data comes
from the defaults in `src/workflow.ts`.

### On a schedule

```bash
npm run schedule
```

Runs the workflow immediately, then every five minutes. Keep the process running; `Ctrl+C` to
stop it.

## How it works

- `src/session.ts` launches a visible Chromium instance and navigates to the target form.
- `src/workflow.ts` defines the patient data shape, default values, and the prompt describing the
  SOP the agent should follow.
- `src/browser-tools.ts` exposes the five tools the model can call, each bound to the current
  Playwright `Page`.
- `src/main.ts` wires it together: starts the session, lazily loads the AI SDK and tools, and
  drives the loop with `generateText` (capped at 20 tool calls).
- `src/server.ts` and `src/scheduler.ts` wrap `runWorkflow` for the API and scheduled entry
  points, each with simple in-process concurrency guards against overlapping runs.

## Notes and troubleshooting

- Never commit the `.env` file — it holds a real API key.
- The first run is slower while Node loads Playwright and the AI SDK; later API or scheduled runs
  reuse the already-running process.
- If port `3001` is in use, stop whatever is holding it or change `port` in `src/server.ts` (and
  update the `curl` examples to match):

  ```bash
  lsof -nP -iTCP:3001 -sTCP:LISTEN
  ```

- The agent is capped at 20 tool calls (`stepCountIs(20)` in `src/main.ts`). That's enough for
  this form; raise it only if a larger form genuinely needs more steps.
