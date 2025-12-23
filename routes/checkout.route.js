import express from "express";
import {
  checkoutSingle,
  checkoutSingleProduct,
  checkoutCart,
  createCheckoutSession,
  paymentSuccess,
  paymentCancel,

  // PayPal panier
  createPayPalOrder,
  paypalSuccess,
  paypalCancel,

  // PayPal achat immédiat
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

/* ==========================
   STRIPE (PANIER)
========================== */
router.post("/create-checkout-session", createCheckoutSession);
router.get("/success", paymentSuccess);
router.get("/cancel", paymentCancel);

/* ==========================
   PAYPAL — PANIER
========================== */
router.post("/paypal", createPayPalOrder);
router.get("/paypal-success", paypalSuccess);
router.get("/paypal-cancel", paypalCancel);

/* ==========================
   PAYPAL — ACHAT IMMÉDIAT
========================== */
router.post("/paypal-single", createPayPalOrderSingle);
router.get("/paypal-single-success", paypalSingleSuccess);
router.get("/paypal-single-cancel", paypalSingleCancel);

export default router;
