import fetch from "node-fetch";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BASE_URL = process.env.BASE_URL;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

const sendEmail = async ({ to, subject, html }) => {
  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "TrendyShop",
        email: "no-reply@trendyshop.com",
      },
      to: Array.isArray(to) ? to : [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("BREVO ERROR:", error);
    throw new Error("Erreur envoi email");
  }
};

/* =====================================================
   CONTACT
===================================================== */
export const sendContactEmail = async ({ name, email, message }) => {
  await sendEmail({
    to: CONTACT_EMAIL,
    subject: "📩 Nouveau message de contact",
    html: `
      <h2>Nouveau message de contact</h2>
      <p><strong>Nom :</strong> ${name}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p>${message}</p>
    `,
  });
};

/* =====================================================
   RESET PASSWORD
===================================================== */
export const sendResetPasswordEmail = async (email, token) => {
  const resetLink = `${BASE_URL}/password/reset/${token}`;

  await sendEmail({
    to: email,
    subject: "🔐 Réinitialisation de votre mot de passe",
    html: `
      <h2>Mot de passe oublié</h2>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.</p>
    `,
  });
};

/* =====================================================
   PASSWORD CHANGÉ
===================================================== */
export const sendPasswordChangedEmail = async (email) => {
  await sendEmail({
    to: email,
    subject: "✅ Mot de passe modifié",
    html: `
      <h2>Mot de passe modifié</h2>
      <p>Votre mot de passe a été modifié avec succès.</p>
      <p>Si ce n’est pas vous, contactez immédiatement le support.</p>
    `,
  });
};

/* =====================================================
   CONFIRMATION DE COMPTE
===================================================== */
export const sendConfirmationEmail = async (email, token) => {
  const confirmLink = `${BASE_URL}/confirm/${token}`;

  await sendEmail({
    to: email,
    subject: "✅ Confirmez votre compte TrendyShop",
    html: `
      <h2>Bienvenue sur TrendyShop 🎉</h2>
      <p>Veuillez confirmer votre compte en cliquant ci-dessous :</p>
      <a href="${confirmLink}">${confirmLink}</a>
    `,
  });
};

/* =====================================================
   EMAIL CLIENT — COMMANDE
===================================================== */
export const sendClientOrderEmail = async ({ email, orderId, total }) => {
  await sendEmail({
    to: email,
    subject: "🛒 Confirmation de votre commande",
    html: `
      <h2>Merci pour votre commande 🎉</h2>
      <p><strong>Commande :</strong> #${orderId}</p>
      <p><strong>Total :</strong> ${total} €</p>
      <p>Nous vous tiendrons informé de l’expédition.</p>
    `,
  });
};

/* =====================================================
   EMAIL ADMIN — NOUVELLE COMMANDE
===================================================== */
export const sendAdminOrderEmail = async ({
  orderId,
  customerName,
  customerEmail,
  total,
}) => {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: "📦 Nouvelle commande reçue",
    html: `
      <h2>Nouvelle commande</h2>
      <p><strong>Commande :</strong> #${orderId}</p>
      <p><strong>Client :</strong> ${customerName}</p>
      <p><strong>Email :</strong> ${customerEmail}</p>
      <p><strong>Total :</strong> ${total} €</p>
    `,
  });
};
