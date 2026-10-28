// Runs before every test file
// Sets safe test-only values so tests never depend on the real .env file
// (which is not committed and not available in the CI pipeline)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';