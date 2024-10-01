export interface RegisterInput { email: string; password: string; }

export interface RegisterOutput { status: string; data: { user: { id: string; email: string; }; }; }
