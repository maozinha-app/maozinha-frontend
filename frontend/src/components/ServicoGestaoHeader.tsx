import { Box, Flex, HStack, Text, VStack, Heading } from "@chakra-ui/react";
import { useEffect, useState, type ReactNode } from "react";
import { LuCalendar, LuCheck, LuMapPin } from "react-icons/lu";

import {
  categoryService,
  type IServiceCategory,
} from "@/services/categoryService";
import type { IServico, StatusServico } from "@/services/serviceService";

const ETAPAS: { status: StatusServico; label: string }[] = [
  { status: "ABERTO", label: "Aberto" },
  { status: "SELECIONADO", label: "Selecionado" },
  { status: "EM_ANDAMENTO", label: "Em andamento" },
  { status: "CONCLUIDO", label: "Concluído" },
];

const STATUS_ESTILO: Record<
  StatusServico,
  { label: string; bg: string; color: string }
> = {
  ABERTO: { label: "Aberto", bg: "#EEF6F1", color: "#1F7A50" },
  SELECIONADO: { label: "Selecionado", bg: "#E3EDFB", color: "#2B4F8A" },
  EM_ANDAMENTO: { label: "Em andamento", bg: "#FBEFD6", color: "#8A5A0A" },
  CONCLUIDO: { label: "Concluído", bg: "#EEF6F1", color: "#185B3E" },
  CANCELADO: { label: "Cancelado", bg: "#FBE6E4", color: "#9A2A23" },
};

const formatarValor = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// "YYYY-MM-DD" -> "seg. 28/09/2026" (sem passar por fuso horário)
const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-").map(Number);
  const date = new Date(ano, mes - 1, dia);
  const diaSemana = date.toLocaleDateString("pt-BR", { weekday: "short" });
  return `${diaSemana} ${date.toLocaleDateString("pt-BR")}`;
};

interface IServicoGestaoHeaderProps {
  servico: IServico;
  /** Botões do canto (Ver anúncio, Editar, Cancelar...) */
  acoes?: ReactNode;
}

export function ServicoGestaoHeader({
  servico,
  acoes,
}: IServicoGestaoHeaderProps) {
  const [categoria, setCategoria] = useState<IServiceCategory | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const categorias = await categoryService.getCategories();
        setCategoria(
          categorias.find((c) => c.id === servico.categoryId) ?? null,
        );
      } catch (error) {
        // Só visual: sem categoria o badge fica sem ícone.
        console.error("Erro ao carregar categorias:", error);
      }
    };

    void carregar();
  }, [servico.categoryId]);

  const IconeCategoria = categoria?.icon;
  const estilo = STATUS_ESTILO[servico.status];
  const etapaAtual = ETAPAS.findIndex((e) => e.status === servico.status);

  return (
    <VStack
      align="stretch"
      gap={5}
      bg="white"
      borderRadius="3xl"
      p={{ base: 5, md: 7 }}
    >
      <Flex
        gap={4}
        justify="space-between"
        direction={{ base: "column", md: "row" }}
      >
        <VStack align="flex-start" gap={3} minW={0}>
          <HStack gap={2} wrap="wrap">
            <HStack
              gap={2}
              px={3}
              py={1}
              borderRadius="full"
              bg={categoria?.bgColor ?? "#EEF6F1"}
              color={categoria?.iconColor ?? "#1F7A50"}
              fontSize="sm"
              fontWeight="semibold"
            >
              {IconeCategoria && <IconeCategoria size={14} />}
              <Text>{servico.categoryName}</Text>
            </HStack>

            <HStack
              px={3}
              py={1}
              borderRadius="full"
              bg={estilo.bg}
              color={estilo.color}
              fontSize="sm"
              fontWeight="semibold"
            >
              <Text>{estilo.label}</Text>
            </HStack>
          </HStack>

          <Heading
            as="h2"
            size={{ base: "2xl", md: "3xl" }}
            fontWeight="extrabold"
            letterSpacing="-0.02em"
            color="#202722"
          >
            {servico.title}
          </Heading>

          <HStack gap={4} wrap="wrap" color="#58665D" fontSize="sm">
            <Text fontWeight="extrabold" color="#185B3E" fontSize="md">
              {formatarValor(servico.value)}
            </Text>
            <HStack gap={1}>
              <LuCalendar />
              <Text>{formatarData(servico.serviceDate)}</Text>
            </HStack>
            <HStack gap={1}>
              <LuMapPin />
              <Text>
                {servico.neighborhood}, {servico.city}
              </Text>
            </HStack>
          </HStack>
        </VStack>

        {acoes && (
          <HStack gap={2} wrap="wrap" align="flex-start" flexShrink={0}>
            {acoes}
          </HStack>
        )}
      </Flex>

      {etapaAtual >= 0 && (
        <Flex
          pt={5}
          borderTopWidth="1px"
          borderColor="#EEF0EC"
          align="flex-start"
        >
          {ETAPAS.map((etapa, index) => {
            const concluida =
              index < etapaAtual || servico.status === "CONCLUIDO";
            const atual = index === etapaAtual;

            return (
              <Flex
                key={etapa.status}
                flex="1"
                direction="column"
                align="center"
                position="relative"
              >
                {index > 0 && (
                  <Box
                    position="absolute"
                    top="16px"
                    right="50%"
                    w="100%"
                    h="2px"
                    bg={index <= etapaAtual ? "#1F7A50" : "#DDE3DE"}
                  />
                )}
                <Flex
                  zIndex={1}
                  boxSize="32px"
                  rounded="full"
                  align="center"
                  justify="center"
                  fontSize="sm"
                  fontWeight="bold"
                  bg={concluida || atual ? "#1F7A50" : "white"}
                  color={concluida || atual ? "white" : "#58665D"}
                  borderWidth="2px"
                  borderColor={concluida || atual ? "#1F7A50" : "#DDE3DE"}
                >
                  {concluida ? <LuCheck /> : index + 1}
                </Flex>
                <Text
                  mt={2}
                  fontSize="sm"
                  textAlign="center"
                  fontWeight={atual ? "bold" : "normal"}
                  color={atual ? "#202722" : "#58665D"}
                >
                  {etapa.label}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      )}
    </VStack>
  );
}
