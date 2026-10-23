import Together from "together-ai";

// Tofu: changed. The client is created on first use instead of when this
// module loads: the SDK throws without a key, which could stop the app from
// building or answering before the owner adds TOGETHER_API_KEY. The key is read
// here, on the server only; it has no NEXT_PUBLIC_ prefix, so it never reaches
// the browser.
export class MissingTogetherApiKeyError extends Error {
  constructor() {
    super("TOGETHER_API_KEY is not set");
    this.name = "MissingTogetherApiKeyError";
  }
}

let togetherBaseClient: Together | undefined;

export function getTogetherClient() {
  const apiKey = process.env.TOGETHER_API_KEY?.trim();
  if (!apiKey) {
    throw new MissingTogetherApiKeyError();
  }

  togetherBaseClient ??= new Together({ apiKey });
  return togetherBaseClient;
}
