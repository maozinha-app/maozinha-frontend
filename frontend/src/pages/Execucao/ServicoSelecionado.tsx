import {
  Alert,
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  LuCalendar,
  LuBanknote,
  LuMapPin,
  LuMessageSquare,
  LuPartyPopper,
  LuShieldCheck,
} from "react-icons/lu";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { BackButton } from "@/components/BackButton";
import { IconTile } from "@/components/IconTile";
import { Loading } from "@/components/Loading";
import {
  categoryService,
  type IServiceCategory,
} from "@/services/categoryService";
import { getApiErrorMessage } from "@/services/api";
import { interestService, type IInteresse } from "@/services/interestService";
import { serviceService, type IServico } from "@/services/serviceService";

const formatarValor = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// "YYYY-MM-DD" -> "dom. 27/09/2026" (sem passar por fuso horário)
const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-").map(Number);
  const date = new Date(ano, mes - 1, dia);
  const diaSemana = date.toLocaleDateString("pt-BR", { weekday: "short" });
  return `${diaSemana} ${date.toLocaleDateString("pt-BR")}`;
};

const STATUS_LABEL: Record<IServico["status"], string> = {
  ABERTO: "Aberto",
  SELECIONADO: "Selecionado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export function ServicoSelecionado() {
  const { id } = useParams();

  const [servico, setServico] = useState<IServico | null>(null);
  const [categoria, setCategoria] = useState<IServiceCategory | null>(null);
  const [meuInteresse, setMeuInteresse] = useState<IInteresse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      const servicoId = Number(id);

      if (!id || Number.isNaN(servicoId)) {
        setErro("Serviço não encontrado.");
        setCarregando(false);
        return;
      }

      try {
        const [dadosServico, interesses] = await Promise.all([
          serviceService.getServicoPorId(servicoId),
          interestService.getMeusInteresses(),
        ]);

        setServico(dadosServico);
        setMeuInteresse(
          interesses.find((interesse) => interesse.jobId === servicoId) ?? null,
        );

        // O ícone/cor da categoria é só visual: se falhar, o badge fica simples.
        try {
          const categorias = await categoryService.getCategories();
          setCategoria(
            categorias.find((c) => c.id === dadosServico.categoryId) ?? null,
          );
        } catch (error) {
          console.error("Erro ao carregar categorias:", error);
        }
      } catch (error) {
        setErro(
          getApiErrorMessage(error, "Não foi possível carregar o serviço."),
        );
      } finally {
        setCarregando(false);
      }
    };

    void carregar();
  }, [id]);

  if (carregando) return <Loading />;

  if (erro || !servico) {
    return (
      <DefaultLayout>
        <Box maxW="1000px" mx="auto" w="100%">
          <VStack align="stretch" gap={4}>
            <BackButton to="" />
            <Alert.Root status="error" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>{erro || "Serviço não encontrado."}</Alert.Title>
            </Alert.Root>
          </VStack>
        </Box>
      </DefaultLayout>
    );
  }

  const foiSelecionado = meuInteresse?.status === "SELECIONADO";
  const IconeCategoria = categoria?.icon;
  const primeiroNome = servico.requesterName.split(" ")[0];

  // O número só vem quando você foi SELECIONADO (GET /users/me/interests).
  const whatsappSolicitante = meuInteresse?.requesterWhatsapp;

  const linkWhatsapp = whatsappSolicitante
    ? `https://wa.me/55${whatsappSolicitante.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá, ${primeiroNome}! Fui selecionado(a) para o serviço "${servico.title}" no Mãozinha.`,
      )}`
    : null;

  return (
    <DefaultLayout>
      <Box maxW="1000px" mx="auto" w="100%">
        <VStack align="stretch" gap={6}>
          <HStack gap={3}>
            <BackButton to="" />
            <Text fontWeight="bold" color="#202722">
              Voltar
            </Text>
          </HStack>

          {!foiSelecionado && (
            <Alert.Root status="warning" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>
                  Você não está selecionado neste serviço
                </Alert.Title>
                <Alert.Description>
                  Esta tela aparece só para quem foi escolhido pelo solicitante.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          <Flex
            gap={6}
            align="flex-start"
            direction={{ base: "column", lg: "row" }}
          >
            {/* Coluna principal */}
            <VStack align="stretch" gap={6} flex="1" w="100%" minW={0}>
              <VStack
                align="stretch"
                gap={5}
                bg="white"
                borderRadius="3xl"
                p={{ base: 5, md: 7 }}
              >
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
                    bg="#E3EDFB"
                    color="#2B4F8A"
                    fontSize="sm"
                    fontWeight="semibold"
                  >
                    <Text>{STATUS_LABEL[servico.status]}</Text>
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

                <Flex gap={3} wrap="wrap">
                  <HStack
                    flex="1"
                    minW="200px"
                    gap={3}
                    p={4}
                    borderRadius="2xl"
                    bg="#EEF6F1"
                  >
                    <IconTile
                      icone={LuBanknote}
                      backgroundColor="#DDEEE4"
                      iconColor="#1F7A50"
                    />
                    <Box>
                      <Text fontSize="xs" color="#58665D">
                        Valor fixo
                      </Text>
                      <Text
                        fontSize="xl"
                        fontWeight="extrabold"
                        color="#185B3E"
                      >
                        {formatarValor(servico.value)}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack
                    flex="1"
                    minW="200px"
                    gap={3}
                    p={4}
                    borderRadius="2xl"
                    bg="#F6F7F4"
                  >
                    <IconTile icone={LuCalendar} />
                    <Box>
                      <Text fontSize="xs" color="#58665D">
                        Data
                      </Text>
                      <Text fontWeight="bold" color="#202722">
                        {formatarData(servico.serviceDate)}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack
                    flex="1"
                    minW="200px"
                    gap={3}
                    p={4}
                    borderRadius="2xl"
                    bg="#F6F7F4"
                  >
                    <IconTile icone={LuMapPin} />
                    <Box>
                      <Text fontSize="xs" color="#58665D">
                        Local
                      </Text>
                      <Text fontWeight="bold" color="#202722">
                        {servico.neighborhood}
                      </Text>
                      <Text fontSize="xs" color="#58665D">
                        {servico.city}
                      </Text>
                    </Box>
                  </HStack>
                </Flex>

                <VStack align="stretch" gap={2}>
                  <Heading size="md" fontWeight="bold" color="#202722">
                    O que precisa ser feito
                  </Heading>
                  <Text color="#58665D" whiteSpace="pre-line">
                    {servico.description}
                  </Text>
                </VStack>
              </VStack>

              <HStack
                align="flex-start"
                gap={3}
                bg="white"
                borderRadius="3xl"
                p={{ base: 5, md: 6 }}
              >
                <Box color="#58665D" mt="2px">
                  <LuShieldCheck size={18} />
                </Box>
                <Text fontSize="sm" color="#58665D">
                  Por segurança, mostramos só o bairro e a cidade. O endereço é
                  combinado pelo WhatsApp com quem foi selecionado.
                </Text>
              </HStack>
            </VStack>

            {/* Coluna lateral */}
            <VStack
              align="stretch"
              gap={4}
              w={{ base: "100%", lg: "340px" }}
              flexShrink={0}
            >
              <VStack
                align="stretch"
                gap={4}
                bg="white"
                borderRadius="3xl"
                p={5}
              >
                {foiSelecionado && (
                  <HStack
                    align="flex-start"
                    gap={3}
                    p={4}
                    borderRadius="2xl"
                    bg="#E3EDFB"
                  >
                    <Box color="#2B4F8A" mt="2px">
                      <LuPartyPopper size={22} />
                    </Box>
                    <Box>
                      <Text fontWeight="extrabold" color="#14284B">
                        Você foi selecionado(a)!
                      </Text>
                      <Text fontSize="sm" color="#2B4F8A">
                        Combine o horário e o endereço com {primeiroNome} pelo
                        WhatsApp.
                      </Text>
                    </Box>
                  </HStack>
                )}

                {linkWhatsapp ? (
                  <Button
                    asChild
                    h="56px"
                    borderRadius="16px"
                    bg="#25D366"
                    color="#0B2A17"
                    fontWeight="bold"
                    _hover={{ bg: "#1FB958" }}
                  >
                    <a href={linkWhatsapp} target="_blank" rel="noreferrer">
                      <LuMessageSquare />
                      Chamar no WhatsApp
                    </a>
                  </Button>
                ) : (
                  <>
                    <Button
                      disabled
                      h="56px"
                      borderRadius="16px"
                      fontWeight="bold"
                    >
                      <LuMessageSquare />
                      Chamar no WhatsApp
                    </Button>
                    <Text fontSize="xs" color="#58665D" textAlign="center">
                      O contato de {primeiroNome} ainda não está disponível
                      aqui.
                    </Text>
                  </>
                )}
              </VStack>

              <VStack
                align="stretch"
                gap={4}
                bg="white"
                borderRadius="3xl"
                p={5}
              >
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  letterSpacing="0.06em"
                  color="#58665D"
                >
                  PUBLICADO POR
                </Text>

                <HStack gap={3}>
                  <Avatar.Root
                    shape="rounded"
                    boxSize="56px"
                    background="#F6D8C5"
                  >
                    <Avatar.Fallback name={servico.requesterName} />
                  </Avatar.Root>
                  <Box>
                    <Text fontWeight="extrabold" color="#202722">
                      {servico.requesterName}
                    </Text>
                    <Text fontSize="sm" color="#58665D">
                      {servico.neighborhood}, {servico.city}
                    </Text>
                  </Box>
                </HStack>

                <Button
                  asChild
                  variant="outline"
                  h="48px"
                  borderRadius="16px"
                  fontWeight="bold"
                >
                  <RouterLink to={`/perfil/${servico.requesterId}`}>
                    Ver perfil
                  </RouterLink>
                </Button>
              </VStack>
            </VStack>
          </Flex>
        </VStack>
      </Box>
    </DefaultLayout>
  );
}
