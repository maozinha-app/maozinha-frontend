import {
  Alert,
  Avatar,
  Box,
  Button,
  Heading,
  HStack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { HiStar } from "react-icons/hi";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { BackButton } from "@/components/BackButton";
import { Loading } from "@/components/Loading";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import { getApiErrorMessage } from "@/services/api";
import { interestService } from "@/services/interestService";
import { createReview } from "@/services/reviewService";
import { serviceService, type IServico } from "@/services/serviceService";

const LIMITE_COMENTARIO = 500;

const TEXTO_NOTA: Record<number, string> = {
  1: "Ruim",
  2: "Poderia ser melhor",
  3: "Foi bom",
  4: "Muito bom",
  5: "Excelente!",
};

interface IPessoaAvaliada {
  id: number;
  nome: string;
}

// "YYYY-MM-DD" -> "20/09/2026" (sem passar por fuso horário)
const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR");
};

export function AvaliarUsuario() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [servico, setServico] = useState<IServico | null>(null);
  const [candidatos, setCandidatos] = useState<IPessoaAvaliada[]>([]);
  const [avaliadoId, setAvaliadoId] = useState<number | null>(null);

  const [nota, setNota] = useState(0);
  const [notaHover, setNotaHover] = useState(0);
  const [comentario, setComentario] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [erroEnvio, setErroEnvio] = useState("");

  useEffect(() => {
    const carregar = async () => {
      const servicoId = Number(id);

      if (!id || Number.isNaN(servicoId) || !auth.user) {
        setErro("Serviço não encontrado.");
        setCarregando(false);
        return;
      }

      try {
        const dadosServico = await serviceService.getServicoPorId(servicoId);
        setServico(dadosServico);

        let pessoas: IPessoaAvaliada[];

        if (dadosServico.requesterId === auth.user.id) {
          // Quem publicou avalia quem foi selecionado para fazer o serviço.
          const interessados =
            await interestService.getInteressadosDoServico(servicoId);

          pessoas = interessados
            .filter((interesse) => interesse.status === "SELECIONADO")
            .map((interesse) => ({
              id: interesse.userId,
              nome: interesse.userName,
            }));
        } else {
          // Quem fez o serviço avalia quem publicou.
          pessoas = [
            { id: dadosServico.requesterId, nome: dadosServico.requesterName },
          ];
        }

        setCandidatos(pessoas);

        const escolhidoNaUrl = Number(searchParams.get("usuario"));
        const inicial =
          pessoas.find((pessoa) => pessoa.id === escolhidoNaUrl) ?? pessoas[0];

        setAvaliadoId(inicial?.id ?? null);
      } catch (error) {
        setErro(
          getApiErrorMessage(error, "Não foi possível carregar o serviço."),
        );
      } finally {
        setCarregando(false);
      }
    };

    void carregar();
  }, [id, auth.user, searchParams]);

  const handleEnviar = async () => {
    if (!servico || avaliadoId === null) return;

    if (nota < 1) {
      setErroEnvio("Toque nas estrelas para dar uma nota.");
      return;
    }

    setEnviando(true);
    setErroEnvio("");

    try {
      await createReview(servico.id, {
        rating: nota,
        reviewedUserId: avaliadoId,
        ...(comentario.trim() && { comment: comentario.trim() }),
      });

      setEnviado(true);
    } catch (error) {
      // 409: essa pessoa já foi avaliada por você neste serviço.
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        navigate(`/avaliacao-realizada/${servico.id}?usuario=${avaliadoId}`, {
          replace: true,
        });
        return;
      }

      setErroEnvio(
        getApiErrorMessage(error, "Não foi possível enviar sua avaliação."),
      );
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) return <Loading />;

  const avaliado = candidatos.find((pessoa) => pessoa.id === avaliadoId);
  const souSolicitante = servico?.requesterId === auth.user?.id;
  const primeiroNome = avaliado?.nome.split(" ")[0] ?? "";
  const servicoConcluido = servico?.status === "CONCLUIDO";
  const notaExibida = notaHover || nota;

  const conteudo = () => {
    if (erro || !servico) {
      return (
        <Alert.Root status="error" borderRadius="xl">
          <Alert.Indicator />
          <Alert.Title>{erro || "Serviço não encontrado."}</Alert.Title>
        </Alert.Root>
      );
    }

    if (enviado) {
      return (
        <VStack
          gap={4}
          bg="white"
          borderRadius="3xl"
          p={{ base: 6, md: 10 }}
          textAlign="center"
        >
          <Heading size="2xl" fontWeight="extrabold" color="#202722">
            Obrigado pela avaliação!
          </Heading>
          <Text color="#58665D">
            Sua nota ajuda outras pessoas do bairro a escolherem com confiança.
          </Text>
          <Button
            asChild
            w="full"
            h="56px"
            borderRadius="16px"
            bg="#1F7A50"
            fontWeight="bold"
          >
            <RouterLink to="/">Voltar ao início</RouterLink>
          </Button>
        </VStack>
      );
    }

    if (!servicoConcluido) {
      return (
        <Alert.Root status="info" borderRadius="xl">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Ainda não dá para avaliar</Alert.Title>
            <Alert.Description>
              A avaliação fica disponível depois que o serviço for marcado como
              concluído.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      );
    }

    if (!avaliado) {
      return (
        <Alert.Root status="warning" borderRadius="xl">
          <Alert.Indicator />
          <Alert.Title>
            Não encontramos ninguém para você avaliar neste serviço.
          </Alert.Title>
        </Alert.Root>
      );
    }

    return (
      <VStack
        gap={5}
        bg="white"
        borderRadius="3xl"
        p={{ base: 5, md: 8 }}
        align="stretch"
      >
        <VStack gap={2} textAlign="center">
          <Avatar.Root shape="rounded" boxSize="72px" background="#F8D7E3">
            <Avatar.Fallback name={avaliado.nome} fontWeight="extrabold" />
          </Avatar.Root>

          <Text fontSize="sm" color="#58665D">
            {souSolicitante
              ? `${avaliado.nome} fez este serviço para você`
              : `Você fez este serviço para ${avaliado.nome}`}
          </Text>
          <Text fontWeight="bold" color="#202722">
            “{servico.title}” · {formatarData(servico.serviceDate)}
          </Text>
        </VStack>

        {candidatos.length > 1 && (
          <HStack gap={2} justify="center" wrap="wrap">
            {candidatos.map((pessoa) => (
              <Button
                key={pessoa.id}
                size="sm"
                borderRadius="full"
                variant={pessoa.id === avaliadoId ? "solid" : "outline"}
                bg={pessoa.id === avaliadoId ? "#1F7A50" : undefined}
                onClick={() => setAvaliadoId(pessoa.id)}
              >
                {pessoa.nome}
              </Button>
            ))}
          </HStack>
        )}

        <Heading
          as="h2"
          size={{ base: "xl", md: "2xl" }}
          fontWeight="extrabold"
          textAlign="center"
          color="#202722"
        >
          Como foi sua experiência com {primeiroNome}?
        </Heading>

        <VStack gap={2}>
          <HStack gap={2} onMouseLeave={() => setNotaHover(0)}>
            {[1, 2, 3, 4, 5].map((valor) => (
              <Box
                key={valor}
                as="button"
                aria-label={`${valor} ${valor === 1 ? "estrela" : "estrelas"}`}
                cursor="pointer"
                color={valor <= notaExibida ? "#E0A11A" : "#D9DFDA"}
                transition="color 0.15s, transform 0.15s"
                _hover={{ transform: "scale(1.1)" }}
                onMouseEnter={() => setNotaHover(valor)}
                onClick={() => {
                  setNota(valor);
                  setErroEnvio("");
                }}
              >
                <HiStar size={48} />
              </Box>
            ))}
          </HStack>

          <Text fontWeight="bold" color="#202722">
            {notaExibida
              ? TEXTO_NOTA[notaExibida]
              : "Toque nas estrelas para avaliar"}
          </Text>
        </VStack>

        <VStack align="stretch" gap={2}>
          <HStack justify="space-between">
            <Text fontWeight="bold" color="#202722">
              Quer deixar um comentário?{" "}
              <Text as="span" fontWeight="normal" color="#58665D">
                (opcional)
              </Text>
            </Text>
            <Text fontSize="sm" color="#58665D">
              {comentario.length}/{LIMITE_COMENTARIO}
            </Text>
          </HStack>

          <Textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={LIMITE_COMENTARIO}
            rows={4}
            placeholder="Ex.: Chegou no horário e fez tudo com capricho."
            borderRadius="xl"
            _focus={{ borderColor: "#1F7A50" }}
          />
        </VStack>

        {erroEnvio && (
          <Alert.Root status="error" borderRadius="xl">
            <Alert.Indicator />
            <Alert.Title>{erroEnvio}</Alert.Title>
          </Alert.Root>
        )}

        <Button
          h="56px"
          borderRadius="16px"
          bg="#1F7A50"
          fontWeight="bold"
          loading={enviando}
          disabled={nota < 1}
          onClick={handleEnviar}
        >
          Enviar avaliação
        </Button>
      </VStack>
    );
  };

  return (
    <DefaultLayout>
      <Box maxW="640px" mx="auto" w="100%">
        <VStack align="stretch" gap={6}>
          <HStack gap={3}>
            <BackButton to="" />
            <Text fontWeight="bold" color="#202722">
              Voltar
            </Text>
          </HStack>

          {conteudo()}
        </VStack>
      </Box>
    </DefaultLayout>
  );
}
