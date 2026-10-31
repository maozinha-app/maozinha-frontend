import { Link, HStack, Heading, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { MdArrowForward } from "react-icons/md";

interface ISectionHeaderProps {
  titulo: string;
  itemsLabel?: string;
  itemsCount?: number;
  linkIsOn?: boolean;
  /** Destino do link da direita (padrão: "#") */
  linkTo?: string;
  /** Texto do link da direita (padrão: "Ver todos") */
  linkLabel?: string;
}

export function SectionHeader({
  titulo,
  itemsLabel,
  itemsCount,
  linkIsOn = false,
  linkTo = "#",
  linkLabel = "Ver todos",
}: ISectionHeaderProps) {
  return (
    <HStack justifyContent="space-between" boxSize="100%">
      <HStack>
        <Heading>{titulo} </Heading>
        <Text fontSize="sm">
          {itemsCount} {itemsLabel}
        </Text>
      </HStack>

      {linkIsOn && (
        <Link asChild color="#1F7A50" fontWeight="semibold">
          <RouterLink to={linkTo}>
            {linkLabel}
            <MdArrowForward />
          </RouterLink>
        </Link>
      )}
    </HStack>
  );
}
