const { body, validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHandler');

const GIG_CATEGORIES = ['Design', 'Development', 'Writing', 'Marketing', 'Tutoring', 'Other'];

const registerValidationRules = [
  body('email')
    .isString().withMessage('Email must be text.')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),
  body('password')
    .isString().withMessage('Password must be text.')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('role')
    .isString().withMessage('Role must be text.')
    .trim()
    .notEmpty().withMessage('Role is required.')
    .isIn(['client', 'freelancer']).withMessage('Role must be either "client" or "freelancer".'),
];

const loginValidationRules = [
  body('email')
    .isString().withMessage('Email must be text.')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),
  body('password')
    .isString().withMessage('Password must be text.')
    .notEmpty().withMessage('Password is required.'),
];

const createGigValidationRules = [
  body('title')
    .isString().withMessage('Title must be text.')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters.'),
  body('description')
    .isString().withMessage('Description must be text.')
    .trim()
    .notEmpty().withMessage('Description is required.')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters.'),
  body('category')
    .isString().withMessage('Category must be text.')
    .trim()
    .notEmpty().withMessage('Category is required.')
    .isIn(GIG_CATEGORIES).withMessage(`Category must be one of: ${GIG_CATEGORIES.join(', ')}.`),
  body('price')
    .notEmpty().withMessage('Price is required.')
    .isFloat({ min: 1, max: 1000000 }).withMessage('Price must be between 1 and 1,000,000.'),
  body('deliveryDays')
    .notEmpty().withMessage('Delivery days is required.')
    .isInt({ min: 1, max: 365 }).withMessage('Delivery days must be between 1 and 365.'),
];

// Updates can be partial, so each field is only checked if it is present
const updateGigValidationRules = [
  body('title')
    .optional()
    .isString().withMessage('Title must be text.')
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters.'),
  body('description')
    .optional()
    .isString().withMessage('Description must be text.')
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters.'),
  body('category')
    .optional()
    .isString().withMessage('Category must be text.')
    .trim()
    .isIn(GIG_CATEGORIES).withMessage(`Category must be one of: ${GIG_CATEGORIES.join(', ')}.`),
  body('price')
    .optional()
    .isFloat({ min: 1, max: 1000000 }).withMessage('Price must be between 1 and 1,000,000.'),
  body('deliveryDays')
    .optional()
    .isInt({ min: 1, max: 365 }).withMessage('Delivery days must be between 1 and 365.'),
];

const createBookingValidationRules = [
  body('gigId')
    .isString().withMessage('Gig ID must be text.')
    .trim()
    .notEmpty().withMessage('Gig ID is required.')
    .isLength({ min: 24, max: 24 }).withMessage('Gig ID must be a valid ID.'),
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return sendError(res, 400, firstError);
  }
  next();
}

module.exports = {
  registerValidationRules,
  loginValidationRules,
  createGigValidationRules,
  updateGigValidationRules,
  createBookingValidationRules,
  handleValidationErrors,
};