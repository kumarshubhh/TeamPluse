import Joi from 'joi';

export const signupSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
});

export const loginSchema = Joi.object({
  identifier: Joi.string().min(3).max(254).required(), // email or username
  password: Joi.string().min(8).max(128).required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(60).optional(),
  email: Joi.string().email().optional(),
}).min(1); // At least one field must be provided


