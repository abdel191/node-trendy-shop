export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/connexion");
  }
  next();
};
