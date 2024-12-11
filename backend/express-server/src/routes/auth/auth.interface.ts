import { SuccessResponse } from "../../interfaces/response.js";
import { User } from "../users/users.interface.js";

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginOutput {
  token: string;
  user: User;
}

export interface CreateAccountInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}
