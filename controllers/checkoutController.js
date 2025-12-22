import Stripe from "stripe";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import paypalClient from "../lib/paypal.js";
import paypal from "@paypal/checkout-server-sdk";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

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
   TRAITEMENT FORMULAIRE ACHAT IMMÉDIAT (STRIPE)
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

    if (
      !id ||
      !name ||
      !price ||
      !customerName ||
      !email ||
      !address ||
      !city ||
      !postalCode ||
      !country
    ) {
      return res.render("error", { message: "Champs manquants." });
    }

    const userId = req.session.user?.id || null;

    const lineItem = {
      price_data: {
        currency: "eur",
        product_data: { name },
        unit_amount: Math.round(parseFloat(price) * 100),
      },
      quantity: Number(quantity) || 1,
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [lineItem],
      customer_email: email,
      success_url: "http://localhost:3007/checkout/success",
      cancel_url: "http://localhost:3007/checkout/cancel",
      metadata: {
        userId: userId ? String(userId) : "",
        checkoutType: "single",
        productId: String(id),
        customerName,
        address,
        city,
        postalCode,
        country,
      },
    });

    res.redirect(session.url);
  } catch (error) {
    console.error("checkoutSingleProduct ERROR:", error);
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

    res.render("checkout/cart", {
      cartItems: cart.items,
      total,
    });
  } catch (error) {
    console.error("checkoutCart ERROR:", error);
    res.render("error", { message: "Erreur interne." });
  }
};

/* =====================================================
   TRAITEMENT FORMULAIRE PANIER
===================================================== */
export const processCartCheckout = async (req, res) => {
  try {
    const { name, address, city, zip } = req.body;

    if (!name || !address || !city || !zip) {
      return res.render("error", {
        message: "Veuillez remplir tous les champs.",
      });
    }

    req.session.checkoutCustomer = { name, address, city, zip };

    const sessionId = req.cookies.sessionId;

    const cart = await prisma.cart.findFirst({
      where: { sessionId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.render("error", { message: "Panier vide." });
    }

    const totalAmount = cart.items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0
    );

    res.render("checkout/confirm", {
      cartItems: cart.items,
      totalAmount,
      customer: req.session.checkoutCustomer,
    });
  } catch (error) {
    console.error("processCartCheckout ERROR:", error);
    res.render("error", { message: "Erreur interne." });
  }
};

/* =====================================================
   CRÉATION SESSION STRIPE (PANIER + SINGLE)
===================================================== */
export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.session.user?.id || null;
    let items = [];

    if (req.session.singleProduct) {
      const p = req.session.singleProduct;
      items.push({
        price_data: {
          currency: "eur",
          product_data: { name: p.name },
          unit_amount: Math.round(p.price * 100),
        },
        quantity: p.quantity,
      });
    } else {
      const sessionId = req.cookies.sessionId;

      const cart = await prisma.cart.findFirst({
        where: { sessionId },
        include: { items: { include: { product: true } } },
      });

      if (!cart || cart.items.length === 0) {
        return res.render("error", { message: "Panier vide." });
      }

      cart.items.forEach((i) => {
        items.push({
          price_data: {
            currency: "eur",
            product_data: { name: i.product.name },
            unit_amount: Math.round(i.product.price * 100),
          },
          quantity: i.quantity,
        });
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items,
      success_url: "http://localhost:3007/checkout/success",
      cancel_url: "http://localhost:3007/checkout/cancel",
      metadata: {
        userId: userId ? String(userId) : "",
        checkoutType: req.session.singleProduct ? "single" : "cart",
      },
    });

    res.redirect(session.url);
  } catch (error) {
    console.error("Stripe ERROR:", error);
    res.render("error", { message: "Erreur Stripe." });
  }
};

/* =====================================================
   PAYPAL — PANIER
===================================================== */
export const createPayPalOrder = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    const userId = req.session.user?.id || null;

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
          custom_id: userId ? String(userId) : "guest",
        },
      ],
      application_context: {
        brand_name: "TrendyShop",
        user_action: "PAY_NOW",
        return_url: "http://localhost:3007/checkout/paypal-success",
        cancel_url: "http://localhost:3007/checkout/paypal-cancel",
      },
    });

    const order = await paypalClient.execute(request);
    const approveLink = order.result.links.find((l) => l.rel === "approve");

    res.redirect(approveLink.href);
  } catch (error) {
    console.error("PayPal ERROR:", error);
    res.render("error", { message: "Erreur PayPal." });
  }
};

/* =====================================================
   PAYPAL — PANIER SUCCESS / CANCEL
===================================================== */
export const paypalSuccess = async (req, res) => {
  try {
    const { token } = req.query;

    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({});

    await paypalClient.execute(request);

    const sessionId = req.cookies.sessionId;
    await prisma.cartItem.deleteMany({
      where: { cart: { sessionId } },
    });

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
   PAYPAL — ACHAT IMMÉDIAT
===================================================== */
export const paypalSingleStart = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return res.render("error", { message: "Produit introuvable." });
    }

    req.session.singleProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    };

    res.redirect("/checkout/paypal-single");
  } catch (error) {
    console.error("paypalSingleStart ERROR:", error);
    res.render("error", { message: "Erreur PayPal." });
  }
};

export const createPayPalOrderSingle = async (req, res) => {
  try {
    const product = req.session.singleProduct;
    const userId = req.session.user?.id || null;

    if (!product) {
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
          custom_id: userId ? String(userId) : "guest",
        },
      ],
      application_context: {
        brand_name: "TrendyShop",
        user_action: "PAY_NOW",
        return_url: "http://localhost:3007/checkout/paypal-single-success",
        cancel_url: "http://localhost:3007/checkout/paypal-single-cancel",
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

export const paypalSuccessSingle = async (req, res) => {
  try {
    const { token } = req.query;

    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({});

    await paypalClient.execute(request);

    req.session.singleProduct = null;

    res.render("checkout/success", {
      message: "🎉 Paiement PayPal réussi !",
    });
  } catch (error) {
    console.error("PayPal Single Capture ERROR:", error);
    res.render("error", { message: "Erreur PayPal." });
  }
};

export const paypalCancelSingle = (req, res) => {
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
