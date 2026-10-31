import { api } from "./api";

export type StatusInteresse =
  | "PENDENTE"
  | "SELECIONADO"
  | "NAO_SELECIONADO"
  | "RETIRADO";

export interface IInteresse {
  id: number;
  status: StatusInteresse;
  userId: number;
  userName: string;
  jobId: number;
  jobTitle: string;
  interestDate: string;

  // Só vêm preenchidos para quem publicou o serviço (GET /services/{id}/interests)
  userCity?: string | null;
  userNeighborhood?: string | null;
  userAverageRating?: number | null;
  userTotalReviews?: number | null;
  userSkills?: string[];
  /** WhatsApp de quem foi SELECIONADO (só para quem publicou) */
  userWhatsapp?: string | null;

  // Só vêm preenchidos para quem demonstrou interesse (GET /users/me/interests)
  requesterName?: string | null;
  /** WhatsApp de quem publicou (só quando você foi SELECIONADO) */
  requesterWhatsapp?: string | null;
}

export const interestService = {
  // Demonstra interesse em um serviço ABERTO que não seja seu.
  demonstrarInteresse: async (servicoId: number): Promise<IInteresse> => {
    const response = await api.post<IInteresse>(
      `/services/${servicoId}/interests`,
    );
    return response.data;
  },

  // Quem demonstrou interesse desiste dele.
  retirarInteresse: async (interesseId: number): Promise<void> => {
    await api.patch(`/interests/${interesseId}`);
  },

  // Só o solicitante. Muda o serviço para SELECIONADO (limite: 5 selecionados).
  selecionarInteressado: async (interesseId: number): Promise<void> => {
    await api.patch(`/interests/${interesseId}/select`);
  },

  // Só o solicitante.
  rejeitarInteressado: async (interesseId: number): Promise<void> => {
    await api.patch(`/interests/${interesseId}/reject`);
  },

  getInteressadosDoServico: async (
    servicoId: number,
  ): Promise<IInteresse[]> => {
    const response = await api.get<IInteresse[]>(
      `/services/${servicoId}/interests`,
    );
    return response.data;
  },

  // Quantas pessoas têm interesse ativo (pendente ou selecionado). Qualquer usuário logado.
  getContagem: async (servicoId: number): Promise<number> => {
    const response = await api.get<{ total: number }>(
      `/services/${servicoId}/interests/count`,
    );
    return response.data.total;
  },

  getMeusInteresses: async (): Promise<IInteresse[]> => {
    const response = await api.get<IInteresse[]>("/users/me/interests");
    return response.data;
  },
};
