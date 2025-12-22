import prisma from "../lib/prisma.js";

/* =========================
   DASHBOARD UTILISATEUR
========================= */
export const userDashboard = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/connexion");
    }

    const user = req.session.user;

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        orderItems: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.render("dashboard/index", {
      user,
      orders,
    });
  } catch (error) {
    console.error("Dashboard ERROR :", error);
    res.render("error", {
      message: "Impossible de charger votre dashboard",
    });
  }
};

/* =========================
   DÉTAIL COMMANDE
========================= */
export const orderDetails = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/connexion");
    }

    const userId = req.session.user.id;
    const orderId = Number(req.params.id);

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId, // 🔐 sécurité
      },
      include: {
        orderItems: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return res.render("error", {
        message: "Commande introuvable ou accès refusé.",
      });
    }

    res.render("dashboard/order-details", {
      user: req.session.user,
      order,
    });
  } catch (error) {
    console.error("orderDetails ERROR :", error);
    res.render("error", {
      message: "Impossible de charger la commande.",
    });
  }
};
