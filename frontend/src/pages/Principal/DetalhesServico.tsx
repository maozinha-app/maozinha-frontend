import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  SimpleGrid,
  Text,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import { useContext, useEffect, useState, type ElementType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiStar } from "react-icons/hi";
import {
  LuBanknote,
  LuCalendar,
  LuCircleCheck,
  LuClock,
  LuHand,
  LuInfo,
  LuMapPin,
  LuShieldCheck,
  LuUsers,
} from "react-icons/lu";
import { MdArrowBack } from "react-icons/md";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { Loading } from "@/components/Loading";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import { getApiErrorMessage } from "@/services/api";
import {
  categoryService,
  type IServiceCategory,
} from "@/services/categoryService";
import { interestService, type IInteresse } from "@/services/interestService";
import { serviceService, type IServico } from "@/services/serviceService";
import { getPublicProfile, type IPerfilPublico } from "@/services/userService";

const STATUS_ESTILO: Record<
  IServico["status"],
  { label: string; bg: string; color: string }
> = {
  ABERTO: { label: "Aberto", bg: "#EEF6F1", color: "#1F7A50" },
  SELECIONADO: { label: "Selecionado", bg: "#E3EDFB", color: "#2B4F8A" },
  EM_ANDAMENTO: { label: "Em andamento", bg: "#FBEFD6", color: "#8A5A0A" },
  CONCLUIDO: { label: "Concluído", bg: "#EEF6F1", color: "#185B3E" },
  CANCELADO: { label: "Cancelado", bg: "#FBE6E4", color: "#9A2A23" },
};

const CARD = {
  bg: "white",
  borderRadius: "3xl",
  p: { base: 5, md: 7 },
} as const;

const formatarValor = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// "YYYY-MM-DD" -> "ter. 29/09/2026" (sem passar por fuso horário)
const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-").map(Number);
  const date = new Date(ano, mes - 1, dia);
  const diaSemana = date.toLocaleDateString("pt-BR", { weekday: "short" });
  return `${diaSemana} ${date.toLocaleDateString("pt-BR")}`;
};

interface IInfoProps {
  icone: ElementType;
  rotulo: string;
  valor: string;
  detalhe?: string;
}

function InfoTile({ icone: Icone, rotulo, valor, detalhe }: IInfoProps) {
  return (
    <HStack gap={3} bg="#F3F7F4" borderRadius="2xl" p={4} align="center">
      <Flex
        boxSize="40px"
        borderRadius="xl"
        bg="white"
        color="#1F7A50"
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Icone size={18} />
      </Flex>

      <VStack align="flex-start" gap={0} minW={0}>
        <Text fontSize="xs" color="#58665D">
          {rotulo}
        </Text>
        <Text fontWeight="extrabold" color="#202722" lineHeight="1.2">
          {valor}
        </Text>
        {detalhe && (
          <Text fontSize="xs" color="#58665D">
            {detalhe}
          </Text>
        )}
      </VStack>
    </HStack>
  );
}

export function DetalhesServico() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [servico, setServico] = useState<IServico | null>(null);
  const [categoria, setCategoria] = useState<IServiceCategory | null>(null);
  const [solicitante, setSolicitante] = useState<IPerfilPublico | null>(null);
  const [meuInteresse, setMeuInteresse] = useState<IInteresse | null>(null);
  const [totalInteressados, setTotalInteressados] = useState<number | null>(
    null,
  );

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroAcao, setErroAcao] = useState("");

  useEffect(() => {
    const carregar = async () => {
      const servicoId = Number(id);

      if (!id || Number.isNaN(servicoId)) {
        setErro("Serviço não encontrado.");
        setCarregando(false);
        return;
      }

      let dados: IServico;

      try {
        dados = await serviceService.getServicoPorId(servicoId);
        setServico(dados);
      } catch (error) {
        setErro(
          getApiErrorMessage(error, "Não foi possível carregar o serviço."),
        );
        setCarregando(false);
        return;
      }

      // O restante é complementar: se algo falhar, a tela abre mesmo assim.
      const [categorias, perfil, interesses, contagem] =
        await Promise.allSettled([
          categoryService.getCategories(),
          getPublicProfile(dados.requesterId),
          interestService.getMeusInteresses(),
          interestService.getContagem(servicoId),
        ]);

      if (categorias.status === "fulfilled") {
        setCategoria(
          categorias.value.find((c) => c.id === dados.categoryId) ?? null,
        );
      }
      if (perfil.status === "fulfilled") setSolicitante(perfil.value);
      if (interesses.status === "fulfilled") {
        // Interesse retirado conta como "sem interesse".
        setMeuInteresse(
          interesses.value.find(
            (i) => i.jobId === servicoId && i.status !== "RETIRADO",
          ) ?? null,
        );
      }
      if (contagem.status === "fulfilled") setTotalInteressados(contagem.value);

      setCarregando(false);
    };

    void carregar();
  }, [id]);

  const handleInteresse = async () => {
    if (!servico) return;

    setEnviando(true);
    setErroAcao("");

    try {
      const criado = await interestService.demonstrarInteresse(servico.id);

      setMeuInteresse({ ...criado, status: criado.status ?? "PENDENTE" });
      setTotalInteressados((total) => (total === null ? total : total + 1));
    } catch (error) {
      setErroAcao(
        getApiErrorMessage(
          error,
          "Não foi possível demonstrar interesse. Tente novamente.",
        ),
      );
    } finally {
      setEnviando(false);
    }
  };

  const handleRetirar = async () => {
    if (!meuInteresse) return;

    setEnviando(true);
    setErroAcao("");

    try {
      await interestService.retirarInteresse(meuInteresse.id);

      setMeuInteresse(null);
      setTotalInteressados((total) =>
        total === null ? total : Math.max(0, total - 1),
      );
    } catch (error) {
      setErroAcao(
        getApiErrorMessage(error, "Não foi possível retirar o interesse."),
      );
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) return <Loading />;

  if (erro || !servico) {
    return (
      <DefaultLayout>
        <VStack align="stretch" gap={4} maxW="720px" mx="auto" w="100%">
          <Box>
            <IconButton
              aria-label="Voltar"
              rounded="full"
              bg="white"
              color="#000"
              onClick={() => navigate(-1)}
            >
              <MdArrowBack />
            </IconButton>
          </Box>
          <Alert.Root status="error" borderRadius="xl">
            <Alert.Indicator />
            <Alert.Title>{erro || "Serviço não encontrado."}</Alert.Title>
          </Alert.Root>
        </VStack>
      </DefaultLayout>
    );
  }

  const souDono = servico.requesterId === auth.user?.id;
  const IconeCategoria = categoria?.icon;
  const estiloStatus = STATUS_ESTILO[servico.status];
  const primeiroNomeDono = servico.requesterName.split(" ")[0];
  const nota = solicitante?.averageRating
    ? Number(solicitante.averageRating).toFixed(1).replace(".", ",")
    : null;

  const rotaGestao =
    servico.status === "EM_ANDAMENTO" || servico.status === "CONCLUIDO"
      ? `/servico-em-andamento/${servico.id}`
      : servico.status === "CANCELADO"
        ? `/servico-cancelado/${servico.id}`
        : `/gerenciar-servico-publicado/${servico.id}`;

  // ----- Cartão de ação (lado direito) -----
  const cartaoAcao = () => {
    if (souDono) {
      return (
        <VStack {...CARD} align="stretch" gap={4}>
          <Heading as="h3" size="lg" fontWeight="extrabold" color="#202722">
            Este é o seu serviço
          </Heading>
          <Text color="#58665D" fontSize="sm">
            Veja quem demonstrou interesse e acompanhe o andamento.
          </Text>
          <Button
            h="52px"
            borderRadius="16px"
            bg="#1F7A50"
            color="white"
            fontWeight="bold"
            _hover={{ bg: "#185B3E" }}
            onClick={() => navigate(rotaGestao)}
          >
            Gerenciar serviço
          </Button>
        </VStack>
      );
    }

    if (meuInteresse?.status === "SELECIONADO") {
      return (
        <VStack {...CARD} align="stretch" gap={4}>
          <HStack
            gap={3}
            align="flex-start"
            bg="#E3EDFB"
            color="#2B4F8A"
            borderRadius="2xl"
            p={4}
          >
            <LuCircleCheck size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <VStack align="flex-start" gap={1}>
              <Text fontWeight="extrabold">Você foi selecionado(a)!</Text>
              <Text fontSize="sm">
                {primeiroNomeDono} escolheu você. Combine os detalhes pelo
                WhatsApp.
              </Text>
            </VStack>
          </HStack>
          <Button
            h="52px"
            borderRadius="16px"
            bg="#1F7A50"
            color="white"
            fontWeight="bold"
            _hover={{ bg: "#185B3E" }}
            onClick={() => navigate(`/servico-selecionado/${servico.id}`)}
          >
            Ver serviço
          </Button>
        </VStack>
      );
    }

    if (meuInteresse?.status === "NAO_SELECIONADO") {
      return (
        <VStack {...CARD} align="stretch" gap={3}>
          <HStack gap={3} color="#58665D">
            <LuInfo size={18} />
            <Text fontWeight="bold">Não foi dessa vez</Text>
          </HStack>
          <Text color="#58665D" fontSize="sm">
            {primeiroNomeDono} escolheu outra pessoa para este serviço. Há
            outros esperando por uma mãozinha.
          </Text>
          <Button
            variant="outline"
            borderRadius="16px"
            onClick={() => navigate("/explorar")}
          >
            Ver outros serviços
          </Button>
        </VStack>
      );
    }

    if (meuInteresse) {
      // PENDENTE
      return (
        <VStack {...CARD} align="stretch" gap={4}>
          <HStack
            gap={3}
            align="flex-start"
            bg="#EEF6F1"
            color="#1F7A50"
            borderRadius="2xl"
            p={4}
          >
            <LuCircleCheck size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <VStack align="flex-start" gap={1}>
              <Text fontWeight="extrabold">Interesse demonstrado</Text>
              <Text fontSize="sm" color="#3E5A49">
                Agora é com {primeiroNomeDono}: se você for escolhido(a), o
                WhatsApp aparece aqui para vocês combinarem.
              </Text>
            </VStack>
          </HStack>

          <Button
            h="52px"
            borderRadius="16px"
            variant="outline"
            borderColor="#BBD9C6"
            color="#1F7A50"
            bg="#F3F9F5"
            disabled
            _disabled={{ opacity: 1, cursor: "default" }}
          >
            <LuClock /> Aguardando seleção
          </Button>

          {erroAcao && (
            <Text color="#9A2A23" fontSize="sm" textAlign="center">
              {erroAcao}
            </Text>
          )}

          <Button
            variant="ghost"
            color="#B42318"
            fontWeight="bold"
            loading={enviando}
            _hover={{ bg: "#FBE6E4" }}
            onClick={() => void handleRetirar()}
          >
            Retirar interesse
          </Button>
        </VStack>
      );
    }

    if (servico.status !== "ABERTO") {
      return (
        <VStack {...CARD} align="stretch" gap={2}>
          <HStack gap={3} color="#58665D">
            <LuInfo size={18} />
            <Text fontWeight="bold">Serviço indisponível</Text>
          </HStack>
          <Text color="#58665D" fontSize="sm">
            Este serviço não está mais recebendo interessados.
          </Text>
        </VStack>
      );
    }

    return (
      <VStack {...CARD} align="stretch" gap={4}>
        <Heading as="h3" size="lg" fontWeight="extrabold" color="#202722">
          Pode ajudar?
        </Heading>

        <Text color="#58665D" fontSize="sm">
          Ao demonstrar interesse você aceita o valor de{" "}
          <Text as="span" fontWeight="extrabold" color="#185B3E">
            {formatarValor(servico.value)}
          </Text>
          . {primeiroNomeDono} vai ver seu perfil e pode escolher você.
        </Text>

        <Button
          h="56px"
          borderRadius="16px"
          bg="#1F7A50"
          color="white"
          fontWeight="bold"
          fontSize="md"
          loading={enviando}
          _hover={{ bg: "#185B3E" }}
          onClick={() => void handleInteresse()}
        >
          <LuHand /> Tenho interesse
        </Button>

        {erroAcao && (
          <Text color="#9A2A23" fontSize="sm" textAlign="center">
            {erroAcao}
          </Text>
        )}

        <HStack gap={2} align="flex-start" color="#58665D" fontSize="xs">
          <LuInfo size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <Text>O valor é definido por quem publicou. Não há negociação.</Text>
        </HStack>
      </VStack>
    );
  };

  return (
    <DefaultLayout>
      <Box maxW="1100px" mx="auto" w="100%" pb={{ base: 24, md: 10 }}>
        <VStack align="stretch" gap={5}>
          <HStack gap={3}>
            <IconButton
              aria-label="Voltar"
              rounded="full"
              w="44px"
              bg="white"
              color="#000"
              onClick={() => navigate(-1)}
            >
              <MdArrowBack />
            </IconButton>
            <Text fontWeight="bold" color="#202722">
              Voltar
            </Text>
          </HStack>

          {/* Em telas pequenas os blocos se intercalam (card de ação logo após o resumo);
              em telas grandes viram duas colunas. */}
          <Flex
            direction={{ base: "column", lg: "row" }}
            gap={5}
            align="flex-start"
          >
            <VStack
              display={{ base: "contents", lg: "flex" }}
              align="stretch"
              gap={5}
              flex={{ lg: 1.9 }}
              minW={0}
              w={{ lg: "auto" }}
            >
              {/* Resumo */}
              <VStack {...CARD} align="stretch" gap={5} order={1} w="100%">
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

                  <Badge
                    px={3}
                    py={1}
                    borderRadius="full"
                    bg={estiloStatus.bg}
                    color={estiloStatus.color}
                    fontSize="sm"
                    fontWeight="semibold"
                  >
                    {estiloStatus.label}
                  </Badge>
                </HStack>

                <Heading
                  as="h1"
                  size={{ base: "3xl", md: "4xl" }}
                  fontWeight="extrabold"
                  letterSpacing="-0.02em"
                  color="#202722"
                  lineHeight="1.1"
                >
                  {servico.title}
                </Heading>

                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={3}>
                  <InfoTile
                    icone={LuBanknote}
                    rotulo="Valor fixo"
                    valor={formatarValor(servico.value)}
                  />
                  <InfoTile
                    icone={LuCalendar}
                    rotulo="Data"
                    valor={formatarData(servico.serviceDate)}
                  />
                  <InfoTile
                    icone={LuMapPin}
                    rotulo="Local"
                    valor={servico.neighborhood}
                    detalhe={servico.city}
                  />
                  {totalInteressados !== null && (
                    <InfoTile
                      icone={LuUsers}
                      rotulo="Interesse"
                      valor={
                        totalInteressados === 0
                          ? "Ninguém ainda"
                          : totalInteressados === 1
                            ? "1 pessoa interessada"
                            : `${totalInteressados} pessoas interessadas`
                      }
                    />
                  )}
                </SimpleGrid>

                <VStack align="stretch" gap={2}>
                  <Heading
                    as="h3"
                    size="md"
                    fontWeight="extrabold"
                    color="#202722"
                  >
                    O que precisa ser feito
                  </Heading>
                  <Text color="#3F4B43" whiteSpace="pre-wrap">
                    {servico.description}
                  </Text>
                </VStack>
              </VStack>

              {/* Localização aproximada */}
              <VStack {...CARD} align="stretch" gap={4} order={3} w="100%">
                <Heading
                  as="h3"
                  size="md"
                  fontWeight="extrabold"
                  color="#202722"
                >
                  Localização aproximada
                </Heading>

                <Flex
                  h="190px"
                  borderRadius="2xl"
                  align="center"
                  justify="center"
                  position="relative"
                  overflow="hidden"
                  bg="#EAEFEB"
                  backgroundImage="repeating-linear-gradient(135deg, transparent 0 10px, rgba(31,122,80,0.06) 10px 20px)"
                >
                  <Flex
                    boxSize="130px"
                    borderRadius="full"
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor="#1F7A50"
                    bg="rgba(31,122,80,0.10)"
                    align="center"
                    justify="center"
                  >
                    <HStack
                      gap={1}
                      bg="white"
                      px={3}
                      py={1}
                      borderRadius="full"
                      boxShadow="sm"
                      fontWeight="bold"
                      fontSize="sm"
                      color="#202722"
                    >
                      <LuMapPin color="#1F7A50" />
                      <Text>{servico.neighborhood}</Text>
                    </HStack>
                  </Flex>

                  <Text
                    position="absolute"
                    left={3}
                    bottom={2}
                    fontSize="10px"
                    fontFamily="mono"
                    color="#58665D"
                  >
                    mapa do bairro · área aproximada
                  </Text>
                </Flex>

                <HStack
                  gap={2}
                  align="flex-start"
                  color="#58665D"
                  fontSize="sm"
                >
                  <LuShieldCheck
                    size={18}
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <Text>
                    Por segurança, mostramos só o bairro e a cidade. O endereço
                    é combinado pelo WhatsApp com quem for selecionado.
                  </Text>
                </HStack>
              </VStack>
            </VStack>

            <VStack
              display={{ base: "contents", lg: "flex" }}
              align="stretch"
              gap={5}
              flex={{ lg: 1 }}
              minW={0}
              w={{ lg: "auto" }}
            >
              <Box order={2} w="100%">
                {cartaoAcao()}
              </Box>

              {/* Publicado por */}
              <VStack {...CARD} align="stretch" gap={4} order={4} w="100%">
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  letterSpacing="0.08em"
                  color="#58665D"
                >
                  PUBLICADO POR
                </Text>

                <HStack gap={3}>
                  <Avatar.Root
                    shape="rounded"
                    rounded="16px"
                    boxSize="52px"
                    background="#D6E6F8"
                  >
                    <Avatar.Fallback
                      name={servico.requesterName}
                      fontWeight="bold"
                    />
                  </Avatar.Root>

                  <VStack align="flex-start" gap={0}>
                    <Text fontWeight="extrabold" color="#202722">
                      {servico.requesterName}
                    </Text>
                    <Text fontSize="sm" color="#58665D">
                      {solicitante
                        ? `${solicitante.neighborhood} – ${solicitante.city}`
                        : `${servico.neighborhood} – ${servico.city}`}
                    </Text>
                  </VStack>
                </HStack>

                {solicitante && (
                  <HStack gap={2} fontSize="sm">
                    <HStack gap={0}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <HiStar
                          key={n}
                          size={16}
                          color={
                            n <=
                            Math.round(Number(solicitante.averageRating ?? 0))
                              ? "#E0A11A"
                              : "#DDE3DE"
                          }
                        />
                      ))}
                    </HStack>
                    {nota && (
                      <Text fontWeight="extrabold" color="#202722">
                        {nota}
                      </Text>
                    )}
                    <Text color="#58665D">
                      {solicitante.totalReviews
                        ? `· ${solicitante.totalReviews} avaliações`
                        : "· sem avaliação"}
                    </Text>
                  </HStack>
                )}

                {solicitante && solicitante.skills.length > 0 && (
                  <Wrap gap={2}>
                    {solicitante.skills.map((habilidade) => (
                      <Badge
                        key={habilidade}
                        px={3}
                        py={1}
                        borderRadius="full"
                        bg="#F0F2EF"
                        color="#3F4B43"
                        fontWeight="semibold"
                      >
                        {habilidade}
                      </Badge>
                    ))}
                  </Wrap>
                )}

                {!souDono && (
                  <Button
                    variant="outline"
                    h="48px"
                    borderRadius="16px"
                    fontWeight="bold"
                    onClick={() => navigate(`/perfil/${servico.requesterId}`)}
                  >
                    Ver perfil
                  </Button>
                )}
              </VStack>
            </VStack>
          </Flex>
        </VStack>
      </Box>
    </DefaultLayout>
  );
}
