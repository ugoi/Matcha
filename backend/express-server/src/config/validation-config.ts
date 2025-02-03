import dotenv from "dotenv";
import { join } from "path";

// Load validation specific environment variables
dotenv.config({ path: join(process.cwd(), ".env.validation") });

export const validationLimits = {
  name: {
    min: Number(process.env.VALIDATION_NAME_MIN_LENGTH) || 1,
    max: Number(process.env.VALIDATION_NAME_MAX_LENGTH) || 50,
  },
  username: {
    min: Number(process.env.VALIDATION_USERNAME_MIN_LENGTH) || 3,
    max: Number(process.env.VALIDATION_USERNAME_MAX_LENGTH) || 30,
  },
  bio: {
    max: Number(process.env.VALIDATION_BIO_MAX_LENGTH) || 500,
  },
  message: {
    min: Number(process.env.VALIDATION_MESSAGE_MIN_LENGTH) || 1,
    max: Number(process.env.VALIDATION_MESSAGE_MAX_LENGTH) || 1000,
  },
  gender: {
    max: Number(process.env.VALIDATION_GENDER_MAX_LENGTH) || 50,
  },
  sexualPreference: {
    max: Number(process.env.VALIDATION_SEXUAL_PREF_MAX_LENGTH) || 50,
  },
  age: {
    min: Number(process.env.VALIDATION_AGE_MIN) || 18,
    max: Number(process.env.VALIDATION_AGE_MAX) || 120,
  },
  report: {
    min: Number(process.env.VALIDATION_REPORT_MIN_LENGTH) || 1,
    max: Number(process.env.VALIDATION_REPORT_MAX_LENGTH) || 500,
  },
}; 
