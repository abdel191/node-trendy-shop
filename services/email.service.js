import transporter from "../lib/mailer.js";

const BASE_URL = process.env.BASE_URL;

/* =====================================================
   RESET PASSWORD
===================================================== */
export const sendResetPasswordEmail = async (email, token) => {
  const resetLink = `${BASE_URL}/password/reset/${token}`;

  await transporter.sendMail({
    from: '"TrendyShop" <no-reply@trendyshop.it.com>',
    to: email,
    subject: "🔐 Réinitialisation de votre mot de passe",
    html: `
      <h2>Réinitialisation du mot de passe</h2>
      <p>Cliquez sur le lien ci-dessous :</p>
      <a href="${resetLink}">Réinitialiser mon mot de passe</a>
    `,
  });
};

/* =====================================================
   CONFIRMATION COMPTE
===================================================== */
export const sendConfirmationEmail = async (email, token) => {
  const confirmLink = `${BASE_URL}/confirm/${token}`;

  await transporter.sendMail({
    from: '"TrendyShop" <no-reply@trendyshop.it.com>',
    to: email,
    subject: "✅ Confirmez votre compte",
    html: `
      <h2>Bienvenue sur TrendyShop 🎉</h2>
      <a href="${confirmLink}">Confirmer mon compte</a>
    `,
  });
};

/* =====================================================
   EMAIL CONTACT
===================================================== */
export const sendContactEmail = async ({ name, email, message }) => {
  await transporter.sendMail({
    from: `"${name}" <${email}>`,
    to: process.env.CONTACT_EMAIL,
    subject: "📩 Nouveau message de contact",
    html: `
      <p><strong>Nom :</strong> ${name}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p>${message}</p>
    `,
  });
};

/* =====================================================
   EMAIL CLIENT — COMMANDE
===================================================== */
export const sendClientOrderEmail = async ({ email, orderId, total }) => {
  const orderLink = `${BASE_URL}/dashboard/orders/${orderId}`;

  await transporter.sendMail({
    from: '"TrendyShop" <orders@trendyshop.it.com>',
    to: email,
    subject: "🛒 Confirmation de votre commande",
    html: `
      <h2>Merci pour votre commande 🎉</h2>
      <p>Numéro de commande : <strong>#${orderId}</strong></p>
      <p>Total : <strong>${total} €</strong></p>
      <a href="${orderLink}">Voir ma commande</a>
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
  const adminLink = `${BASE_URL}/admin/orders/${orderId}`;

  await transporter.sendMail({
    from: '"TrendyShop" <orders@trendyshop.it.com>',
    to: process.env.ADMIN_EMAIL,
    subject: "📦 Nouvelle commande reçue",
    html: `
      <h2>Nouvelle commande</h2>
      <p><strong>Commande :</strong> #${orderId}</p>
      <p><strong>Client :</strong> ${customerName}</p>
      <p><strong>Email :</strong> ${customerEmail}</p>
      <p><strong>Total :</strong> ${total} €</p>
      <a href="${adminLink}">Voir la commande</a>
    `,
  });
};
