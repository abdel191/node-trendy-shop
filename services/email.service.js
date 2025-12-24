const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BASE_URL = process.env.BASE_URL;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

const sendEmail = async ({ to, subject, html }) => {
  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: "TrendyShop",
        email: "trendyshop340@gmail.com",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("❌ BREVO ERROR:", error);
    throw new Error("Brevo email failed");
  }
};

/* =========================
   CONTACT
========================= */
export const sendContactEmail = async ({ name, email, message }) => {
  await sendEmail({
    to: CONTACT_EMAIL,
    subject: "📩 Nouveau message de contact",
    html: `
      <h2>Nouveau message</h2>
      <p><strong>Nom :</strong> ${name}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p>${message}</p>
    `,
  });
};

/* =========================
   RESET PASSWORD
========================= */
export const sendResetPasswordEmail = async ({ to, name, token }) => {
  const resetLink = `${BASE_URL}/reset-password/${token}`;

  await sendEmail({
    to,
    subject: "🔐 Réinitialisation de votre mot de passe",
    html: `
      <h2>Bonjour ${name}</h2>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Ce lien expire dans 30 minutes.</p>
    `,
  });
};

/* =========================
   PASSWORD CHANGED
========================= */
export const sendPasswordChangedEmail = async ({ to, name }) => {
  await sendEmail({
    to,
    subject: "✅ Mot de passe modifié",
    html: `
      <h2>Bonjour ${name}</h2>
      <p>Votre mot de passe a été modifié avec succès.</p>
    `,
  });
};

/* =========================
   CONFIRMATION COMPTE
========================= */
export const sendConfirmationEmail = async ({ to, token }) => {
  const confirmLink = `${BASE_URL}/confirm/${token}`;

  await sendEmail({
    to,
    subject: "✅ Confirmez votre compte",
    html: `
      <h2>Bienvenue sur TrendyShop 🎉</h2>
      <a href="${confirmLink}">${confirmLink}</a>
    `,
  });
};

/* =========================
   COMMANDE CLIENT
========================= */
export const sendClientOrderEmail = async ({ email, orderId, total }) => {
  await sendEmail({
    to: email,
    subject: "🛒 Confirmation de commande",
    html: `
      <p>Commande #${orderId}</p>
      <p>Total : ${total} €</p>
    `,
  });
};

/* =========================
   COMMANDE ADMIN
========================= */
export const sendAdminOrderEmail = async ({
  orderId,
  customerName,
  customerEmail,
  total,
}) => {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: "📦 Nouvelle commande",
    html: `
      <p>Commande #${orderId}</p>
      <p>Client : ${customerName}</p>
      <p>Email : ${customerEmail}</p>
      <p>Total : ${total} €</p>
    `,
  });
};
