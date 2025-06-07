import { AuthProvider } from '../../src/common/enums/auth-provider.enum';
import { User, UserRole } from '../../src/users/users.schema';

// Base user template
export const baseUser: User = {
  _id: '1',
  cid: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: '123456',
  provider: AuthProvider.EMAIL,
  emailVerified: false,
  tosAccepted: true,
  role: UserRole.NORMAL,
  createdBy: '',
};

export const createUser = (overrides: Partial<User> = {}): User => {
  return {
    ...baseUser,
    ...overrides,
  };
};
