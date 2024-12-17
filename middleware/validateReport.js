import { coupDeCoeurSchema } from "../validation/CoupdeCoeurSchema.js";
import { alertSchema } from "../validation/ReportingSchema.js";
import { suggestionSchema } from "../validation/SuggestionSchema.js";

export const validateReport = {
  async validateReportFields(req, res, next) {
    const { error } = alertSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  },
};

export const validateCoupdeCoeur = {
  async validateReportFields(req, res, next) {
    const { error } = coupDeCoeurSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  },
};

export const validateSuggest = {
  async validateReportFields(req, res, next) {
    const { error } = suggestionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  },
};
