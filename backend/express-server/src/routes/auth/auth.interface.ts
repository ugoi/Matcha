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
