// Replaces the User model with a fake, so these tests can check exactly
// what the register controller tries to save, without a real database
jest.mock('../src/models/userModel', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const User = require('../src/models/userModel');
const { register } = require('../src/controllers/authController');
const { comparePassword } = require('../src/services/passwordService');

// A minimal fake Express response that records the status and JSON body
function mockResponse() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('Registration stores only a hashed password', () => {
  const PASSWORD = 'Password123';

  beforeEach(() => {
    User.findOne.mockResolvedValue(null); // no existing user with this email
    User.create.mockImplementation(async (data) => ({ id: 'new-user-id', ...data }));
  });

  test('saves a bcrypt hash, not the plain password', async () => {
    const req = { body: { email: 'new@example.com', password: PASSWORD, role: 'client' } };
    const res = mockResponse();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(User.create).toHaveBeenCalledTimes(1);

    const saved = User.create.mock.calls[0][0];
    expect(saved).not.toHaveProperty('password');
    expect(saved.passwordHash).not.toBe(PASSWORD);
    expect(saved.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    await expect(comparePassword(PASSWORD, saved.passwordHash)).resolves.toBe(true);
  });

  test('does not return the password or hash in the response', async () => {
    const req = { body: { email: 'new@example.com', password: PASSWORD, role: 'client' } };
    const res = mockResponse();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledTimes(1);

    const body = res.json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain(PASSWORD);
    expect(body.user).not.toHaveProperty('passwordHash');
    expect(body.user).not.toHaveProperty('password');
  });
});