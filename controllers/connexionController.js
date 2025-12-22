import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

// ------------------------------
// PAGE CONNEXION
// ------------------------------
export const showLogin = (req, res) => {
  res.render("connexion/index");
};

// ------------------------------
// TRAITEMENT CONNEXION
// ------------------------------
// ✅ CONNEXION
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    req.flash("error", "Email incorrect");
    return res.redirect("/connexion");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    req.flash("error", "Mot de passe incorrect");
    return res.redirect("/connexion");
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  };

  req.flash("success", "Connexion réussie !");
  return res.redirect("/"); // ✅ ICI
};

// ------------------------------
// DÉCONNEXION
// ------------------------------
export const logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};
