import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  sendResetPasswordEmail,
  sendPasswordChangedEmail,
} from "../services/email.service.js";

const BASE_URL = process.env.BASE_URL;

/* ===============================
   FORM MOT DE PASSE OUBLIÉ
================================ */
export const forgotPasswordForm = (req, res) => {
  res.render("password/forgot", { error: null, success: null });
};

/* ===============================
   ENVOI EMAIL RESET
================================ */
export const forgotPasswordSubmit = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.render("password/forgot", {
        error: "Aucun compte trouvé avec cet email.",
        success: null,
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: expires,
      },
    });

    const resetUrl = `${BASE_URL}/reset-password/${token}`;

    // ✅ APPEL CORRECT
    await sendResetPasswordEmail({
      to: user.email,
      resetUrl,
    });

    res.render("password/forgot", {
      error: null,
      success: "Un email de réinitialisation vous a été envoyé.",
    });
  } catch (err) {
    console.error("forgotPasswordSubmit ERROR:", err);
    res.render("password/forgot", {
      error: "Erreur interne.",
      success: null,
    });
  }
};

/* ===============================
   FORM RESET PASSWORD
================================ */
export const resetPasswordForm = async (req, res) => {
  const { token } = req.params;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return res.render("password/reset", {
      error: "Lien invalide ou expiré.",
      token: null,
    });
  }

  res.render("password/reset", { error: null, token });
};

/* ===============================
   SUBMIT NOUVEAU MOT DE PASSE
================================ */
export const resetPasswordSubmit = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.render("password/reset", {
        error: "Lien invalide ou expiré.",
        token: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    // ✅ APPEL CORRECT
    await sendPasswordChangedEmail({
      to: user.email,
    });

    res.redirect("/connexion");
  } catch (err) {
    console.error("resetPasswordSubmit ERROR:", err);
    res.render("password/reset", {
      error: "Erreur lors de la réinitialisation.",
      token: null,
    });
  }
};
