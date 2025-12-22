import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

export const inscriptionForm = (req, res) => {
  res.render("inscription", { error: null });
};

export const inscriptionSubmit = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.render("inscription", {
        error: "Veuillez remplir tous les champs.",
      });

    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist)
      return res.render("inscription", {
        error: "Cet email est déjà utilisé.",
      });

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { name, email, password: hashed },
    });

    req.flash(
      "success",
      "Inscription réussie ! Vous pouvez maintenant vous connecter."
    );
    res.redirect("/connexion");
  } catch (err) {
    console.error("Inscription ERROR:", err);
    res.render("inscription", { error: "Erreur interne." });
  }
};
