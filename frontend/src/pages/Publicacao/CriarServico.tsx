import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { BackButton } from "@/components/BackButton";
import { ServicoForm } from "@/components/ServicoForm";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import { Loading } from "@/components/Loading";
import { serviceService, type IServico } from "@/services/serviceService";

export function CriarServico() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // /criar?copiar=12 -> preenche com os dados de um serviço seu (sem a data)
  const copiarId = Number(searchParams.get("copiar"));
  const [modelo, setModelo] = useState<IServico | null>(null);
  const [carregando, setCarregando] = useState(
    Number.isFinite(copiarId) && copiarId > 0,
  );

  useEffect(() => {
    if (!(Number.isFinite(copiarId) && copiarId > 0)) return;

    const carregar = async () => {
      try {
        const servico = await serviceService.getServicoPorId(copiarId);
        if (servico.requesterId === auth.user?.id) setModelo(servico);
      } catch (error) {
        // Sem o modelo, o formulário abre vazio.
        console.error("Erro ao carregar serviço para copiar:", error);
      } finally {
        setCarregando(false);
      }
    };

    void carregar();
  }, [copiarId, auth.user?.id]);

  if (carregando) return <Loading />;

  return (
    <DefaultLayout>
      <Box maxW="1000px" mx="auto" w="100%">
        <VStack align="stretch" gap={6}>
          <HStack align="center" gap={3}>
            <BackButton to="" />

            <VStack justify="flex-start" align="flex-start" gap={0}>
              <Heading
                as="h2"
                size="3xl"
                fontWeight="extrabold"
                letterSpacing="-0.02em"
                color="#202722"
              >
                Publicar serviço
              </Heading>

              <Text color="#58665D" fontSize="xs">
                {modelo
                  ? "Revise os dados e escolha uma nova data."
                  : "Conte o que você precisa. Leva menos de 2 minutos."}
              </Text>
            </VStack>
          </HStack>

          <ServicoForm
            valoresIniciais={{
              titulo: modelo?.title,
              descricao: modelo?.description,
              categoriaId: modelo ? String(modelo.categoryId) : undefined,
              valor: modelo ? String(modelo.value) : undefined,
              cidade: modelo?.city ?? auth.user?.city ?? "",
              bairro: modelo?.neighborhood ?? auth.user?.neighborhood ?? "",
            }}
            textoEnviar="Publicar serviço"
            textoSucesso="Serviço publicado com sucesso!"
            limparAposEnviar
            onSubmit={async (dados) => {
              await serviceService.createServico(dados);
            }}
            onCancel={() => navigate("/")}
          />
        </VStack>
      </Box>
    </DefaultLayout>
  );
}
