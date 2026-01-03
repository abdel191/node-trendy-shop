import express from "express";
import {
  // Single (Stripe)
  checkoutSingle,
  checkoutSingleProduct,

  // Cart
  checkoutCart,
  processCartCheckout,

  // Stripe (Cart)
  createCheckoutSession,
  paymentSuccess,
  paymentCancel,

  // PayPal cart
  createPayPalOrder,
  paypalSuccess,
  paypalCancel,

  // PayPal single
  paypalSingleStart,
  createPayPalOrderSingle,
  paypalSingleSuccess,
  paypalSingleCancel,
} from "../controllers/checkoutController.js";

const router = express.Router();

/* ==========================
   ACHAT IMMÉDIAT (STRIPE)
========================== */
router.post("/checkout-single", checkoutSingle);
router.post("/checkout-single-product", checkoutSingleProduct);

/* ==========================
   PANIER
========================== */
router.get("/checkout-cart", checkoutCart);

// ⚠️ IMPORTANT: ton cart.ejs POST ici
router.post("/process-cart", processCartCheckout);

/* ==========================
   STRIPE (PANIER)
========================== */
router.post("/create-checkout-session", createCheckoutSession);
router.get("/success", paymentSuccess);
router.get("/cancel", paymentCancel);

/* ==========================
   PAYPAL — PANIER
========================== */
// ⚠️ IMPORTANT: ton cart.ejs fait un <a href="/checkout/paypal"> => GET
router.get("/paypal", createPayPalOrder);
router.get("/paypal-success", paypalSuccess);
router.get("/paypal-cancel", paypalCancel);

/* ==========================
   PAYPAL — ACHAT IMMÉDIAT
========================== */
// Step 1: tu POST depuis checkout-single.ejs vers /paypal-single-start
router.post("/paypal-single-start", paypalSingleStart);

// Step 2: page /checkout/paypal-single qui crée la commande et redirect vers PayPal
router.post("/paypal-single", createPayPalOrderSingle);

router.get("/paypal-single-success", paypalSingleSuccess);
router.get("/paypal-single-cancel", paypalSingleCancel);

export default router;
