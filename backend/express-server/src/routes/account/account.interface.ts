export interface CreateAccountInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface CreateAccountOutput {
  status: string;
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
    };
  };
}

export interface Account {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  username: string;
  hashed_password: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: Date;
  last_login: Date;
}
