import { api } from "./api";

export type TrackingTipo =
  | "interessados"
  | "em_andamento"
  | "avaliar"
  | "selecionado";

export interface ITrackingItem {
  id: string;
  tipo: TrackingTipo;
  /** Serviço ao qual o item se refere (usado para navegar até ele) */
  servicoId: string;
  titulo: string;
  /** Quantidade de interessados (tipo "interessados") */
  quantidade?: number;
  /** Outra pessoa envolvida (tipos "avaliar" e "selecionado") */
  pessoaId?: string;
  pessoa?: string;
}

// Resposta de GET /users/me/tracking
interface ITrackingResponse {
  type: "INTERESSADOS" | "EM_ANDAMENTO" | "AVALIAR" | "SELECIONADO";
  jobId: number;
  jobTitle: string;
  quantity: number | null;
  personId: number | null;
  personName: string | null;
}

const TIPOS: Record<ITrackingResponse["type"], TrackingTipo> = {
  INTERESSADOS: "interessados",
  EM_ANDAMENTO: "em_andamento",
  AVALIAR: "avaliar",
  SELECIONADO: "selecionado",
};

export const trackingService = {
  getItensParaAcompanhar: async (): Promise<ITrackingItem[]> => {
    const response = await api.get<ITrackingResponse[]>("/users/me/tracking");

    return response.data.map((item) => ({
      // Um serviço pode aparecer mais de uma vez (ex.: avaliar duas pessoas)
      id: `${item.type}-${item.jobId}-${item.personId ?? 0}`,
      tipo: TIPOS[item.type],
      servicoId: String(item.jobId),
      titulo: item.jobTitle,
      quantidade: item.quantity ?? undefined,
      pessoaId: item.personId !== null ? String(item.personId) : undefined,
      // Só o primeiro nome, como no protótipo
      pessoa: item.personName?.split(" ")[0],
    }));
  },
};
