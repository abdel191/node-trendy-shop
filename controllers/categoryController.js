import prisma from "../lib/prisma.js";

/* =========================
   LISTE CATEGORIES
========================= */
export const adminCategories = async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  res.render("admin/categories", {
    user: req.session.user,
    categories,
  });
};

/* =========================
   FORM CREATE
========================= */
export const createCategoryForm = (req, res) => {
  res.render("admin/category-create", {
    user: req.session.user,
  });
};

/* =========================
   CREATE CATEGORY
========================= */
export const createCategory = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.render("error", { message: "Nom de catégorie requis" });
  }

  await prisma.category.create({
    data: { name },
  });

  res.redirect("/admin/categories");
};
