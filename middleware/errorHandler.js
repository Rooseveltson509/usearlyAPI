export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Une erreur interne est survenue.",
  });
  next();
}
