import { User, UserRole } from '../../src/users/users.schema';

// Base user template
export const baseUser: User = {
  _id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  emailVerified: false,
  tosAccepted: true,
  role: UserRole.NORMAL,
  createdBy: 'admin',
  updatedBy: 'admin',
};

export const createUser = (overrides: Partial<User> = {}): User => {
  return {
    ...baseUser,
    ...overrides,
  };
};
