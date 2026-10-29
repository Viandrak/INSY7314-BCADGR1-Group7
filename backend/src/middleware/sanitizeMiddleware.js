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

function isSafeKey(key) {
  return !key.startsWith('$') && !key.includes('.') && !PROTOTYPE_KEYS.includes(key);
}

// Builds a new object from the safe keys only. Object.fromEntries defines each
// key as a normal property, so even a missed special key could never change
// the object's prototype (OWASP Foundation, 2021)
function sanitizeObject(obj) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([key]) => isSafeKey(key))
      .map(([key, value]) => {
        const keepAsTyped = UNTOUCHED_TEXT_KEYS.includes(key) && typeof value === 'string';
        return [key, keepAsTyped ? value : sanitizeValue(value)];
      })
  );
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