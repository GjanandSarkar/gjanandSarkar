// src/validators/authValidator.js — Authentication Validators
import Joi from 'joi';

export const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const validateSignup = (data) => {
  return signupSchema.validate(data);
};

export const validateLogin = (data) => {
  return loginSchema.validate(data);
};
