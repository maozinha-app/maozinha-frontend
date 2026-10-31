import { api } from "./api";
import type { User } from "@/types/User";

export interface IAtualizarPerfil {
  name: string;
  whatsapp: string;
  city: string;
  neighborhood: string;
}

export const getCurrentUser = async () => {
  const response = await api.get("/users/me");
  return response.data;
};

export const updateMyProfile = async (
  dados: IAtualizarPerfil,
): Promise<User> => {
  const response = await api.put<User>("/users/me", dados);
  return response.data;
};

export interface IPerfilPublico {
  id: number;
  name: string;
  city: string;
  neighborhood: string;
  averageRating: number | null;
  totalReviews: number;
  skills: string[];
  createdAt: string;
}

// Perfil de outro usuário (sem WhatsApp nem e-mail).
export const getPublicProfile = async (id: number): Promise<IPerfilPublico> => {
  const response = await api.get<IPerfilPublico>(`/users/${id}`);
  return response.data;
};
