import {
  Box,
  Heading,
  Flex,
  Container,
  HStack,
  Separator,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import { Header } from "../components/Header";
import { MdOutlineLocationOn } from "react-icons/md";
import { useLocation } from "react-router-dom";

interface IDefaultLayoutProps {
  titulo?: string;
  children: ReactNode;
  subtituloSuperior?: string;
  subtituloInferior?: string;
}

export function DefaultLayout({
  children,
  titulo,
  subtituloSuperior,
  subtituloInferior,
}: IDefaultLayoutProps) {
  const location = useLocation();
  const isInicio = location.pathname === "/";
  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      background="#F3F4F1"
    >
      <Header />
      <Separator />
      <Container maxW="1200px" mx="auto" px="5" width="100%" pt={6} pb={6}>
        <Flex gap="2" direction="column" mb="4">
          <HStack align="center" fontSize="xl" gap="1">
            {isInicio && <MdOutlineLocationOn />}
            {subtituloSuperior && (
              <Heading size="sm">{subtituloSuperior}</Heading>
            )}
          </HStack>

          <Heading size={{ base: "2xl", lg: "4xl" }} fontWeight="extrabold">
            {titulo}
          </Heading>

          {subtituloInferior && (
            <Heading size="sm">{subtituloInferior}</Heading>
          )}
        </Flex>

        <Box>{children}</Box>
      </Container>
    </Box>
  );
}
