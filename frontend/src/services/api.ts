import axios, { isAxiosError, type InternalAxiosRequestConfig } from "axios";

import type { ApiProblem } from "@/types/Api";

// VITE_API_URL deve incluir o prefixo /api. Ex.: http://localhost:8080/api
const baseURL = import.meta.env.VITE_API_URL;

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Cliente sem interceptors, usado só para renovar o token (evita laço infinito).
const refreshClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface IRefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function limparSessao() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

function encerrarSessao() {
  limparSessao();

  if (!window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

// O access token vale 15 min. Lê o "exp" do JWT para renovar antes de expirar.
function accessTokenExpirado(token: string, margemSegundos = 15): boolean {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: number };

    return (
      typeof exp === "number" && exp * 1000 < Date.now() + margemSegundos * 1000
    );
  } catch {
    return false;
  }
}

async function renovarAccessToken(): Promise<string> {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    throw new Error("Sessão expirada.");
  }

  const response = await refreshClient.post<IRefreshResponse>("/auth/refresh", {
    refreshToken,
  });

  sessionStorage.setItem(ACCESS_TOKEN_KEY, response.data.accessToken);
  // O backend rotaciona o refresh token: o antigo deixa de valer.
  sessionStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);

  return response.data.accessToken;
}

// Garante uma única renovação por vez, mesmo com várias requisições juntas.
let renovacaoEmAndamento: Promise<string> | null = null;

function renovarUmaVez(): Promise<string> {
  renovacaoEmAndamento ??= renovarAccessToken().finally(() => {
    renovacaoEmAndamento = null;
  });

  return renovacaoEmAndamento;
}

function ehRotaDeAuth(url?: string): boolean {
  return !!url && url.startsWith("/auth/");
}

// Adiciona o JWT às requisições protegidas e renova o token se já expirou.
api.interceptors.request.use(async (config) => {
  if (ehRotaDeAuth(config.url)) {
    return config;
  }

  let accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);

  if (
    accessToken &&
    accessTokenExpirado(accessToken) &&
    sessionStorage.getItem(REFRESH_TOKEN_KEY)
  ) {
    try {
      accessToken = await renovarUmaVez();
    } catch {
      encerrarSessao();
      accessToken = null;
    }
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Rede de segurança: se mesmo assim vier 401, tenta renovar e repetir uma vez.
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error) || !error.config) {
      throw error;
    }

    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      original._retry ||
      ehRotaDeAuth(original.url)
    ) {
      throw error;
    }

    original._retry = true;

    try {
      const novoToken = await renovarUmaVez();
      original.headers.Authorization = `Bearer ${novoToken}`;

      return api(original);
    } catch {
      encerrarSessao();
      throw error;
    }
  },
);

/**
 * Extrai a mensagem de erro da API (campo "detail" ou os "campos" da validação).
 * Use no lugar de error.response?.data?.detail em cada tela.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir a operação. Tente novamente.",
): string {
  if (isAxiosError<ApiProblem>(error)) {
    const problema = error.response?.data;

    if (problema?.campos?.length) {
      return problema.campos.map((campo) => campo.mensagem).join(" ");
    }

    if (problema?.detail) {
      return problema.detail;
    }

    if (!error.response) {
      return "Não foi possível conectar ao servidor.";
    }
  }

  return fallback;
}
