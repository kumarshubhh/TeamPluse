// Joi-based validation middleware
import Joi from 'joi';

export function validate(schema, property = 'body') {
  return (req, res, next) => {
    const data = req[property];
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: error.details.map((d) => ({ message: d.message, path: d.path })),
        },
      });
    }
    // Express 5 exposes some request props as getters (e.g., req.query),
    // so avoid direct reassignment for those.
    if (property === 'query') {
      // Clear existing keys and assign validated values
      Object.keys(req.query || {}).forEach((k) => delete req.query[k]);
      Object.assign(req.query, value);
    } else if (property === 'params') {
      Object.keys(req.params || {}).forEach((k) => delete req.params[k]);
      Object.assign(req.params, value);
    } else {
      req[property] = value;
    }
    next();
  };
}

export const JoiId = Joi.string().regex(/^[a-f\d]{24}$/i, 'objectId');
export const JoiISODate = Joi.string().isoDate();
