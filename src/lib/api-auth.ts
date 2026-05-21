import { supabaseAdmin } from "./supabase/admin";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function getAuthenticatedUser(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Token tidak ditemukan", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: verifyError } = await supabaseAdmin.auth.getUser(token);

  if (verifyError || !userData.user) {
    throw new AuthError("Token tidak valid atau sudah kadaluarsa", 401);
  }

  const role = userData.user.user_metadata?.role as string;
  if (!role) {
    throw new AuthError("Akun tidak memiliki role", 403);
  }

  return {
    id: userData.user.id,
    email: userData.user.email!,
    role,
  };
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}
