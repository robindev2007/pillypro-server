// Define Auth interfaces here

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profile?: string | null;
  location: string;
  isAccountVerified: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
