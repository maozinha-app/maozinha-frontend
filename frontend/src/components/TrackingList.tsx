import type { ElementType } from "react";
import { Box, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { LuPartyPopper, LuRefreshCw, LuStar, LuUsers } from "react-icons/lu";

import { TrackingItem } from "@/components/TrackingItem";
import type { ITrackingItem, TrackingTipo } from "@/services/trackingService";

interface IEstiloTracking {
  icone: ElementType;
  corFundo: string;
  corIcone: string;
  /** Texto do botão à direita */
  acao: string;
  /** Rota de destino ao clicar no botão */
  rota: (item: ITrackingItem) => string;
}

const ESTILOS: Record<TrackingTipo, IEstiloTracking> = {
  interessados: {
    icone: LuUsers,
    corFundo: "#DDEEE3",
    corIcone: "#1F7A50",
    acao: "Ver interessados",
    rota: (item) => `/gerenciar-servico-publicado/${item.servicoId}`,
  },
  em_andamento: {
    icone: LuRefreshCw,
    corFundo: "#FBE9D5",
    corIcone: "#B8631B",
    acao: "Gerenciar",
    rota: (item) => `/servico-em-andamento/${item.servicoId}`,
  },
  avaliar: {
    icone: LuStar,
    corFundo: "#F7EFCB",
    corIcone: "#8A6D0B",
    acao: "Avaliar",
    rota: (item) =>
      item.pessoaId
        ? `/avaliar-usuario/${item.servicoId}?usuario=${item.pessoaId}`
        : `/avaliar-usuario/${item.servicoId}`,
  },
  selecionado: {
    icone: LuPartyPopper,
    corFundo: "#E1EBFB",
    corIcone: "#2F5FB3",
    acao: "Ver serviço",
    rota: (item) => `/servico-selecionado/${item.servicoId}`,
  },
};

function descricaoDoItem(item: ITrackingItem): string {
  switch (item.tipo) {
    case "interessados": {
      const quantidade = item.quantidade ?? 0;

      if (quantidade === 0) {
        return "Publicado! Avisamos quando alguém quiser ajudar.";
      }

      const frase = quantidade === 1 ? "pessoa quer" : "pessoas querem";

      return `${quantidade} ${frase} ajudar. Escolha quem vai fazer.`;
    }
    case "em_andamento":
      return "Em andamento. Quando terminar, marque como concluído.";
    case "avaliar":
      return `Concluído! Avalie ${item.pessoa ?? "a outra pessoa"}.`;
    case "selecionado":
      return `Você foi selecionado(a) por ${item.pessoa ?? "quem publicou"}! Combine pelo WhatsApp.`;
  }
}

interface ITrackingListProps {
  itens: ITrackingItem[];
  carregando?: boolean;
}

const CARD_PROPS = {
  bg: "white",
  borderRadius: "3xl",
  boxShadow:
    "0 1px 2px rgba(24, 39, 30, 0.04), 0 4px 14px rgba(24, 39, 30, 0.05)",
  w: "100%",
} as const;

export function TrackingList({
  itens,
  carregando = false,
}: ITrackingListProps) {
  const navigate = useNavigate();

  if (carregando || itens.length === 0) {
    return (
      <Box {...CARD_PROPS} p={6}>
        <Text fontSize="sm" color="#58665D">
          {carregando ? "Carregando..." : "Nada para acompanhar por enquanto."}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      {...CARD_PROPS}
      overflow="hidden"
      css={{ "& > * + *": { borderTop: "1px solid #EEF1EE" } }}
    >
      {itens.map((item) => {
        const estilo = ESTILOS[item.tipo];

        // Tipo desconhecido (ex.: novo tipo vindo da API): não quebra a tela
        if (!estilo) return null;

        return (
          <TrackingItem
            key={item.id}
            icone={estilo.icone}
            corFundo={estilo.corFundo}
            corIcone={estilo.corIcone}
            titulo={item.titulo}
            descricao={descricaoDoItem(item)}
            acao={
              item.tipo === "interessados" && !item.quantidade
                ? "Gerenciar"
                : estilo.acao
            }
            onAcao={() => navigate(estilo.rota(item))}
          />
        );
      })}
    </Box>
  );
}
