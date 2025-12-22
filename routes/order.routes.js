import express from "express";
import prisma from "@prisma/client";
import nodemailer from "nodemailer";

const router = express.Router();

// Configurer Nodemailer (tu peux factoriser dans un fichier séparé si tu veux)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Page admin : liste des commandes
router.get("/admin/orders", async (req, res) => {
  const orders = await prisma.order.findMany({
    include: { orderItems: true },
    orderBy: { createdAt: "desc" },
  });
  res.render("admin-orders", { orders });
});

// Action admin : changer le statut
router.post("/admin/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await prisma.order.update({
    where: { id: parseInt(id) },
    data: { status },
    include: { orderItems: true },
  });

  // --- Envoi email en fonction du statut ---
  let subject = "";
  let message = "";

  if (status === "Expédiée") {
    subject = "Votre commande a été expédiée 🚚";
    message = `
      <p>Bonjour ${order.customerName},</p>
      <p>Bonne nouvelle ! Votre commande <b>${
        order.trackingCode
      }</b> a été expédiée.</p>
      <p>Date estimée de livraison : ${order.estimatedDelivery.toLocaleDateString()}.</p>
      <p>Vous pouvez suivre votre commande ici : 
        <a href="http://localhost:3007/order/${
          order.trackingCode
        }">Suivi commande</a>
      </p>
      <p>Merci pour votre confiance 🛍️</p>
    `;
  } else if (status === "Livrée") {
    subject = "Votre commande a été livrée ✅";
    message = `
      <p>Bonjour ${order.customerName},</p>
      <p>Votre commande <b>${order.trackingCode}</b> a bien été livrée.</p>
      <p>Nous espérons que vous êtes satisfait(e) de vos produits !</p>
      <p>Merci pour votre confiance et à bientôt sur TrendyShop 💖</p>
    `;
  }

  if (subject && message) {
    try {
      await transporter.sendMail({
        from: '"TrendyShop" <no-reply@trendyshop.com>',
        to: order.customerEmail,
        subject,
        html: message,
      });
      console.log(`📧 Email envoyé au client pour le statut "${status}"`);
    } catch (err) {
      console.error("Erreur envoi email statut :", err.message);
    }
  }

  res.redirect("/admin/orders");
});

export default router;
