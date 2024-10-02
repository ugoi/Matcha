export enum TokenType {
  EmailVerification = "email_verification",
  PasswordReset = "password_reset",
}

export interface CreateTokenInput {
  user_id: string;
  token_type: TokenType;
  expiry_date: Date;
}

export interface Token {
  token_id: string;
  user_id: string;
  token_type: TokenType;
  expiry_date: Date;
  used: boolean;
}
