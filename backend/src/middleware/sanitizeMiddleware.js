// Passwords are hashed and never displayed, so their text is left exactly
const UNTOUCHED_TEXT_KEYS = ['password'];

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}


function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value.replace(/\$/g, '').replace(/[<>]/g, '');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (isPlainObject(value)) {
    return sanitizeObject(value);
  }
  return value;
}

// Keys that would change an object's prototype instead of adding normal data
const PROTOTYPE_KEYS = ['__proto__', 'constructor', 'prototype'];
function sanitizeObject(obj) {
  const clean = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.') || PROTOTYPE_KEYS.includes(key)) {
      continue;
    }
    const keepAsTyped = UNTOUCHED_TEXT_KEYS.includes(key) && typeof obj[key] === 'string';
    clean[key] = keepAsTyped ? obj[key] : sanitizeValue(obj[key]);
  }
  return clean;
}

function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }


  if (req.query && typeof req.query === 'object') {
    Object.defineProperty(req, 'query', {
      value: sanitizeObject(req.query),
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  next();
}

module.exports = { sanitizeInput };