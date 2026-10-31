import type { ElementType } from "react";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { LuChevronRight } from "react-icons/lu";

import { IconTile } from "@/components/IconTile";

export interface ITrackingItemProps {
  icone: ElementType;
  corFundo: string;
  corIcone: string;
  titulo: string;
  descricao: string;
  /** Texto do botão à direita */
  acao: string;
  onAcao: () => void;
}

export function TrackingItem({
  icone,
  corFundo,
  corIcone,
  titulo,
  descricao,
  acao,
  onAcao,
}: ITrackingItemProps) {
  return (
    <Flex align="center" gap={3} px={4} py={3.5}>
      <IconTile
        icone={icone}
        size="40px"
        iconSize="20px"
        borderRadius="12px"
        backgroundColor={corFundo}
        iconColor={corIcone}
      />

      <Box flex="1" minW={0}>
        <Text
          fontWeight="bold"
          fontSize="15px"
          lineHeight="1.3"
          color="#202722"
          truncate
        >
          {titulo}
        </Text>

        <Text fontSize="13px" lineHeight="1.4" color="#58665D">
          {descricao}
        </Text>
      </Box>

      <Button
        variant="outline"
        size="sm"
        rounded="xl"
        bg="white"
        color="#202722"
        borderColor="#DDE3DE"
        fontWeight="bold"
        flexShrink={0}
        _hover={{ bg: "#F6F7F5" }}
        onClick={onAcao}
      >
        {acao}
        <LuChevronRight />
      </Button>
    </Flex>
  );
}
