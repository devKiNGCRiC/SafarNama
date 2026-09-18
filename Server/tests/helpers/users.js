import UserModel from "../../Models/userModel.js";
import { createSecureToken } from "../../utils/security.js";

export async function createUser(overrides = {}) {
  const n = Math.random().toString(36).slice(2, 8);
  const user = await UserModel.create({
    username: `user_${n}`,
    email: `${n}@example.com`,
    password: "Str0ng@Pass1",
    firstName: "Test",
    lastName: "User",
    ...overrides,
  });
  const token = createSecureToken(user._id, { userRole: user.role });
  return { user, token, auth: { Authorization: `Bearer ${token}` } };
}
