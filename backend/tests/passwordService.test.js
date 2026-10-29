const { hashPassword, comparePassword } = require('../src/services/passwordService');

const PASSWORD = 'Password123';

describe('Password hashing service', () => {
  test('never returns the plain password', async () => {
    const hash = await hashPassword(PASSWORD);
    expect(hash).not.toBe(PASSWORD);
    expect(hash).not.toContain(PASSWORD);
  });

  test('produces a bcrypt hash with a cost factor of 10', async () => {
    const hash = await hashPassword(PASSWORD);
    // bcrypt hashes look like $2b$10$ followed by 53 characters of salt and hash
    expect(hash).toMatch(/^\$2[aby]\$10\$.{53}$/);
  });

  test('gives a different hash each time for the same password (salting)', async () => {
    const first = await hashPassword(PASSWORD);
    const second = await hashPassword(PASSWORD);
    expect(first).not.toBe(second);
  });

  test('matches the correct password against its hash', async () => {
    const hash = await hashPassword(PASSWORD);
    await expect(comparePassword(PASSWORD, hash)).resolves.toBe(true);
  });

  test('does not match a wrong password', async () => {
    const hash = await hashPassword(PASSWORD);
    await expect(comparePassword('WrongPassword1', hash)).resolves.toBe(false);
  });

  test('is case-sensitive', async () => {
    const hash = await hashPassword(PASSWORD);
    await expect(comparePassword('password123', hash)).resolves.toBe(false);
  });

  test('does not match an empty password', async () => {
    const hash = await hashPassword(PASSWORD);
    await expect(comparePassword('', hash)).resolves.toBe(false);
  });

  test('keeps special characters in passwords working', async () => {
    const special = 'Pa$$<word>123!';
    const hash = await hashPassword(special);
    await expect(comparePassword(special, hash)).resolves.toBe(true);
  });
});