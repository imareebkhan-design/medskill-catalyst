import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", quiet: true });

async function main() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  console.log("Checking Razorpay Env Variables in .env.local:");
  console.log("RAZORPAY_KEY_ID exists:", !!keyId);
  console.log("RAZORPAY_KEY_ID value:", keyId ? `${keyId.slice(0, 8)}...` : "undefined");
  console.log("RAZORPAY_KEY_SECRET exists:", !!keySecret);
  console.log("RAZORPAY_KEY_SECRET value:", keySecret ? `${keySecret.slice(0, 4)}...` : "undefined");

  if (!keyId || !keySecret) {
    console.error("Error: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing.");
    return;
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  console.log("\nAttempting direct fetch to Razorpay Orders API...");
  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 100, // 100 paise = ₹1
        currency: "INR",
        receipt: "test_receipt_123",
        payment_capture: 1,
      }),
    });

    console.log("Response status:", res.status);
    const bodyText = await res.text();
    console.log("Response body:");
    try {
      console.log(JSON.stringify(JSON.parse(bodyText), null, 2));
    } catch {
      console.log(bodyText);
    }
  } catch (err) {
    console.error("Fetch Exception occurred:");
    console.error(err);
  }
}

main();
