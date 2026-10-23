import { scrapeBill } from "../../../lib/scrapeBill";
import { MissingTogetherApiKeyError } from "../../../lib/clients";
import { receiptUrlMatchesKey } from "../../../lib/image-upload";
import { removeReceiptObject } from "../../../lib/s3-receipt-storage";

// Tofu: shown in the app while the owner has not added their Together AI key.
const MISSING_TOGETHER_API_KEY_MESSAGE =
  "Receipt scanning isn't set up yet. If this is your app, add your Together AI API key as the hidden value TOGETHER_API_KEY in Tofu's Keys & settings, then deploy again. Until then, go back and choose Enter Manually.";

export async function POST(req: Request) {
  const { billUrl, billKey } = await req.json();

  const start = new Date();
  try {
    const output = await scrapeBill({
      billUrl,
    });
    const endJson = new Date();

    console.log(
      "Time it took to generate Bill JSON: ",
      (endJson.getTime() - start.getTime()) / 1000,
    );

    return Response.json(output);
  } catch (error) {
    // Tofu: a missing key gets a plain answer instead of a server error.
    if (error instanceof MissingTogetherApiKeyError) {
      console.error("TOGETHER_API_KEY is not set, so receipts cannot be read");
      return Response.json(
        { error: MISSING_TOGETHER_API_KEY_MESSAGE },
        { status: 503 },
      );
    }
    throw error;
  } finally {
    if (
      receiptUrlMatchesKey(billUrl, billKey, {
        bucket: process.env.S3_UPLOAD_BUCKET,
        region: process.env.S3_UPLOAD_REGION,
      })
    ) {
      try {
        await removeReceiptObject(billKey);
      } catch {
        console.warn("Failed to remove processed receipt upload");
      }
    }
  }
}
