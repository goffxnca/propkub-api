import { User } from '../../users/users.schema';

export type ProfileResponseDto = Omit<
  User,
  'password' | 'temp_p' | 'emailVToken' | 'passwordReset'
>;
