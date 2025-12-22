// controllers/webhookController.js
import Stripe from "stripe";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import {
  sendClientOrderEmail,
  sendAdminOrderEmail,
} from "../services/email.service.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

/* ===========================
   STRIPE WEBHOOK
=========================== */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // ⚠️ BODY DOIT ÊTRE RAW
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.payment_status === "paid") {
      await fulfillOrder(session);
    }
  }

  res.json({ received: true });
};

/* ===========================
   CRÉATION COMMANDE
=========================== */
async function fulfillOrder(session) {
  try {
    console.log("🟢 Paiement Stripe confirmé :", session.id);

    // 🔒 Éviter doublons
    const existingOrder = await prisma.order.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (existingOrder) {
      console.log("⚠️ Commande déjà enregistrée :", existingOrder.id);
      return;
    }

    const userId = session.metadata?.userId
      ? Number(session.metadata.userId)
      : null;

    const customerEmail = session.customer_email;
    const customerName = session.customer_details?.name || "Client";

    const totalAmount = session.amount_total / 100;

    // 🔄 Line items Stripe
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    // 📦 Suivi
    const trackingCode = "TS-" + Date.now();
    const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    // 🧾 Création commande
    const order = await prisma.order.create({
      data: {
        userId,
        customerName,
        customerEmail,
        totalAmount,
        trackingCode,
        estimatedDelivery,
        paymentMethod: "stripe",
        paymentStatus: "paid",
        stripeSessionId: session.id,
        orderItems: {
          create: lineItems.data.map((item) => ({
            productName: item.description,
            quantity: item.quantity,
            price: item.amount_total / item.quantity / 100,
          })),
        },
      },
    });

    console.log("✅ Commande enregistrée :", order.id);

    /* ===========================
       EMAILS
    =========================== */

    // 📩 Client
    if (customerEmail) {
      await sendClientOrderEmail({
        to: customerEmail,
        name: customerName,
        orderId: order.id,
        total: order.totalAmount,
      });
    }

    // 📬 Admin
    await sendAdminOrderEmail({
      orderId: order.id,
      total: order.totalAmount,
      customerName,
      customerEmail,
    });
  } catch (err) {
    console.error("❌ Erreur fulfillOrder Stripe :", err);
  }
}
