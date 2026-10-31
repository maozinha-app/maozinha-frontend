import { api } from "./api";
import type { PageResponse } from "@/types/Api";

export type StatusServico =
  | "ABERTO"
  | "SELECIONADO"
  | "EM_ANDAMENTO"
  | "CONCLUIDO"
  | "CANCELADO";

// Serviço como a API devolve (JobResponse)
export interface IServico {
  id: number;
  title: string;
  description: string;
  value: number;
  /** Data marcada para o serviço: "YYYY-MM-DD" */
  serviceDate: string;
  city: string;
  neighborhood: string;
  status: StatusServico;
  requesterId: number;
  requesterName: string;
  categoryId: number;
  categoryName: string;
  hiddenByModeration: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mesmo formato do IServico (nome mantido porque DetalhesServico já usa)
export type IServicoDetalhes = IServico;

export interface ICriarServico {
  title: string;
  description: string;
  categoryId: number;
  value: number;
  city: string;
  neighborhood: string;
  serviceDate: string;
}

export interface IAtualizarServico extends ICriarServico {
  status: StatusServico;
}

export interface IListarServicosParams {
  /** Começa em 0 */
  page?: number;
  size?: number;
  /** Só serviços abertos deste usuário */
  requesterId?: number;
}

export const serviceService = {
  // Lista só serviços ABERTOS e não ocultados pela moderação.
  getServicos: async ({
    page = 0,
    size = 10,
    requesterId,
  }: IListarServicosParams = {}): Promise<PageResponse<IServico>> => {
    const response = await api.get<PageResponse<IServico>>("/services", {
      params: { page, size, ...(requesterId !== undefined && { requesterId }) },
    });
    return response.data;
  },

  // Serviços publicados por mim, em qualquer status.
  getMeusServicos: async ({
    page = 0,
    size = 100,
  }: IListarServicosParams = {}): Promise<PageResponse<IServico>> => {
    const response = await api.get<PageResponse<IServico>>(
      "/users/me/services",
      { params: { page, size } },
    );
    return response.data;
  },

  createServico: async (dados: ICriarServico): Promise<IServico> => {
    const response = await api.post<IServico>("/services", dados);
    return response.data;
  },

  getServicoPorId: async (id: number): Promise<IServico> => {
    const response = await api.get<IServico>(`/services/${id}`);
    return response.data;
  },

  // Só o solicitante pode editar. A API exige TODOS os campos (PUT completo).
  atualizarServico: async (
    id: number,
    dados: IAtualizarServico,
  ): Promise<IServico> => {
    const response = await api.put<IServico>(`/services/${id}`, dados);
    return response.data;
  },

  // Troca só o status (PATCH /services/{id}/status).
  // Aceita EM_ANDAMENTO, CONCLUIDO ou CANCELADO, seguindo a máquina de estados.
  atualizarStatus: async (
    servico: Pick<IServico, "id">,
    status: StatusServico,
  ): Promise<IServico> => {
    const response = await api.patch<IServico>(
      `/services/${servico.id}/status`,
      { status },
    );

    return response.data;
  },

  // Não apaga: muda o status para CANCELADO.
  cancelarServico: async (id: number): Promise<void> => {
    await api.delete(`/services/${id}`);
  },
};
