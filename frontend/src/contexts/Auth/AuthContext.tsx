import type { User } from "@/types/User";
import { createContext } from "react";

export type AuthContextType = {
  user: User | null;
  signin: (email: string, password: string) => Promise<boolean>;
  signout: () => void;
  /** Atualiza o usuário logado em memória (ex.: depois de editar o perfil). */
  updateUser: (user: User) => void;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextType>(null!);
