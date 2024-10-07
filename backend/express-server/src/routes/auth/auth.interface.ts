export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginOutput {
  status: string;
  data: {
    token: string;
  };
}

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
    title: string;
  };
}
