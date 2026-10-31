import type { User } from "@/types/User";
import { AuthContext } from "./AuthContext";
import { useEffect, useState, type ReactNode } from "react";

import { signin as login, logout } from "@/services/authService";
import { getCurrentUser } from "@/services/userService";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");

        if (!token) {
          if (!cancelled) setUser(null);
          return;
        }

        const data = await getCurrentUser();
        const currentUser = data?.user ?? data;

        if (!cancelled) {
          setUser(currentUser as User);
        }
      } catch {
        logout();

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const signin = async (email: string, password: string): Promise<boolean> => {
    try {
      // Faz login e armazena os tokens.
      await login(email, password);

      // Busca os dados do usuário autenticado.
      const data = await getCurrentUser();
      const currentUser = data?.user ?? data;

      setUser(currentUser as User);

      return true;
    } catch (error) {
      setUser(null);
      logout();

      console.error("Erro ao entrar:", error);
      return false;
    }
  };

  const signout = async (): Promise<void> => {
    logout();
    setUser(null);
  };

  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, signin, signout, updateUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
