import { sendContactEmail } from "../services/email.service.js";

export const submitContactForm = async (req, res) => {
  try {
    const { email, message } = req.body;

    // 🔐 Validation simple
    if (!email || !message) {
      req.flash("error", "Tous les champs sont obligatoires.");
      return res.redirect(req.get("referer") || "/");
    }

    // ✅ Envoi email via Brevo
    await sendContactEmail({
      name: "Client TrendyShop",
      email,
      message,
    });

    req.flash("success", "Votre message a bien été envoyé ✅");
    return res.redirect("/");
  } catch (error) {
    console.error("Contact ERROR:", error);

    req.flash(
      "error",
      "Erreur lors de l’envoi du message. Réessayez plus tard."
    );
    return res.redirect(req.get("referer") || "/");
  }
};
