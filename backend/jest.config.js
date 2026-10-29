// Jest configuration for the HustleHub+ backend
// Tests run in a Node environment and live in the tests/ folder
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  clearMocks: true,
};