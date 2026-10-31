import { api } from "./api";

export interface IAvaliacao {
  id: number;
  rating: number;
  comment: string | null;
  reviewDate: string;
  reviewerId: number;
  reviewerName: string;
  reviewedId: number;
  reviewedName: string;
  jobId: number;
  jobTitle: string;
  removedByModeration: boolean;
}

export interface ICriarAvaliacao {
  /** De 1 a 5 */
  rating: number;
  /** Até 500 caracteres */
  comment?: string;
  /** Quem está sendo avaliado */
  reviewedUserId: number;
}

// Avaliações recebidas por um usuário (da mais recente para a mais antiga).
export const getReviewsUser = async (id: number): Promise<IAvaliacao[]> => {
  const response = await api.get<IAvaliacao[]>(`/users/${id}/reviews`);
  return response.data;
};

// Só funciona em serviço CONCLUIDO e uma vez por par avaliador/avaliado.
export const createReview = async (
  servicoId: number,
  dados: ICriarAvaliacao,
): Promise<IAvaliacao> => {
  const response = await api.post<IAvaliacao>(
    `/services/${servicoId}/reviews`,
    dados,
  );
  return response.data;
};
