export interface User {
  user_id: string;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: Date;
}

export class ProtectedUser {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: Date;

  constructor(user: User) {
    this.user_id = user.user_id;
    this.username = user.username;
    this.email = user.email;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.phone = user.phone;
    this.is_email_verified = user.is_email_verified;
    this.is_phone_verified = user.is_phone_verified;
    this.created_at = user.created_at;
  }
}

export interface CreateUserInput {
  first_name?: string;
  last_name?: string;
  username?: string;
  email: string;
  password_hash?: string;
  is_email_verified?: boolean;
  created_at?: Date;
}

export interface UpdateUserInput {
  user_id: string;
  data: {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    is_email_verified?: boolean;
  };
}

export const mockUser: User = {
  user_id: "1",
  username: "test",
  email: "test@gmail.com",
  password_hash: "test",
  first_name: "test",
  last_name: "test",
  phone: "1234567890",
  is_email_verified: true,
  is_phone_verified: true,
  created_at: new Date(),
};
