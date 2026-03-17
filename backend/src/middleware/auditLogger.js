const { logAction } = require("../services/audit.service");

module.exports = (action, detailsFn) => {
  return (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode < 400 && req.user) {
        logAction({
          user: req.user,
          action,
          details: detailsFn(req),
        });
      }
    });
    next();
  };
};
