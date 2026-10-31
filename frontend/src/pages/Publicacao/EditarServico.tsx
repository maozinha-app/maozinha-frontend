import { Alert, Box, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LuInfo } from "react-icons/lu";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { BackButton } from "@/components/BackButton";
import { Loading } from "@/components/Loading";
import { ServicoForm } from "@/components/ServicoForm";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import { getApiErrorMessage } from "@/services/api";
import { interestService } from "@/services/interestService";
import { serviceService, type IServico } from "@/services/serviceService";

export function EditarServico() {
  // Aceita /editar-servico/12 e /editar-servico?id=12
  const params = useParams();
  const [searchParams] = useSearchParams();
  const id = params.id ?? searchParams.get("id");

  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [servico, setServico] = useState<IServico | null>(null);
  const [interessados, setInteressados] = useState(0);
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
        const dados = await serviceService.getServicoPorId(servicoId);
        setServico(dados);
      } catch (error) {
        setErro(
          getApiErrorMessage(error, "Não foi possível carregar o serviço."),
        );
        setCarregando(false);
        return;
      }

      // Só para avisar quantas pessoas verão a alteração; se falhar, o aviso some.
      try {
        const lista = await interestService.getInteressadosDoServico(servicoId);
        setInteressados(
          lista.filter(
            (i) => i.status === "PENDENTE" || i.status === "SELECIONADO",
          ).length,
        );
      } catch (error) {
        console.error("Erro ao carregar interessados:", error);
      }

      setCarregando(false);
    };

    void carregar();
  }, [id]);

  if (carregando) return <Loading />;

  const voltarPara = servico
    ? `gerenciar-servico-publicado/${servico.id}`
    : "meus-servicos";

  const bloqueio = (() => {
    if (!servico) return "";
    if (servico.requesterId !== auth.user?.id) {
      return "Só quem publicou o serviço pode editá-lo.";
    }
    if (servico.status === "CONCLUIDO" || servico.status === "CANCELADO") {
      return "Este serviço não pode mais ser editado.";
    }
    return "";
  })();

  if (erro || !servico || bloqueio) {
    return (
      <DefaultLayout>
        <Box maxW="1000px" mx="auto" w="100%">
          <VStack align="stretch" gap={4}>
            <BackButton to={voltarPara} />
            <Alert.Root status="error" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>
                {erro || bloqueio || "Serviço não encontrado."}
              </Alert.Title>
            </Alert.Root>
          </VStack>
        </Box>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <Box maxW="1000px" mx="auto" w="100%">
        <VStack align="stretch" gap={6}>
          <HStack align="center" gap={3}>
            <BackButton to={voltarPara} />

            <VStack justify="flex-start" align="flex-start" gap={0}>
              <Heading
                as="h2"
                size="3xl"
                fontWeight="extrabold"
                letterSpacing="-0.02em"
                color="#202722"
              >
                Editar serviço
              </Heading>

              <Text color="#58665D" fontSize="xs">
                Atualize as informações do anúncio. Quem já demonstrou interesse
                verá os dados novos.
              </Text>
            </VStack>
          </HStack>

          <ServicoForm
            valoresIniciais={{
              titulo: servico.title,
              descricao: servico.description,
              categoriaId: String(servico.categoryId),
              valor: String(servico.value),
              dataServico: servico.serviceDate,
              cidade: servico.city,
              bairro: servico.neighborhood,
            }}
            aviso={
              interessados > 0 ? (
                <HStack
                  gap={3}
                  bg="#E3EDFB"
                  color="#2B4F8A"
                  borderRadius="xl"
                  px={4}
                  py={3}
                >
                  <LuInfo size={18} style={{ flexShrink: 0 }} />
                  <Text fontSize="sm">
                    {interessados === 1
                      ? "1 pessoa já demonstrou interesse. Ela verá as informações atualizadas."
                      : `${interessados} pessoas já demonstraram interesse. Elas verão as informações atualizadas.`}
                  </Text>
                </HStack>
              ) : undefined
            }
            textoEnviar="Salvar alterações"
            onSubmit={async (dados) => {
              await serviceService.atualizarServico(servico.id, {
                ...dados,
                // A API exige o status no PUT: mantém o que o serviço já tem.
                status: servico.status,
              });

              navigate(`/gerenciar-servico-publicado/${servico.id}`);
            }}
            onCancel={() => navigate(`/${voltarPara}`)}
          />
        </VStack>
      </Box>
    </DefaultLayout>
  );
}
