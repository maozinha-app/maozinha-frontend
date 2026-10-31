/** Resposta paginada da API (PageResponse do backend). */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ApiProblem {
  type?: string;
  title?: string;
  status?: number;

  detail?: string;
  instance?: string;
  timestamp?: string;

  campos?: { campo: string; mensagem: string }[];
}
