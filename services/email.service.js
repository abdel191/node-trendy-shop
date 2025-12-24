const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BASE_URL = process.env.BASE_URL;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

async function sendEmail({ to, subject, html }) {
  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "TrendyShop", email: "trendyshop340@gmail.com" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("BREVO ERROR:", err);
    throw new Error("Email non envoyé");
  }
}

/* CONTACT */
export const sendContactEmail = async ({ email, message }) => {
  await sendEmail({
    to: CONTACT_EMAIL,
    subject: "📩 Nouveau message de contact",
    html: `
      <p><strong>Email :</strong> ${email}</p>
      <p>${message}</p>
    `,
  });
};

/* RESET PASSWORD */
export const sendResetPasswordEmail = async ({ to, resetUrl }) => {
  await sendEmail({
    to,
    subject: "🔐 Réinitialisation du mot de passe",
    html: `
      <p>Cliquez ici pour réinitialiser votre mot de passe :</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `,
  });
};

/* PASSWORD CHANGÉ */
export const sendPasswordChangedEmail = async ({ to }) => {
  await sendEmail({
    to,
    subject: "✅ Mot de passe modifié",
    html: `<p>Votre mot de passe a été modifié avec succès.</p>`,
  });
};

/* CLIENT COMMANDE */
export const sendClientOrderEmail = async ({ email, orderId, total }) => {
  await sendEmail({
    to: email,
    subject: "🛒 Confirmation de commande",
    html: `<p>Commande #${orderId} – Total : ${total}€</p>`,
  });
};

/* ADMIN COMMANDE */
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
      <p>Total : ${total}€</p>
    `,
  });
};
