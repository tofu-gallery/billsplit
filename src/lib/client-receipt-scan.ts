import type { ExtractSchemaType } from "./scrapeBill";

// Tofu: added. Replaces the S3 upload in this copy: the receipt photo is shrunk
// in the browser and sent to /api/vision as a data URL, which scrapeBill
// already accepts, so no storage bucket or storage keys are needed. About three
// megapixels keeps receipt text readable and the request far below the 4.5 MB
// request limit of the hosting platform.
const MAX_RECEIPT_PIXELS = 2048 * 1536;
const MAX_RECEIPT_EDGE = 4096;
const RECEIPT_JPEG_QUALITY = 0.85;

const SCAN_FAILED_MESSAGE =
  "We couldn't read this receipt. Try again, or go back and choose Enter Manually.";

class ReceiptScanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReceiptScanError";
  }
}

export async function scanReceipt(file: File) {
  const billUrl = await readReceiptAsDataUrl(file);

  const response = await fetch("/api/vision", {
    method: "POST",
    body: JSON.stringify({
      billUrl,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new ReceiptScanError(await getErrorMessage(response));
  }

  return (await response.json()) as ExtractSchemaType;
}

// The words to show for a failed scan: the server's own message when it sent
// one (such as a missing TOGETHER_API_KEY), otherwise a general one.
export function getReceiptScanErrorMessage(error: unknown) {
  return error instanceof ReceiptScanError ? error.message : SCAN_FAILED_MESSAGE;
}

async function readReceiptAsDataUrl(file: File) {
  const image = await loadImage(file);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const scale = Math.min(
    1,
    Math.sqrt(MAX_RECEIPT_PIXELS / (width * height)),
    MAX_RECEIPT_EDGE / Math.max(width, height),
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available to prepare the receipt image");
  }

  // JPEG has no transparency, so a transparent PNG gets a white background.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", RECEIPT_JPEG_QUALITY);
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The receipt image could not be read"));
    };
    image.src = objectUrl;
  });
}

async function getErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : SCAN_FAILED_MESSAGE;
  } catch {
    return SCAN_FAILED_MESSAGE;
  }
}
