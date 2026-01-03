import checkoutNodeJssdk from "@paypal/checkout-server-sdk";

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();

if (!clientId || !clientSecret) {
  throw new Error(
    "PAYPAL_CLIENT_ID ou PAYPAL_CLIENT_SECRET manquant dans .env"
  );
}

const environment =
  mode === "live"
    ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
    : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);

const paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

export default paypalClient;
