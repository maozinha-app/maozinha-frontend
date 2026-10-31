import { Box, Center, HStack, Text, VStack } from "@chakra-ui/react";
import type { ElementType, ReactNode } from "react";
import { LuChevronRight, LuShapes } from "react-icons/lu";

import type { IServiceCategory } from "@/services/categoryService";
import type { IServico, StatusServico } from "@/services/serviceService";

const STATUS_ESTILO: Record<
  StatusServico,
  { label: string; bg: string; color: string }
> = {
  ABERTO: { label: "Aberto", bg: "#EEF6F1", color: "#1F7A50" },
  SELECIONADO: { label: "Selecionado", bg: "#E3EDFB", color: "#2B4F8A" },
  EM_ANDAMENTO: { label: "Em andamento", bg: "#FBEFD6", color: "#8A5A0A" },
  CONCLUIDO: { label: "Concluído", bg: "#EEF0EC", color: "#185B3E" },
  CANCELADO: { label: "Cancelado", bg: "#FBE6E4", color: "#9A2A23" },
};

const formatarValor = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// "YYYY-MM-DD" -> "28/09/2026" (sem passar por fuso horário)
const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
};

interface IServicoListItemProps {
  servico: IServico;
  categoria?: IServiceCategory;
  /** Linha de baixo do card (ex.: "4 pessoas interessadas") */
  detalhe?: ReactNode;
  iconeDetalhe?: ElementType;
  onClick: () => void;
}

export function ServicoListItem({
  servico,
  categoria,
  detalhe,
  iconeDetalhe: IconeDetalhe,
  onClick,
}: IServicoListItemProps) {
  const IconeCategoria = categoria?.icon ?? LuShapes;
  const estilo = STATUS_ESTILO[servico.status];

  return (
    <HStack
      as="button"
      onClick={onClick}
      gap={4}
      bg="white"
      borderRadius="2xl"
      p={4}
      w="100%"
      textAlign="left"
      cursor="pointer"
      transition="box-shadow 0.15s"
      _hover={{ boxShadow: "md" }}
    >
      <Center
        boxSize="52px"
        flexShrink={0}
        borderRadius="xl"
        bg={categoria?.bgColor ?? "#EEF6F1"}
        color={categoria?.iconColor ?? "#1F7A50"}
      >
        <IconeCategoria size={24} />
      </Center>

      <VStack align="flex-start" gap={1} flex="1" minW={0}>
        <HStack gap={2} wrap="wrap">
          <Text fontWeight="extrabold" color="#202722" fontSize="lg">
            {servico.title}
          </Text>
          <Box
            px={2}
            py="2px"
            borderRadius="full"
            bg={estilo.bg}
            color={estilo.color}
            fontSize="xs"
            fontWeight="bold"
          >
            {estilo.label}
          </Box>
        </HStack>

        <Text fontSize="sm" color="#58665D">
          <Text as="span" fontWeight="extrabold" color="#185B3E">
            {formatarValor(servico.value)}
          </Text>{" "}
          · {formatarData(servico.serviceDate)} · {servico.neighborhood}
        </Text>

        {detalhe && (
          <HStack gap={2} fontSize="sm" color="#58665D">
            {IconeDetalhe && <IconeDetalhe size={14} />}
            <Text>{detalhe}</Text>
          </HStack>
        )}
      </VStack>

      <Box color="#58665D" flexShrink={0}>
        <LuChevronRight size={20} />
      </Box>
    </HStack>
  );
}
