const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BASE_URL = process.env.BASE_URL;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

/* =====================================================
   FONCTION INTERNE BREVO
===================================================== */
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
        email: "trendyshop340@gmail.com",
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
      <h2>Nouveau message</h2>
      <p><strong>Nom :</strong> ${name || "Non fourni"}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p>${message}</p>
    `,
  });
};

/* =====================================================
   RESET PASSWORD
===================================================== */
export const sendResetPasswordEmail = async ({ to, name, resetUrl }) => {
  await sendEmail({
    to,
    subject: "🔐 Réinitialisation de votre mot de passe",
    html: `
      <h2>Bonjour ${name || ""}</h2>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Ce lien expire dans 30 minutes.</p>
    `,
  });
};

/* =====================================================
   PASSWORD CHANGÉ
===================================================== */
export const sendPasswordChangedEmail = async ({ to, name }) => {
  await sendEmail({
    to,
    subject: "✅ Mot de passe modifié",
    html: `
      <h2>Bonjour ${name || ""}</h2>
      <p>Votre mot de passe a été modifié avec succès.</p>
      <p>Si ce n’est pas vous, contactez le support immédiatement.</p>
    `,
  });
};

/* =====================================================
   CONFIRMATION COMPTE
===================================================== */
export const sendConfirmationEmail = async ({ to, token }) => {
  const confirmLink = `${BASE_URL}/confirm/${token}`;

  await sendEmail({
    to,
    subject: "✅ Confirmez votre compte TrendyShop",
    html: `
      <h2>Bienvenue sur TrendyShop 🎉</h2>
      <p>Veuillez confirmer votre compte :</p>
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
