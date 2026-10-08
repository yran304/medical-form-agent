import { tool } from "ai";
import type { Page } from "playwright";
import { z } from "zod";

export function createBrowserTools(page: Page) {
  return {
    inspectPage: tool({
      description:
        "Inspect the current visible page. Use this before interacting to learn which fields, buttons, and section headings are available.",
      
      inputSchema: z.object({}),

      execute: async () => {
        const fields = await page
          .locator("input, textarea, select")
          .evaluateAll((elements) =>
            elements.map((element) => {
              const input = element as HTMLInputElement;
              const isSelect = element instanceof HTMLSelectElement;

              return {
                tag: input.tagName.toLowerCase(),
                type: input.type,
                name: input.name,
                placeholder: input.placeholder,
                required: input.required,
                value: input.value,
                options: isSelect 
                  ? Array.from(element.options).map((option) => ({
                    label: option.text,
                    value: option.value,
                  }))
                  : undefined,
              };
            }),
          );
        return {
          url: page.url(),
          visibleText: (await page.locator("body").innerText()).slice(0, 4000),
          fields,
          buttons: await page.getByRole("button").allTextContents(),
        };
      },

    }),

    fillField: tool({
      description:
        "Fill one visible text or date field. Use the exact field label found by inspectPage.",
      
      inputSchema: z.object({
        label: z.string().min(1),
        value: z.string(),
      }),

      execute: async ({ label, value }) => {
        try {
          const field = page.getByLabel(label, { exact: true });

          await field.waitFor({ state: "visible", timeout: 5000 });
          await field.fill(value);

          return {
            success: true,
            label,
            value: await field.inputValue(),
          };
        } catch (error) {
          return {
            success: false,
            label,
            error: error instanceof Error ? error.message : "Unknown error",
          };

        }
      },
    }),

    clickButton: tool({
      description:
        "Click a visible button using its exact accessible name. Use this for section headings or the Submit button.",
      
      inputSchema: z.object({
        name: z.string().min(1),
      }),

      execute: async ({ name }) => {
        try {
          const button = page.getByRole("button", {
            name,
            exact: true,
          });

          await button.waitFor({ state: "visible", timeout: 5000 });
          await button.click();

          return {
            success: true,
            name,
          };
        } catch (error) {
          return {
            success: false,
            name,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

    selectOption: tool({
      description:
        "Select an option from a visible dropdown. Use the exact field lable and an option discovered by inspectPage.",

      inputSchema: z.object({
        label: z.string().min(1),
        option: z.string().min(1),
      }),

      execute: async ({ label, option }) => {
        try {
          const select = page.getByLabel(label, { exact: true });

          await select.waitFor({ state: "visible", timeout: 5000 });
          await select.selectOption({ label: option });
          
          return {
            success: true,
            label,
            selectedValue: await select.inputValue(),
          };
        } catch (error) {
          return {
            success: false,
            label,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

    scrollPage: tool({
      description:
        "Scroll the current page up or down when content or controls are not visible.",

      inputSchema: z.object({
        direction: z.enum(["up", "down"]),
      }),

      execute: async ({ direction }) => {
        try {
          const distance = direction === "down" ? 600 : -600;

          await page.mouse.wheel(0, distance);

          return {
            success: true,
            direction,
            scrollY: await page.evaluate(() => window.scrollY),
          };
        } catch (error) {
          return {
            success: false,
            direction,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

  };
}