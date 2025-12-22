import express from "express";
import {
  checkoutSingle,
  checkoutSingleProduct,
  checkoutCart,
  processCartCheckout,
  createCheckoutSession,
  paymentSuccess,
  paymentCancel,
  createPayPalOrder,
  paypalSuccess,
  paypalCancel,
  createPayPalOrderSingle,
  paypalSuccessSingle,
  paypalCancelSingle,
  paypalSingleStart,
} from "../controllers/checkoutController.js";

const router = express.Router();

// Achat immédiat
router.post("/checkout-single", checkoutSingle);
router.post("/checkout-single-product", checkoutSingleProduct);

// Panier
router.get("/checkout-cart", checkoutCart);
router.post("/process-cart", processCartCheckout);

// Stripe
router.post("/create-checkout-session", createCheckoutSession);

// Résultats Stripe
router.get("/success", paymentSuccess);
router.get("/cancel", paymentCancel);

router.get("/paypal-single", createPayPalOrderSingle);
router.get("/paypal-single-success", paypalSuccessSingle);
router.get("/paypal-single-cancel", paypalCancelSingle);
router.post("/paypal-single-start", paypalSingleStart);

router.get("/paypal", createPayPalOrder);
router.get("/paypal-success", paypalSuccess);
router.get("/paypal-cancel", paypalCancel);

export default router;
