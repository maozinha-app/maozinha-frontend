import { api, getApiErrorMessage } from "@/services/api";

// Login: recebe e armazena os tokens.
export const signin = async (email: string, password: string) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  const { accessToken, refreshToken } = response.data;

  if (!accessToken) {
    throw new Error("O backend não retornou o access token.");
  }

  sessionStorage.setItem("accessToken", accessToken);

  if (refreshToken) {
    sessionStorage.setItem("refreshToken", refreshToken);
  }

  return response.data;
};

// Valida a sessão consultando o perfil.
export const validateToken = async (): Promise<boolean> => {
  const accessToken = sessionStorage.getItem("accessToken");

  if (!accessToken) {
    return false;
  }

  try {
    await api.get("/users/me");
    return true;
  } catch {
    logout();
    return false;
  }
};

// Encerra a sessão local (o backend não possui endpoint de logout).
export const logout = (): void => {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
};

export const register = async (userData: object) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao cadastrar usuário"));
  }
};

// Pede o e-mail de recuperação. A resposta é sempre a mesma, exista ou não o e-mail.
export const forgotPassword = async (email: string): Promise<string> => {
  const response = await api.post<{ message: string }>(
    "/auth/forgot-password",
    { email },
  );

  return response.data.message;
};

// Define a nova senha usando o token recebido por e-mail.
export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<string> => {
  const response = await api.post<{ message: string }>("/auth/reset-password", {
    token,
    newPassword,
  });

  return response.data.message;
};
