import Joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

const schema = Joi.object({
  PORT: Joi.number().integer().min(1).max(65535).default(4000),
  MONGODB_URI: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(10).required(),
  JWT_EXPIRES_IN: Joi.string().default('30m'),
  CORS_ORIGIN: Joi.string().allow('').default('*'),
  SOCKET_PATH: Joi.string().default('/socket.io'),
}).unknown(true);

export function validateEnv() {
  const { value, error } = schema.validate(process.env, { abortEarly: false });
  if (error) {
    throw new Error(`Invalid environment variables: ${error.message}`);
  }
  // normalize important ones back to process.env
  process.env.PORT = String(value.PORT);
  process.env.MONGODB_URI = value.MONGODB_URI;
  process.env.JWT_SECRET = value.JWT_SECRET;
  process.env.JWT_EXPIRES_IN = value.JWT_EXPIRES_IN;
  process.env.CORS_ORIGIN = value.CORS_ORIGIN;
  process.env.SOCKET_PATH = value.SOCKET_PATH;
  return value;
}

