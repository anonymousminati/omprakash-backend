import { config } from 'dotenv';
import path from 'path';

// Resolve the correct .env file from the root directory
const envFile = path.resolve(
  process.cwd(),
  `.env.${process.env.NODE_ENV || 'development'}.local`,
);

config({ path: envFile });

export const {
  PORT,
  NODE_ENV,
  ARCJET_KEY,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASS,
  DB_NAME,
} = process.env;
