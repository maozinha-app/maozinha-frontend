import type { ElementType } from "react";
import { Box, Flex, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { LuCalendar, LuMapPin, LuShapes } from "react-icons/lu";
import { MdCheckCircleOutline, MdStar } from "react-icons/md";

export interface ICardAdCategoria {
  name: string;
  icon?: ElementType;
  bgColor?: string;
  iconColor?: string;
}

export interface ICardAdProps {
  titulo: string;
  valor: number;
  data: string;
  bairro: string;
  cidade: string;
  uf?: string;
  /** Categoria do serviço (aceita o IServiceCategory do categoryService) */
  categoria?: ICardAdCategoria;
  /** Mostra a tag "Seu serviço" ao lado da categoria */
  proprio?: boolean;
  /** Mostra a tag "Interesse enviado" ao lado da categoria */
  interesseEnviado?: boolean;
  /** Se informado, mostra o rodapé com o prestador */
  nomeUsuario?: string;
  /** Nota do prestador; sem nota aparece "—" */
  avaliacao?: number | null;
  /** Quantidade de avaliações, exibida entre parênteses */
  totalAvaliacoes?: number;
  onClick?: () => void;
}

// Cores do avatar com iniciais (escolhidas pelo nome, sempre a mesma por pessoa)
const AVATARES = [
  { bg: "#F8DCCB", color: "#8A4A12" },
  { bg: "#D6E6F7", color: "#2F5FB3" },
  { bg: "#DDEEE3", color: "#20583D" },
  { bg: "#E6E0F5", color: "#5A3FA8" },
  { bg: "#F8D9E3", color: "#9C2A52" },
];

function corDoAvatar(nome: string) {
  const soma = [...nome].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATARES[soma % AVATARES.length];
}

function formataValor(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formataData(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);

  // Ex.: "seg. 28/09/2026"
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function formataNota(avaliacao?: number | null, total?: number): string {
  if (avaliacao == null) return "—";
  const nota = avaliacao.toFixed(1).replace(".", ",");
  return total != null ? `${nota} (${total})` : nota;
}

export function CardAd({
  titulo,
  valor,
  data,
  bairro,
  cidade,
  uf = "MA",
  categoria,
  proprio = false,
  interesseEnviado = false,
  nomeUsuario,
  avaliacao,
  totalAvaliacoes,
  onClick,
}: ICardAdProps) {
  const CategoriaIcon = categoria?.icon ?? LuShapes;
  const avatar = nomeUsuario ? corDoAvatar(nomeUsuario) : undefined;

  return (
    <Box
      bg="white"
      borderRadius="3xl"
      p={5}
      boxShadow="0 1px 2px rgba(24, 39, 30, 0.04), 0 4px 14px rgba(24, 39, 30, 0.05)"
      display="flex"
      flexDirection="column"
      gap={3}
      minW={0}
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      transition="transform 0.2s, box-shadow 0.2s"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow:
          "0 1px 2px rgba(24, 39, 30, 0.05), 0 10px 24px rgba(24, 39, 30, 0.1)",
      }}
    >
      {/* Categoria + tags de status */}
      <Flex align="center" gap={2} wrap="wrap">
        <HStack
          bg={categoria?.bgColor ?? "#EEF1EE"}
          color={categoria?.iconColor ?? "#58665D"}
          borderRadius="full"
          px={3}
          py={1.5}
          gap={1.5}
        >
          <CategoriaIcon size={16} />
          <Text fontSize="sm" fontWeight="medium" lineHeight="1">
            {categoria?.name ?? "Outros"}
          </Text>
        </HStack>

        {proprio && (
          <Box bg="#EEF1EE" color="#303B34" borderRadius="full" px={3} py={1.5}>
            <Text fontSize="sm" fontWeight="semibold" lineHeight="1">
              Seu serviço
            </Text>
          </Box>
        )}

        {interesseEnviado && (
          <HStack color="#185B3E" gap={1.5} py={1.5} ml="auto">
            <MdCheckCircleOutline size={16} />
            <Text fontSize="sm" fontWeight="semibold" lineHeight="1">
              Interesse enviado
            </Text>
          </HStack>
        )}
      </Flex>

      {/* Título e valor */}
      <Box>
        <Heading
          as="h3"
          fontSize="lg"
          fontWeight="bold"
          lineHeight="1.3"
          letterSpacing="-0.01em"
          color="#202722"
          mb={3}
        >
          {titulo}
        </Heading>

        <Text
          color="#185B3E"
          fontSize="3xl"
          fontWeight="extrabold"
          letterSpacing="-0.02em"
          lineHeight="1.1"
        >
          {formataValor(valor)}
        </Text>
      </Box>

      {/* Data e localização */}
      <VStack align="stretch" gap={1.5} color="#58665D">
        <HStack gap={2.5} align="center">
          <Box flexShrink={0}>
            <LuCalendar size={18} />
          </Box>

          <Text fontSize="sm">{formataData(data)}</Text>
        </HStack>

        <HStack gap={2.5} align="start">
          <Box mt="2px" flexShrink={0}>
            <LuMapPin size={18} />
          </Box>

          <Text fontSize="sm">
            {bairro}, {cidade} - {uf}
          </Text>
        </HStack>
      </VStack>

      {/* Prestador */}
      {nomeUsuario && avatar && (
        <Flex
          mt="auto"
          pt={4}
          borderTop="1px solid"
          borderColor="#EEF1EE"
          align="center"
          justify="space-between"
          gap={2}
        >
          <HStack gap={2.5} minW={0}>
            <Flex
              boxSize="36px"
              flexShrink={0}
              borderRadius="xl"
              bg={avatar.bg}
              color={avatar.color}
              align="center"
              justify="center"
              fontSize="xs"
              fontWeight="bold"
            >
              {iniciais(nomeUsuario)}
            </Flex>

            <Text fontSize="sm" fontWeight="semibold" color="#202722" truncate>
              {nomeUsuario}
            </Text>
          </HStack>

          <HStack gap={1} flexShrink={0}>
            <MdStar color="#E9A008" size={18} />

            <Text fontSize="sm" fontWeight="semibold" color="#202722">
              {formataNota(avaliacao, totalAvaliacoes)}
            </Text>
          </HStack>
        </Flex>
      )}
    </Box>
  );
}
