import {
  Alert,
  Avatar,
  Box,
  Button,
  Heading,
  HStack,
  RatingGroup,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LuBadgeCheck } from "react-icons/lu";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { BackButton } from "@/components/BackButton";
import { Loading } from "@/components/Loading";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import { getApiErrorMessage } from "@/services/api";
import { interestService } from "@/services/interestService";
import { getReviewsUser, type IAvaliacao } from "@/services/reviewService";
import { serviceService, type IServico } from "@/services/serviceService";

// "YYYY-MM-DD" -> "12/09/2026" (sem passar por fuso horário)
const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
};

export function AvaliacaoRealizada() {
  // /avaliacao-realizada/12?usuario=5  (ou ?id=12&usuario=5)
  const params = useParams();
  const [searchParams] = useSearchParams();
  const id = params.id ?? searchParams.get("id");
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [servico, setServico] = useState<IServico | null>(null);
  const [avaliacao, setAvaliacao] = useState<IAvaliacao | null>(null);
  const [pessoa, setPessoa] = useState<{ id: number; nome: string } | null>(
    null,
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      const servicoId = Number(id);

      if (!id || Number.isNaN(servicoId) || !auth.user) {
        setCarregando(false);
        return;
      }

      try {
        const dadosServico = await serviceService.getServicoPorId(servicoId);
        setServico(dadosServico);

        // Quem foi avaliado: o do link, ou (dono) o selecionado, ou (fazedor) quem publicou.
        let candidatos: { id: number; nome: string }[];

        if (dadosServico.requesterId === auth.user.id) {
          const interessados =
            await interestService.getInteressadosDoServico(servicoId);
          candidatos = interessados
            .filter((i) => i.status === "SELECIONADO")
            .map((i) => ({ id: i.userId, nome: i.userName }));
        } else {
          candidatos = [
            { id: dadosServico.requesterId, nome: dadosServico.requesterName },
          ];
        }

        const escolhidoNaUrl = Number(searchParams.get("usuario"));
        const avaliado =
          candidatos.find((c) => c.id === escolhidoNaUrl) ?? candidatos[0];

        if (!avaliado) return;
        setPessoa(avaliado);

        const recebidas = await getReviewsUser(avaliado.id);
        setAvaliacao(
          recebidas.find(
            (r) => r.jobId === servicoId && r.reviewerId === auth.user?.id,
          ) ?? null,
        );
      } catch (error) {
        setErro(
          getApiErrorMessage(error, "Não foi possível carregar a avaliação."),
        );
      } finally {
        setCarregando(false);
      }
    };

    void carregar();
  }, [id, auth.user, searchParams]);

  if (carregando) return <Loading />;

  const primeiroNome = pessoa?.nome.split(" ")[0] ?? "";
  const dataAvaliacao = avaliacao
    ? new Date(avaliacao.reviewDate).toLocaleDateString("pt-BR")
    : "";

  return (
    <DefaultLayout>
      <Box maxW="640px" mx="auto" w="100%">
        <VStack align="stretch" gap={5}>
          <HStack gap={3}>
            <BackButton to="meus-servicos" />
            <Text fontWeight="bold" color="#202722">
              Voltar
            </Text>
          </HStack>

          {erro || !servico || !pessoa ? (
            <Alert.Root status={erro ? "error" : "info"} borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>
                {erro ||
                  "Você já avaliou essa pessoa neste serviço. Cada serviço aceita uma avaliação por pessoa."}
              </Alert.Title>
            </Alert.Root>
          ) : (
            <VStack
              gap={5}
              bg="white"
              borderRadius="3xl"
              p={{ base: 6, md: 10 }}
              textAlign="center"
            >
              <Avatar.Root
                shape="rounded"
                rounded="24px"
                boxSize="96px"
                background="#D6E6F8"
                outlineColor="#fff"
                outlineStyle="solid"
                outlineWidth="4px"
                boxShadow="lg"
              >
                <Avatar.Fallback
                  name={pessoa.nome}
                  fontWeight="extrabold"
                  fontSize="30px"
                />
              </Avatar.Root>

              <VStack gap={0} color="#58665D" fontSize="sm">
                <Text>
                  {servico.requesterId === auth.user?.id
                    ? `${primeiroNome} fez este serviço para você`
                    : `Você fez este serviço para ${primeiroNome}`}
                </Text>
                <Text fontWeight="bold" color="#202722">
                  “{servico.title}” · {formatarData(servico.serviceDate)}
                </Text>
              </VStack>

              <Box bg="#EEF2EF" color="#58665D" borderRadius="full" p={3}>
                <LuBadgeCheck size={26} />
              </Box>

              <VStack gap={1}>
                <Heading size="2xl" fontWeight="extrabold" color="#202722">
                  Avaliação já realizada
                </Heading>
                <Text color="#58665D" fontSize="sm">
                  {avaliacao
                    ? `Você avaliou ${primeiroNome} em ${dataAvaliacao}. `
                    : `Você já avaliou ${primeiroNome}. `}
                  Cada serviço aceita uma avaliação por pessoa.
                </Text>
              </VStack>

              {avaliacao && (
                <VStack
                  align="stretch"
                  gap={2}
                  w="full"
                  bg="#F6F7F4"
                  borderRadius="2xl"
                  p={5}
                  textAlign="left"
                >
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    letterSpacing="0.06em"
                    color="#58665D"
                  >
                    SUA AVALIAÇÃO
                  </Text>

                  <RatingGroup.Root
                    count={5}
                    readOnly
                    defaultValue={avaliacao.rating}
                    size="md"
                    colorPalette="orange"
                  >
                    <RatingGroup.Control />
                    <RatingGroup.HiddenInput />
                  </RatingGroup.Root>

                  {avaliacao.comment && (
                    <Text color="#202722">“{avaliacao.comment}”</Text>
                  )}
                </VStack>
              )}

              <HStack gap={3} w="full">
                <Button
                  flex={1}
                  h="52px"
                  variant="outline"
                  borderRadius="16px"
                  onClick={() => navigate(`/perfil/${pessoa.id}`)}
                >
                  Ver perfil de {primeiroNome}
                </Button>
                <Button
                  flex={1}
                  h="52px"
                  borderRadius="16px"
                  bg="#1F7A50"
                  color="white"
                  fontWeight="bold"
                  _hover={{ bg: "#185B3E" }}
                  onClick={() => navigate("/")}
                >
                  Ir para o início
                </Button>
              </HStack>
            </VStack>
          )}
        </VStack>
      </Box>
    </DefaultLayout>
  );
}
