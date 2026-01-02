import Stripe from "stripe";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import paypalClient from "../lib/paypal.js";
import paypal from "@paypal/checkout-server-sdk";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

// 🌍 URL DU SITE (Render / Prod)
const BASE_URL = process.env.BASE_URL;

/* =====================================================
   AFFICHAGE ACHAT IMMÉDIAT
===================================================== */
export const checkoutSingle = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.render("error", { message: "Produit manquant." });
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return res.render("error", { message: "Produit introuvable." });
    }

    res.render("checkout/checkout-single", { product });
  } catch (error) {
    console.error("checkoutSingle ERROR:", error);
    res.render("error", { message: "Erreur interne." });
  }
};

/* =====================================================
   STRIPE — ACHAT IMMÉDIAT
===================================================== */
export const checkoutSingleProduct = async (req, res) => {
  try {
    const {
      id,
      name,
      price,
      quantity,
      customerName,
      email,
      address,
      city,
      postalCode,
      country,
    } = req.body;

    if (!id || !name || !price || !customerName || !email) {
      return res.render("error", { message: "Champs manquants." });
    }

    const userId = req.session.user?.id || null;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name },
            unit_amount: Math.round(price * 100),
          },
          quantity: Number(quantity) || 1,
        },
      ],
      customer_email: email,
      success_url: `${BASE_URL}/checkout/success`,
      cancel_url: `${BASE_URL}/checkout/cancel`,
      metadata: {
        checkoutType: "single",
        productId: String(id),
        userId: userId ? String(userId) : "",
        customerName,
        address,
        city,
        postalCode,
        country,
      },
    });

    res.redirect(session.url);
  } catch (error) {
    console.error("Stripe Single ERROR:", error);
    res.render("error", { message: "Erreur Stripe." });
  }
};

/* =====================================================
   AFFICHAGE CHECKOUT PANIER
===================================================== */
export const checkoutCart = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;

    const cart = await prisma.cart.findFirst({
      where: { sessionId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.render("error", { message: "Votre panier est vide." });
    }

    const total = cart.items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0
    );

    res.render("checkout/cart", { cartItems: cart.items, total });
  } catch (error) {
    console.error("checkoutCart ERROR:", error);
    res.render("error", { message: "Erreur interne." });
  }
};

/* =====================================================
   STRIPE — PANIER
===================================================== */
export const createCheckoutSession = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;

    const cart = await prisma.cart.findFirst({
      where: { sessionId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.render("error", { message: "Panier vide." });
    }

    const items = cart.items.map((i) => ({
      price_data: {
        currency: "eur",
        product_data: { name: i.product.name },
        unit_amount: Math.round(i.product.price * 100),
      },
      quantity: i.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items,
      success_url: `${BASE_URL}/checkout/success`,
      cancel_url: `${BASE_URL}/checkout/cancel`,
      metadata: { checkoutType: "cart" },
    });

    res.redirect(session.url);
  } catch (error) {
    console.error("Stripe Cart ERROR:", error);
    res.render("error", { message: "Erreur Stripe." });
  }
};
/* =====================================================
   TRAITEMENT FORMULAIRE PANIER (CONFIRMATION)
===================================================== */
export const processCartCheckout = async (req, res) => {
  try {
    const { name, address, city, zip } = req.body;

    if (!name || !address || !city || !zip) {
      return res.render("error", {
        message: "Veuillez remplir tous les champs.",
      });
    }

    // Stocke les infos client en session pour les réutiliser au checkout
    req.session.checkoutCustomer = { name, address, city, zip };

    // Redirige vers la page panier ou confirmation (selon ton flow)
    return res.redirect("/checkout/checkout-cart");
  } catch (error) {
    console.error("processCartCheckout ERROR:", error);
    res.render("error", { message: "Erreur interne." });
  }
};

/* =====================================================
   PAYPAL — PANIER
===================================================== */
export const createPayPalOrder = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;

    const cart = await prisma.cart.findFirst({
      where: { sessionId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.render("error", { message: "Panier vide." });
    }

    const total = cart.items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0
    );

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");

    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: total.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "TrendyShop",
        user_action: "PAY_NOW",
        return_url: `${BASE_URL}/checkout/paypal-success`,
        cancel_url: `${BASE_URL}/checkout/paypal-cancel`,
      },
    });

    const order = await paypalClient.execute(request);
    const approveLink = order.result.links.find((l) => l.rel === "approve");

    res.redirect(approveLink.href);
  } catch (error) {
    console.error("PayPal Cart ERROR:", error);
    res.render("error", { message: "Erreur PayPal." });
  }
};

/* =====================================================
   PAYPAL — SUCCESS / CANCEL
===================================================== */
export const paypalSuccess = async (req, res) => {
  try {
    const { token } = req.query;

    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({});

    await paypalClient.execute(request);

    res.render("checkout/success", {
      message: "🎉 Paiement PayPal réussi !",
    });
  } catch (error) {
    console.error("PayPal Capture ERROR:", error);
    res.render("error", { message: "Erreur PayPal." });
  }
};

export const paypalCancel = (req, res) => {
  res.render("checkout/cancel", {
    message: "Paiement PayPal annulé.",
  });
};

/* =====================================================
   STRIPE SUCCESS / CANCEL
===================================================== */
export const paymentSuccess = (req, res) => {
  res.render("checkout/success", {
    message: "🎉 Merci pour votre achat !",
  });
};

export const paymentCancel = (req, res) => {
  res.render("checkout/cancel", {
    message: "⚠️ Paiement annulé.",
  });
};

/* =====================================================
   PAYPAL — START SINGLE (stocke productId en session puis redirige)
===================================================== */
export const paypalSingleStart = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.render("error", { message: "Produit manquant." });
    }

    // On stocke le produit dans la session pour pouvoir faire un GET ensuite
    req.session.paypalSingleProductId = Number(productId);

    // On redirige vers une route GET qui crée l'order PayPal et redirect vers PayPal
    return res.redirect("/checkout/paypal-single");
  } catch (error) {
    console.error("paypalSingleStart ERROR:", error);
    res.render("error", { message: "Erreur PayPal." });
  }
};

/* =====================================================
   PAYPAL — ACHAT IMMÉDIAT (SINGLE)
===================================================== */
export const createPayPalOrderSingle = async (req, res) => {
  try {
    // productId vient de la session (set par paypalSingleStart)
    const productId = req.session.paypalSingleProductId;

    if (!productId) {
      return res.render("error", { message: "Aucun produit sélectionné." });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");

    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: product.price.toFixed(2),
          },
          description: product.name,
        },
      ],
      application_context: {
        brand_name: "TrendyShop",
        user_action: "PAY_NOW",
        return_url: `${BASE_URL}/checkout/paypal-single-success`,
        cancel_url: `${BASE_URL}/checkout/paypal-single-cancel`,
      },
    });

    const order = await paypalClient.execute(request);
    const approveLink = order.result.links.find((l) => l.rel === "approve");

    res.redirect(approveLink.href);
  } catch (error) {
    console.error("PayPal Single ERROR:", error);
    res.render("error", { message: "Erreur PayPal." });
  }
};

export const paypalSingleSuccess = async (req, res) => {
  req.session.paypalSingleProductId = null;

  try {
    const { token } = req.query;

    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({});

    await paypalClient.execute(request);

    res.render("checkout/success", {
      message: "🎉 Paiement PayPal réussi !",
    });
  } catch (error) {
    console.error("PayPal Single Capture ERROR:", error);
    res.render("error", { message: "Erreur PayPal." });
  }
};

export const paypalSingleCancel = (req, res) => {
  req.session.paypalSingleProductId = null;

  res.render("checkout/cancel", {
    message: "⚠️ Paiement PayPal annulé.",
  });
};
