import { api } from "./api";
import type { User } from "@/types/User";

export interface ISkill {
  id: number;
  name: string;
}

export const skillService = {
  // Catálogo de habilidades disponíveis
  getSkills: async (): Promise<ISkill[]> => {
    const response = await api.get<ISkill[]>("/skills");
    return response.data;
  },

  // Cria uma habilidade nova no catálogo
  createSkill: async (name: string): Promise<ISkill> => {
    const response = await api.post<ISkill>("/skills", { name });
    return response.data;
  },

  // O perfil devolve só os nomes das habilidades; para remover, use o id do catálogo.
  addToMyProfile: async (skillId: number): Promise<User> => {
    const response = await api.post<User>(`/users/me/skills/${skillId}`);
    return response.data;
  },

  removeFromMyProfile: async (skillId: number): Promise<User> => {
    const response = await api.delete<User>(`/users/me/skills/${skillId}`);
    return response.data;
  },
};