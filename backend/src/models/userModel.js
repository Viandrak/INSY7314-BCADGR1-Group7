// Temporary in-memory user store for Part 1.
// Will be replaced with a MongoDB collection in a later part.

const users = [];

function findUserByEmail(email) {
  return users.find((user) => user.email === email);
}

function createUser({ id, email, passwordHash, role }) {
  const newUser = { id, email, passwordHash, role };
  users.push(newUser);
  return newUser;
}

function getAllUsers() {
  return users;
}

module.exports = {
  findUserByEmail,
  createUser,
  getAllUsers,
};