export const requireAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).render("error", {
      message: "Accès réservé à l'administrateur",
    });
  }
  next();
};
