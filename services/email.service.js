// services/email.service.js
import transporter from "../lib/mailer.js";

const FROM = process.env.MAIL_FROM || '"TrendyShop" <trendyshop340@gmail.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "trendyshop340@gmail.com";

/* ==============================
   EMAIL CLIENT (commande)
============================== */
export const sendClientOrderEmail = async ({ to, name, orderId, total }) => {
  if (!to) return;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "✅ Confirmation de votre commande",
    html: `
      <h2>Merci ${name || "Client"} 🙏</h2>
      <p>Votre commande <strong>#${orderId}</strong> a bien été confirmée.</p>
      <p><strong>Total :</strong> €${Number(total).toFixed(2)}</p>
      <p>Nous vous contacterons pour la livraison.</p>
      <p>— TrendyShop</p>
    `,
  });
};

/* ==============================
   EMAIL ADMIN (nouvelle commande)
============================== */
export const sendAdminOrderEmail = async ({
  orderId,
  total,
  customerName,
  customerEmail,
}) => {
  if (!ADMIN_EMAIL) return;

  await transporter.sendMail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: "🛒 Nouvelle commande reçue",
    html: `
      <h2>Nouvelle commande</h2>
      <p><strong>Commande :</strong> #${orderId}</p>
      <p><strong>Client :</strong> ${customerName || ""}</p>
      <p><strong>Email :</strong> ${customerEmail || ""}</p>
      <p><strong>Total :</strong> €${Number(total).toFixed(2)}</p>
      <p><a href="http://localhost:3007/admin">Voir dans le dashboard</a></p>
    `,
  });
};

/* ==============================
   EMAIL RESET MOT DE PASSE
============================== */
export const sendResetPasswordEmail = async ({ to, name, resetUrl }) => {
  if (!to || !resetUrl) return;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "🔐 Réinitialisation de votre mot de passe",
    html: `
      <p>Bonjour ${name || "Client"},</p>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Ce lien expire dans 30 minutes.</p>
      <p>— TrendyShop</p>
    `,
  });
};

/* ==============================
   EMAIL CONFIRMATION CHANGEMENT MDP
============================== */
export const sendPasswordChangedEmail = async ({ to, name }) => {
  if (!to) return;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "🔐 Mot de passe modifié",
    html: `
      <h2>Mot de passe modifié 🔐</h2>
      <p>Bonjour ${name || "Client"},</p>
      <p>Votre mot de passe a été modifié avec succès.</p>
      <p>Si vous n'êtes pas à l'origine de ce changement, contactez-nous immédiatement.</p>
      <br/>
      <p>— L'équipe TrendyShop</p>
    `,
  });
};

/* ==============================
   EMAIL CONTACT (footer)
============================== */
export const sendContactEmail = async ({ fromEmail, message }) => {
  if (!fromEmail || !message) return;

  await transporter.sendMail({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: fromEmail, // ✅ le “répondre” arrive au client
    subject: "📩 Nouveau message depuis le site",
    html: `
      <h2>Nouveau message client</h2>
      <p><strong>Email :</strong> ${fromEmail}</p>
      <p><strong>Message :</strong></p>
      <p>${String(message).replace(/\n/g, "<br/>")}</p>
      <br/>
      <p>— TrendyShop</p>
    `,
  });
};
