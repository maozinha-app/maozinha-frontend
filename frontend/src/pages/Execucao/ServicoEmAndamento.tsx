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
  Wrap,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  LuCheck,
  LuEye,
  LuMessageSquare,
  LuRefreshCw,
  LuStar,
} from "react-icons/lu";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { BackButton } from "@/components/BackButton";
import { Loading } from "@/components/Loading";
import { ServicoGestaoHeader } from "@/components/ServicoGestaoHeader";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import { getApiErrorMessage } from "@/services/api";
import { interestService, type IInteresse } from "@/services/interestService";
import { serviceService, type IServico } from "@/services/serviceService";

const linkWhatsapp = (numero: string, nome: string, titulo: string) =>
  `https://wa.me/55${numero.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Olá, ${nome.split(" ")[0]}! Sobre o serviço "${titulo}" no Mãozinha.`,
  )}`;

const CORES_AVATAR = ["#D6E6F8", "#F6E3B8", "#E0D8F2", "#E6E2D5", "#F8D7E3"];

export function ServicoEmAndamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [servico, setServico] = useState<IServico | null>(null);
  const [interesses, setInteresses] = useState<IInteresse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [concluindo, setConcluindo] = useState(false);
  const [erro, setErro] = useState("");
  const [erroAcao, setErroAcao] = useState("");

  useEffect(() => {
    const carregar = async () => {
      const servicoId = Number(id);

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

  const handleConcluir = async () => {
    if (!servico) return;

    setConcluindo(true);
    setErroAcao("");

    try {
      // A API valida a data do serviço: se já passou, devolve 400 (ver mensagem).
      const atualizado = await serviceService.atualizarStatus(
        servico,
        "CONCLUIDO",
      );
      setServico(atualizado);
    } catch (error) {
      setErroAcao(
        getApiErrorMessage(error, "Não foi possível concluir o serviço."),
      );
    } finally {
      setConcluindo(false);
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

  // Antes de começar, a tela certa é a de escolher quem vai fazer.
  if (servico.status === "ABERTO" || servico.status === "SELECIONADO") {
    return (
      <Navigate to={`/gerenciar-servico-publicado/${servico.id}`} replace />
    );
  }

  const ehDono = servico.requesterId === auth.user?.id;
  const selecionados = interesses.filter((i) => i.status === "SELECIONADO");
  const naoSelecionados = interesses.filter(
    (i) => i.status === "NAO_SELECIONADO",
  );
  const emAndamento = servico.status === "EM_ANDAMENTO";
  const concluido = servico.status === "CONCLUIDO";

  const acoes = (
    <Button
      variant="outline"
      borderRadius="xl"
      fontWeight="bold"
      onClick={() => navigate(`/detalhe-servico/${servico.id}`)}
    >
      <LuEye />
      Ver anúncio
    </Button>
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

          <VStack align="stretch" gap={3}>
            <HStack align="baseline" gap={3}>
              <Heading size="xl" fontWeight="extrabold" color="#202722">
                Pessoas selecionadas
              </Heading>
              <Text color="#58665D">
                {selecionados.length}{" "}
                {selecionados.length === 1
                  ? "pessoa selecionada"
                  : "pessoas selecionadas"}
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
                </Box>

                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="xl"
                  fontWeight="bold"
                  onClick={() => navigate(`/perfil/${interesse.userId}`)}
                >
                  Perfil
                </Button>

                {ehDono && interesse.userWhatsapp && (
                  <Button
                    asChild
                    size="sm"
                    borderRadius="xl"
                    bg="#25D366"
                    color="#0B2A17"
                    fontWeight="bold"
                    _hover={{ bg: "#1FB958" }}
                  >
                    <a
                      href={linkWhatsapp(
                        interesse.userWhatsapp,
                        interesse.userName,
                        servico.title,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <LuMessageSquare />
                      WhatsApp
                    </a>
                  </Button>
                )}

                {concluido && ehDono && (
                  <Button
                    size="sm"
                    variant="outline"
                    borderRadius="xl"
                    fontWeight="bold"
                    onClick={() =>
                      navigate(
                        `/avaliar-usuario/${servico.id}?usuario=${interesse.userId}`,
                      )
                    }
                  >
                    <LuStar />
                    Avaliar
                  </Button>
                )}
              </HStack>
            ))}
          </VStack>

          {naoSelecionados.length > 0 && (
            <VStack align="stretch" gap={2}>
              <Text fontWeight="bold" color="#58665D">
                Não selecionados
              </Text>
              <Wrap gap={2}>
                {naoSelecionados.map((interesse, index) => (
                  <HStack
                    key={interesse.id}
                    gap={2}
                    pl={2}
                    pr={4}
                    py={2}
                    bg="white"
                    borderRadius="full"
                  >
                    <Avatar.Root
                      boxSize="28px"
                      background={
                        CORES_AVATAR[(index + 4) % CORES_AVATAR.length]
                      }
                    >
                      <Avatar.Fallback
                        name={interesse.userName}
                        fontSize="xs"
                      />
                    </Avatar.Root>
                    <Text fontWeight="semibold" color="#202722">
                      {interesse.userName}
                    </Text>
                  </HStack>
                ))}
              </Wrap>
            </VStack>
          )}

          {erroAcao && (
            <Alert.Root status="error" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>{erroAcao}</Alert.Title>
            </Alert.Root>
          )}

          <Flex>
            <VStack
              align="stretch"
              gap={3}
              bg="white"
              borderRadius="3xl"
              p={6}
              w={{ base: "100%", md: "380px" }}
            >
              {emAndamento && (
                <>
                  <Box color="#8A5A0A">
                    <LuRefreshCw size={22} />
                  </Box>
                  <Heading size="lg" fontWeight="extrabold" color="#202722">
                    Serviço em andamento
                  </Heading>
                  <Text color="#58665D">
                    Quando tudo estiver feito, marque como concluído para
                    liberar as avaliações.
                  </Text>
                  {ehDono && (
                    <Button
                      h="56px"
                      borderRadius="16px"
                      bg="#1F7A50"
                      fontWeight="bold"
                      loading={concluindo}
                      onClick={handleConcluir}
                    >
                      <LuCheck />
                      Marcar como concluído
                    </Button>
                  )}
                </>
              )}

              {concluido && (
                <>
                  <Box color="#1F7A50">
                    <LuCheck size={22} />
                  </Box>
                  <Heading size="lg" fontWeight="extrabold" color="#202722">
                    Serviço concluído!
                  </Heading>
                  <Text color="#58665D">
                    As avaliações já estão liberadas. Conte como foi a
                    experiência.
                  </Text>
                </>
              )}
            </VStack>
          </Flex>
        </VStack>
      </Box>
    </DefaultLayout>
  );
}
