import {
  Box,
  Heading,
  HStack,
  Image,
  Container,
  VStack,
} from "@chakra-ui/react";
import logo from "../assets/Maozinha-favicon.png";
import { Tabs, Button, Avatar } from "@chakra-ui/react";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import { MdHome, MdSearch, MdOutlinePerson2 } from "react-icons/md";
import { IoMdClipboard } from "react-icons/io";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import { useContext } from "react";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const getActiveTab = (pathname: string) => {
    if (
      pathname.startsWith("/meu-perfil") ||
      pathname.startsWith("/perfil") ||
      pathname.startsWith("/editar-perfil") ||
      pathname.startsWith("/avaliar-usuario") ||
      pathname.startsWith("/avaliacao-realizada") ||
      pathname.startsWith("/reputacao")
    )
      return "meu-perfil";

    if (
      pathname.startsWith("/explorar") ||
      pathname.startsWith("/detalhe-servico") ||
      pathname.startsWith("/servico-selecionado") ||
      pathname.startsWith("/servico-em-andamento") ||
      pathname.startsWith("/servico-concluido-perfil")
    )
      return "explorar";

    if (
      pathname.startsWith("/meus-servicos") ||
      pathname.startsWith("/criar") ||
      pathname.startsWith("/editar-servico") ||
      pathname.startsWith("/gerenciar-servico-publicado") ||
      pathname.startsWith("/lista-interessados") ||
      pathname.startsWith("/selecao-interessados") ||
      pathname.startsWith("/servico-cancelado")
    )
      return "meus-servicos";

    return "inicio";
  };

  const currentTab = getActiveTab(location.pathname);

  const handleTabChange = (details: { value: string }) => {
    if (details.value === "inicio") navigate("/");
    else if (details.value === "meus-servicos") navigate("/meus-servicos");
    else if (details.value === "explorar") navigate("/explorar");
    else if (details.value === "meu-perfil") navigate("/meu-perfil");
  };

  return (
    <>
      <Box
        p="5"
        backgroundColor="#f3f4f19e"
        position="sticky"
        top="0"
        zIndex="docked"
        backdropFilter="blur(8px)"
      >
        <Container
          maxW="1200px"
          mx="auto"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={{ base: 0, lg: 5 }}
        >
          <HStack gap="6">
            {/* Logo */}
            <HStack>
              <Image src={logo} height="36px" alt="Mãozinha" />
              <Heading fontWeight="bold" size="2xl">
                mãozinha
              </Heading>
            </HStack>

            {/* Abas */}
            <Tabs.Root
              hideBelow="lg"
              value={currentTab}
              variant="plain"
              onValueChange={(details) => {
                if (details.value === "inicio") navigate("/");
                else if (details.value === "meus-servicos")
                  navigate("/meus-servicos");
                else if (details.value === "explorar") navigate("/explorar");
                else if (details.value === "meu-perfil")
                  navigate("/meu-perfil");
              }}
            >
              <Tabs.List bg="#E9ECE6" rounded="14px" p="2">
                <Tabs.Trigger value="inicio">Início</Tabs.Trigger>
                <Tabs.Trigger value="explorar">Explorar</Tabs.Trigger>
                <Tabs.Trigger value="meus-servicos">Meus serviços</Tabs.Trigger>
                <Tabs.Trigger value="meu-perfil">Perfil</Tabs.Trigger>
                <Tabs.Indicator rounded="11px" />
              </Tabs.List>
            </Tabs.Root>
          </HStack>

          {/* Botão publicar + Perfil */}
          <HStack gap="5">
            <Button
              hideBelow="md"
              rounded="13px"
              background="#1F7A50"
              fontSize="15px"
              fontWeight="bold"
            >
              + Publicar serviço
            </Button>
            <RouterLink to="/meu-perfil">
              <Avatar.Root
                shape="rounded"
                size="md"
                outlineColor="#fff"
                outlineStyle="solid"
                background="#F6D8C5"
              >
                <Avatar.Fallback
                  name={auth.user?.name}
                  fontWeight="extrabold"
                />
                <Avatar.Image src="" />
              </Avatar.Root>
            </RouterLink>
          </HStack>
        </Container>
      </Box>

      {/* --- MENU INFERIOR FIXO (Mobile) --- */}
      <Box
        display={{ base: "block", lg: "none" }}
        position="fixed"
        bottom="0"
        left="0"
        w="100%"
        bg="white"
        borderTopWidth="1px"
        borderColor="gray.200"
        zIndex="sticky"
        shadow="md"
        py="2"
      >
        <Tabs.Root
          value={currentTab}
          variant="plain"
          fitted
          onValueChange={handleTabChange}
        >
          <Tabs.List display="flex" justifyContent="space-around">
            <Tabs.Trigger
              value="inicio"
              cursor="pointer"
              fontSize={12}
              color="#6B756F"
              _selected={{ color: "#1F7A50" }}
            >
              <VStack gap={0}>
                <MdHome size={26} />
                Início
              </VStack>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="explorar"
              cursor="pointer"
              fontSize={12}
              color="#6B756F"
              _selected={{ color: "#1F7A50" }}
            >
              <VStack gap={0}>
                <MdSearch size={26} />
                Explorar
              </VStack>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="meus-servicos"
              cursor="pointer"
              fontSize={12}
              color="#6B756F"
              _selected={{ color: "#1F7A50" }}
            >
              <VStack gap={0}>
                <IoMdClipboard size={26} />
                Serviços
              </VStack>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="meu-perfil"
              cursor="pointer"
              fontSize={12}
              color="#6B756F"
              _selected={{ color: "#1F7A50" }}
            >
              <VStack gap={0}>
                <MdOutlinePerson2 size={26} />
                Perfil
              </VStack>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </Box>
    </>
  );
}
