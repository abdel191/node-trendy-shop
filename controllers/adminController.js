import prisma from "../lib/prisma.js";

/* =====================================================
   DASHBOARD ADMIN (STATISTIQUES)
===================================================== */
export const adminDashboard = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).render("error", {
        message: "Accès interdit (admin uniquement)",
      });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    const ordersCount = await prisma.order.count();
    const usersCount = await prisma.user.count();

    res.render("admin/index", {
      user: req.session.user,
      products,
      stats: {
        productsCount: products.length,
        ordersCount,
        usersCount,
      },
    });
  } catch (error) {
    console.error("adminDashboard ERROR:", error);
    res.render("error", { message: "Erreur dashboard admin" });
  }
};

/* =====================================================
   PRODUITS
===================================================== */

export const createProductForm = async (req, res) => {
  const categories = await prisma.category.findMany();

  res.render("admin/create", {
    user: req.session.user,
    categories,
  });
};

/* ======================
   CREATE PRODUCT (UPLOAD)
====================== */
export const createProduct = async (req, res) => {
  try {
    const { name, price, description, stock, categoryId } = req.body;

    if (!req.file) {
      return res.render("error", { message: "Image requise" });
    }

    await prisma.product.create({
      data: {
        name,
        price: Number(price),
        description,
        stock: Number(stock),
        imageUrl: req.file.path, // ✅ CLOUDINARY
        category: {
          connect: { id: Number(categoryId) },
        },
      },
    });

    res.redirect("/admin");
  } catch (error) {
    console.error("createProduct ERROR:", error);
    res.render("error", { message: "Erreur création produit" });
  }
};

/* ======================
   FORMULAIRE EDIT PRODUCT
====================== */
export const editProductForm = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { category: true },
    });

    if (!product) {
      return res.render("error", { message: "Produit introuvable" });
    }

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    res.render("admin/edit", {
      user: req.session.user,
      product,
      categories,
    });
  } catch (error) {
    console.error("editProductForm ERROR:", error);
    res.render("error", { message: "Erreur chargement produit" });
  }
};

/* ======================
   UPDATE PRODUCT (UPLOAD OPTIONNEL)
====================== */
export const updateProduct = async (req, res) => {
  const { name, price, description, stock } = req.body;

  let data = {
    name,
    price: Number(price),
    stock: Number(stock),
    description, // ✅
  };

  if (req.file) {
    data.imageUrl = `/uploads/${req.file.filename}`;
  }

  await prisma.product.update({
    where: { id: Number(req.params.id) },
    data,
  });

  res.redirect("/admin");
};

/* ======================
   DELETE PRODUCT
====================== */
export const deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: Number(req.params.id) },
    });

    res.redirect("/admin");
  } catch (error) {
    console.error("deleteProduct ERROR:", error);
    res.render("error", { message: "Erreur suppression produit" });
  }
};

/* =====================================================
   COMMANDES
===================================================== */
export const adminOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        orderItems: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.render("admin/orders", {
      user: req.session.user,
      orders,
    });
  } catch (error) {
    console.error("adminOrders ERROR:", error);
    res.render("error", { message: "Erreur chargement commandes" });
  }
};

export const adminOrderDetails = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return res.render("error", {
        message: "Commande introuvable",
      });
    }

    res.render("admin/order-details", {
      user: req.session.user,
      order,
    });
  } catch (error) {
    console.error("adminOrderDetails ERROR:", error);
    res.render("error", { message: "Erreur détails commande" });
  }
};

/* =====================================================
   UTILISATEURS
===================================================== */
export const adminUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.render("admin/users", {
      user: req.session.user,
      users,
    });
  } catch (error) {
    console.error("adminUsers ERROR:", error);
    res.render("error", { message: "Erreur chargement utilisateurs" });
  }
};

export const toggleAdmin = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.render("error", { message: "Utilisateur introuvable" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isAdmin: !user.isAdmin,
      },
    });

    res.redirect("/admin/users");
  } catch (error) {
    console.error("toggleAdmin ERROR:", error);
    res.render("error", { message: "Erreur modification rôle admin" });
  }
};

/* =====================================================
   DASHBOARD STATS
===================================================== */
export const adminStats = async (req, res) => {
  try {
    if (!req.session.user?.isAdmin) {
      return res.status(403).render("error", {
        message: "Accès interdit",
      });
    }

    // ✅ Commandes PAYÉES via la relation Payment
    const paidOrders = await prisma.order.findMany({
      where: {
        payment: {
          status: "completed", // ou "paid" selon ton modèle Payment
        },
      },
      include: {
        orderItems: true,
      },
    });

    // 💰 Revenu total
    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // 📦 Nombre de commandes
    const totalOrders = paidOrders.length;

    // 🛒 Produits vendus
    const totalProductsSold = paidOrders.reduce((sum, order) => {
      return (
        sum +
        order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0)
      );
    }, 0);

    // 📆 Dates
    const now = new Date();
    const last7Days = new Date(now);
    const last30Days = new Date(now);

    last7Days.setDate(now.getDate() - 7);
    last30Days.setDate(now.getDate() - 30);

    const revenue7Days = paidOrders
      .filter((o) => o.createdAt >= last7Days)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const revenue30Days = paidOrders
      .filter((o) => o.createdAt >= last30Days)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.render("admin/stats", {
      user: req.session.user,
      stats: {
        totalRevenue,
        totalOrders,
        totalProductsSold,
        revenue7Days,
        revenue30Days,
      },
    });
  } catch (error) {
    console.error("adminStats ERROR:", error);
    res.render("error", {
      message: "Erreur lors du chargement des statistiques",
    });
  }
};

/* ======================
   FORMULAIRE CREATE CATEGORY
====================== */
export const createCategoryForm = async (req, res) => {
  res.render("admin/categories", {
    user: req.session.user,
    categories: await prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  });
};

/* ==========================
   CATEGORIES
========================== */
export const adminCategories = async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  res.render("admin/categories", {
    user: req.session.user,
    categories,
  });
};

export const createCategory = async (req, res) => {
  const { name } = req.body;

  if (!name) return res.redirect("/admin/categories");

  await prisma.category.create({
    data: { name },
  });

  res.redirect("/admin/categories");
};
