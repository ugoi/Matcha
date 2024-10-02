export interface RegisterInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

export interface RegisterOutput {
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
