import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
}));

// Tofu: the client now comes from getTogetherClient, and the model call has no
// Braintrust tracing, so there are no trace events left to check.
vi.mock("./clients", () => ({
  getTogetherClient: () => ({
    chat: {
      completions: {
        create: mocks.create,
      },
    },
  }),
}));

import { DEFAULT_VISION_MODEL, scrapeBill } from "./scrapeBill";

describe("scrapeBill", () => {
  beforeEach(() => {
    mocks.create.mockReset();
  });

  it("uses the production vision model with a schema-constrained request", async () => {
    const billUrl = "data:image/jpeg;base64,cmVjZWlwdA==";
    const response = {
      businessName: "Example Restaurant",
      date: "2026-07-24",
      billItems: [{ name: "Lunch", price: 12.5 }],
      tax: 1.25,
      tip: null,
    };

    mocks.create.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(response) } }],
    });

    await expect(scrapeBill({ billUrl })).resolves.toEqual(response);
    expect(DEFAULT_VISION_MODEL).toBe("Qwen/Qwen3.5-9B");
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: DEFAULT_VISION_MODEL,
        reasoning: { enabled: false },
        response_format: expect.objectContaining({
          type: "json_schema",
          json_schema: expect.objectContaining({
            name: "receipt",
            schema: expect.any(Object),
          }),
        }),
        messages: [
          expect.objectContaining({
            content: expect.arrayContaining([
              {
                type: "image_url",
                image_url: { url: billUrl },
              },
            ]),
          }),
        ],
      }),
    );
  });

  it("passes provider errors through", async () => {
    const providerError = new Error("Provider failed");
    mocks.create.mockRejectedValue(providerError);

    await expect(
      scrapeBill({ billUrl: "data:image/jpeg;base64,cmVjZWlwdA==" }),
    ).rejects.toBe(providerError);
  });
});
