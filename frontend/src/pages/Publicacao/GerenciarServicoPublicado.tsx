import {
  Alert,
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useContext, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  LuBan,
  LuEye,
  LuMapPin,
  LuPencil,
  LuPlay,
  LuStar,
  LuUserPlus,
} from "react-icons/lu";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { BackButton } from "@/components/BackButton";
import { Loading } from "@/components/Loading";
import { ServicoGestaoHeader } from "@/components/ServicoGestaoHeader";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import { getApiErrorMessage } from "@/services/api";
import { interestService, type IInteresse } from "@/services/interestService";
import { serviceService, type IServico } from "@/services/serviceService";

const CORES_AVATAR = ["#D6E6F8", "#F6E3B8", "#E0D8F2", "#E6E2D5", "#F8D7E3"];
const LIMITE_SELECIONADOS = 5;

const formatarDataInteresse = (data: string) =>
  new Date(data).toLocaleDateString("pt-BR");

export function GerenciarServicoPublicado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [servico, setServico] = useState<IServico | null>(null);
  const [interesses, setInteresses] = useState<IInteresse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState("");
  const [erroAcao, setErroAcao] = useState("");

  const servicoId = Number(id);

  const carregar = useCallback(async () => {
    if (!id || Number.isNaN(servicoId)) {
      setErro("Serviço não encontrado.");
      setCarregando(false);
      return;
    }

    try {
      const [dadosServico, lista] = await Promise.all([
        serviceService.getServicoPorId(servicoId),
        interestService.getInteressadosDoServico(servicoId),
      ]);

      setServico(dadosServico);
      setInteresses(lista);
      setErro("");
    } catch (error) {
      setErro(
        getApiErrorMessage(error, "Não foi possível carregar o serviço."),
      );
    } finally {
      setCarregando(false);
    }
  }, [id, servicoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const handleSelecionar = async (interesse: IInteresse) => {
    setProcessandoId(interesse.id);
    setErroAcao("");

    try {
      await interestService.selecionarInteressado(interesse.id);
      await carregar();
    } catch (error) {
      setErroAcao(getApiErrorMessage(error, "Não foi possível selecionar."));
    } finally {
      setProcessandoId(null);
    }
  };

  const handleDispensar = async (interesse: IInteresse) => {
    setProcessandoId(interesse.id);
    setErroAcao("");

    try {
      await interestService.rejeitarInteressado(interesse.id);
      await carregar();
    } catch (error) {
      setErroAcao(getApiErrorMessage(error, "Não foi possível dispensar."));
    } finally {
      setProcessandoId(null);
    }
  };

  const handleIniciar = async () => {
    if (!servico) return;

    setIniciando(true);
    setErroAcao("");

    try {
      await serviceService.atualizarStatus(servico, "EM_ANDAMENTO");
      navigate(`/servico-em-andamento/${servico.id}`, { replace: true });
    } catch (error) {
      setErroAcao(
        getApiErrorMessage(error, "Não foi possível iniciar o serviço."),
      );
    } finally {
      setIniciando(false);
    }
  };

  const handleCancelar = async () => {
    if (!servico) return;

    setCancelando(true);
    setErroAcao("");

    try {
      await serviceService.cancelarServico(servico.id);
      navigate(`/servico-cancelado/${servico.id}`, { replace: true });
    } catch (error) {
      setErroAcao(
        getApiErrorMessage(error, "Não foi possível cancelar o serviço."),
      );
      setCancelando(false);
    }
  };

  if (carregando) return <Loading />;

  if (erro || !servico) {
    return (
      <DefaultLayout>
        <Box maxW="1000px" mx="auto" w="100%">
          <VStack align="stretch" gap={4}>
            <BackButton to="meus-servicos" />
            <Alert.Root status="error" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>{erro || "Serviço não encontrado."}</Alert.Title>
            </Alert.Root>
          </VStack>
        </Box>
      </DefaultLayout>
    );
  }

  // Em andamento/concluído têm tela própria.
  if (servico.status === "EM_ANDAMENTO" || servico.status === "CONCLUIDO") {
    return <Navigate to={`/servico-em-andamento/${servico.id}`} replace />;
  }

  const ehDono = servico.requesterId === auth.user?.id;
  const pendentes = interesses.filter((i) => i.status === "PENDENTE");
  const selecionados = interesses.filter((i) => i.status === "SELECIONADO");
  const podeEscolher =
    servico.status === "ABERTO" || servico.status === "SELECIONADO";
  const cancelado = servico.status === "CANCELADO";

  const acoes = ehDono && !cancelado && (
    <>
      <Button
        variant="outline"
        borderRadius="xl"
        fontWeight="bold"
        onClick={() => navigate(`/detalhe-servico/${servico.id}`)}
      >
        <LuEye />
        Ver anúncio
      </Button>
      <Button
        variant="outline"
        borderRadius="xl"
        fontWeight="bold"
        onClick={() => navigate(`/editar-servico/${servico.id}`)}
      >
        <LuPencil />
        Editar
      </Button>
      <Button
        variant="outline"
        borderRadius="xl"
        fontWeight="bold"
        color="#9A2A23"
        borderColor="#E8B9B5"
        onClick={() => setConfirmandoCancelamento(true)}
      >
        <LuBan />
        Cancelar serviço
      </Button>
    </>
  );

  return (
    <DefaultLayout>
      <Box maxW="1000px" mx="auto" w="100%">
        <VStack align="stretch" gap={6}>
          <HStack gap={3}>
            <BackButton to="meus-servicos" />
            <Text fontWeight="bold" color="#202722">
              Meus serviços
            </Text>
          </HStack>

          <ServicoGestaoHeader servico={servico} acoes={acoes} />

          {!ehDono && (
            <Alert.Root status="warning" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>
                Só quem publicou o serviço pode gerenciá-lo.
              </Alert.Title>
            </Alert.Root>
          )}

          {confirmandoCancelamento && (
            <Alert.Root status="error" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Cancelar este serviço?</Alert.Title>
                <Alert.Description>
                  Ele deixa de aparecer para os interessados e não dá para
                  desfazer.
                </Alert.Description>
                <HStack mt={3}>
                  <Button
                    size="sm"
                    bg="#9A2A23"
                    loading={cancelando}
                    onClick={handleCancelar}
                  >
                    Sim, cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={cancelando}
                    onClick={() => setConfirmandoCancelamento(false)}
                  >
                    Voltar
                  </Button>
                </HStack>
              </Alert.Content>
            </Alert.Root>
          )}

          {erroAcao && (
            <Alert.Root status="error" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>{erroAcao}</Alert.Title>
            </Alert.Root>
          )}

          {cancelado && (
            <Alert.Root status="info" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>Este serviço foi cancelado.</Alert.Title>
            </Alert.Root>
          )}

          {/* Pessoas já selecionadas */}
          {selecionados.length > 0 && (
            <VStack align="stretch" gap={3}>
              <HStack align="baseline" gap={3}>
                <Heading size="xl" fontWeight="extrabold" color="#202722">
                  Pessoas selecionadas
                </Heading>
                <Text color="#58665D">
                  {selecionados.length}/{LIMITE_SELECIONADOS}
                </Text>
              </HStack>

              {selecionados.map((interesse, index) => (
                <HStack
                  key={interesse.id}
                  gap={4}
                  bg="white"
                  borderRadius="2xl"
                  p={4}
                >
                  <Avatar.Root
                    shape="rounded"
                    boxSize="52px"
                    background={CORES_AVATAR[index % CORES_AVATAR.length]}
                  >
                    <Avatar.Fallback name={interesse.userName} />
                  </Avatar.Root>
                  <Box flex="1" minW={0}>
                    <Text fontWeight="extrabold" color="#202722">
                      {interesse.userName}
                    </Text>
                    <Text fontSize="sm" color="#58665D">
                      Selecionado(a)
                    </Text>
                  </Box>
                </HStack>
              ))}

              {ehDono && servico.status === "SELECIONADO" && (
                <Button
                  h="56px"
                  borderRadius="16px"
                  bg="#1F7A50"
                  fontWeight="bold"
                  loading={iniciando}
                  onClick={handleIniciar}
                >
                  <LuPlay />
                  Iniciar serviço
                </Button>
              )}
            </VStack>
          )}

          {/* Interessados */}
          {podeEscolher && (
            <VStack align="stretch" gap={3}>
              <HStack align="baseline" gap={3}>
                <Heading size="xl" fontWeight="extrabold" color="#202722">
                  Escolha quem vai fazer
                </Heading>
                <Text color="#58665D">
                  {pendentes.length}{" "}
                  {pendentes.length === 1
                    ? "pessoa interessada"
                    : "pessoas interessadas"}
                </Text>
              </HStack>

              <HStack
                gap={3}
                bg="#E3EDFB"
                color="#2B4F8A"
                borderRadius="xl"
                p={4}
                fontSize="sm"
              >
                <LuUserPlus size={18} />
                <Text>
                  Você pode escolher até {LIMITE_SELECIONADOS} pessoas. Depois
                  de confirmar, o serviço para de receber interessados.
                </Text>
              </HStack>

              {pendentes.length === 0 ? (
                <Flex
                  bg="white"
                  borderRadius="2xl"
                  p={8}
                  justify="center"
                  color="#58665D"
                >
                  Ainda não há interessados novos. Assim que alguém demonstrar
                  interesse, aparece aqui.
                </Flex>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  {pendentes.map((interesse, index) => (
                    <VStack
                      key={interesse.id}
                      align="stretch"
                      gap={4}
                      bg="white"
                      borderRadius="3xl"
                      p={5}
                    >
                      <HStack gap={3}>
                        <Avatar.Root
                          shape="rounded"
                          boxSize="52px"
                          background={CORES_AVATAR[index % CORES_AVATAR.length]}
                        >
                          <Avatar.Fallback name={interesse.userName} />
                        </Avatar.Root>
                        <Box minW={0}>
                          <Text fontWeight="extrabold" color="#202722">
                            {interesse.userName}
                          </Text>
                          {interesse.userNeighborhood && (
                            <HStack gap={1} fontSize="sm" color="#58665D">
                              <LuMapPin size={14} />
                              <Text>
                                {interesse.userNeighborhood},{" "}
                                {interesse.userCity}
                              </Text>
                            </HStack>
                          )}
                        </Box>
                      </HStack>

                      <HStack gap={2} fontSize="sm" color="#58665D">
                        <Box color="#E0A11A">
                          <LuStar size={16} fill="currentColor" />
                        </Box>
                        <Text fontWeight="bold" color="#202722">
                          {interesse.userAverageRating
                            ? Number(interesse.userAverageRating).toFixed(1)
                            : "Novo"}
                        </Text>
                        <Text>
                          ·{" "}
                          {interesse.userTotalReviews
                            ? `${interesse.userTotalReviews} avaliações`
                            : "sem avaliações"}
                        </Text>
                        <Text>
                          · interesse em{" "}
                          {formatarDataInteresse(interesse.interestDate)}
                        </Text>
                      </HStack>

                      {(interesse.userSkills ?? []).length > 0 && (
                        <HStack gap={2} wrap="wrap">
                          {(interesse.userSkills ?? [])
                            .slice(0, 3)
                            .map((skill) => (
                              <Box
                                key={skill}
                                px={3}
                                py={1}
                                borderRadius="full"
                                bg="#F3F4F1"
                                fontSize="sm"
                                fontWeight="semibold"
                                color="#202722"
                              >
                                {skill}
                              </Box>
                            ))}
                          {(interesse.userSkills ?? []).length > 3 && (
                            <Text fontSize="sm" color="#58665D">
                              +{(interesse.userSkills ?? []).length - 3}
                            </Text>
                          )}
                        </HStack>
                      )}

                      {ehDono && (
                        <HStack gap={3}>
                          <Button
                            variant="outline"
                            borderRadius="xl"
                            fontWeight="bold"
                            onClick={() =>
                              navigate(`/perfil/${interesse.userId}`)
                            }
                          >
                            Ver perfil
                          </Button>
                          <Button
                            flex="1"
                            variant="outline"
                            borderRadius="xl"
                            fontWeight="bold"
                            disabled={processandoId !== null}
                            loading={processandoId === interesse.id}
                            onClick={() => handleDispensar(interesse)}
                          >
                            Dispensar
                          </Button>
                          <Button
                            flex="1"
                            variant="outline"
                            borderRadius="xl"
                            fontWeight="bold"
                            color="#1F7A50"
                            borderColor="#1F7A50"
                            disabled={
                              processandoId !== null ||
                              selecionados.length >= LIMITE_SELECIONADOS
                            }
                            loading={processandoId === interesse.id}
                            onClick={() => handleSelecionar(interesse)}
                          >
                            <LuUserPlus />
                            Selecionar pessoa
                          </Button>
                        </HStack>
                      )}
                    </VStack>
                  ))}
                </SimpleGrid>
              )}
            </VStack>
          )}
        </VStack>
      </Box>
    </DefaultLayout>
  );
}
