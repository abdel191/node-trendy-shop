// ================================
// IMPORTS
// ================================
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import flash from "connect-flash";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import i18n from "i18n";

import prisma from "./lib/prisma.js";
import { stripeWebhook } from "./controllers/webhookController.js";

// ================================
// ENV
// ================================
dotenv.config();

// ================================
// DIRNAME (ESM)
// ================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================================
// APP INIT
// ================================
const app = express();

// ================================
// VIEWS
// ================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ================================
// STRIPE WEBHOOK (RAW BODY)
// ⚠️ DOIT ÊTRE AVANT express.json()
// ================================
app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  stripeWebhook
);

// ================================
// STATIC + PARSERS
// ================================
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ================================
// 🌍 i18n CONFIG (UNE SEULE FOIS)
// ================================
i18n.configure({
  locales: ["fr", "en", "de", "it"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "fr",
  cookie: "lang",
  autoReload: true,
  updateFiles: false,
  syncFiles: false,
});

app.use(i18n.init);

// rendre i18n dispo dans TOUTES les vues
app.use((req, res, next) => {
  res.locals.__ = res.__;
  res.locals.currentLang = req.getLocale();
  next();
});

// ================================
// ROUTE CHANGEMENT DE LANGUE
// ================================
app.get("/lang/:lang", (req, res) => {
  const { lang } = req.params;
  const supportedLangs = ["fr", "en", "de", "it"];

  if (!supportedLangs.includes(lang)) {
    return res.redirect("/");
  }

  res.cookie("lang", lang, {
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 an
    httpOnly: false,
    sameSite: "lax",
  });

  req.setLocale(lang);

  res.redirect(req.get("referer") || "/");
});

// ================================
// SESSION ID (PANIER)
// ================================
function createSessionId() {
  return crypto.randomUUID();
}

function setSessionCookie(res) {
  const id = createSessionId();

  res.cookie("sessionId", id, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 30,
    sameSite: "lax",
    path: "/",
  });

  return id;
}

app.use((req, res, next) => {
  if (!req.cookies.sessionId) {
    req.cookies.sessionId = setSessionCookie(res);
  }
  next();
});

// ================================
// EXPRESS SESSION
// ================================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "TrendyShopSecret123",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

// ================================
// GLOBAL LOCALS (SESSION)
// ================================
app.use("/uploads", express.static("public/uploads"));

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.user = req.session.user || null;
  next();
});

// ================================
// FLASH MESSAGES
// ================================
app.use((req, res, next) => {
  res.locals.successMessage = req.flash("success");
  res.locals.errorMessages = req.flash("error");
  next();
});

// ================================
// PANIER COUNT (HEADER)
// ================================
app.use(async (req, res, next) => {
  try {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      res.locals.cartCount = 0;
      return next();
    }

    const cart = await prisma.cart.findFirst({
      where: { sessionId },
      include: { items: true },
    });

    res.locals.cartCount = cart
      ? cart.items.reduce((sum, i) => sum + i.quantity, 0)
      : 0;

    next();
  } catch (error) {
    console.error("CartCount ERROR:", error);
    res.locals.cartCount = 0;
    next();
  }
});

// ================================
// ROUTES
// ================================
import homeRouter from "./routes/home.route.js";
import productRouter from "./routes/product.route.js";
import cartRouter from "./routes/cart.routes.js";
import checkoutRouter from "./routes/checkout.route.js";
import orderRouter from "./routes/order.routes.js";
import adminRouter from "./routes/admin.routes.js";
import inscriptionRouter from "./routes/inscription.route.js";
import connexionRouter from "./routes/connexion.route.js";
import passwordRouter from "./routes/password.route.js";
import dashboardRouter from "./routes/dashboard.route.js";
import contactRouter from "./routes/contact.route.js";

app.use("/", homeRouter);
app.use("/products", productRouter);
app.use("/cart", cartRouter);
app.use("/checkout", checkoutRouter);
app.use("/order", orderRouter);
app.use("/admin", adminRouter);
app.use("/inscription", inscriptionRouter);
app.use("/connexion", connexionRouter);
app.use("/dashboard", dashboardRouter);
app.use("/password", passwordRouter);
app.use("/contact", contactRouter);

// ================================
// SUCCESS / CANCEL
// ================================
app.get("/success", (req, res) => {
  req.session.cart = [];
  req.session.singleProduct = null;

  res.render("checkout/success", {
    message: "🎉 Merci pour votre achat !",
  });
});

app.get("/cancel", (req, res) => {
  res.redirect("/checkout/cancel");
});

// ================================
// ERROR HANDLER
// ================================
app.use((err, req, res, next) => {
  console.error("❌ ERREUR:", err);
  res.status(500).render("error", {
    message: "Une erreur est survenue",
  });
});

// ================================
// SERVER START
// ================================
const PORT = process.env.PORT || 3007;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
