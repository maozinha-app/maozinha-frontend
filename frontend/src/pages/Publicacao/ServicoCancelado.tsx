import {
  Alert,
  Box,
  Button,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LuBan, LuEye, LuRotateCw } from "react-icons/lu";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { BackButton } from "@/components/BackButton";
import { Loading } from "@/components/Loading";
import { ServicoGestaoHeader } from "@/components/ServicoGestaoHeader";
import { getApiErrorMessage } from "@/services/api";
import { serviceService, type IServico } from "@/services/serviceService";

export function ServicoCancelado() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const id = params.id ?? searchParams.get("id");
  const navigate = useNavigate();

  const [servico, setServico] = useState<IServico | null>(null);
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
        setServico(await serviceService.getServicoPorId(servicoId));
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

  return (
    <DefaultLayout>
      <Box maxW="1000px" mx="auto" w="100%">
        <VStack align="stretch" gap={5}>
          <HStack gap={3}>
            <BackButton to="meus-servicos" />
            <Text fontWeight="bold" color="#202722">
              Meus serviços
            </Text>
          </HStack>

          {erro || !servico ? (
            <Alert.Root status="error" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>{erro || "Serviço não encontrado."}</Alert.Title>
            </Alert.Root>
          ) : (
            <>
              <ServicoGestaoHeader
                servico={servico}
                acoes={
                  <Button
                    variant="outline"
                    borderRadius="xl"
                    onClick={() => navigate(`/detalhe-servico/${servico.id}`)}
                  >
                    <LuEye /> Ver anúncio
                  </Button>
                }
              />

              <HStack
                align="flex-start"
                gap={4}
                bg="white"
                borderRadius="3xl"
                borderWidth="1px"
                borderColor="#F2C9C5"
                p={{ base: 5, md: 7 }}
              >
                <Box
                  bg="#FBE6E4"
                  color="#9A2A23"
                  borderRadius="xl"
                  p={3}
                  flexShrink={0}
                >
                  <LuBan size={26} />
                </Box>

                <VStack align="flex-start" gap={3}>
                  <Heading
                    as="h3"
                    size="lg"
                    fontWeight="extrabold"
                    color="#202722"
                  >
                    Serviço cancelado
                  </Heading>
                  <Text color="#58665D">
                    Este anúncio saiu da busca e não aceita novos interessados.
                    Se ainda precisar, publique de novo com uma nova data.
                  </Text>
                  <Button
                    bg="#1F7A50"
                    color="white"
                    borderRadius="xl"
                    _hover={{ bg: "#185B3E" }}
                    onClick={() => navigate(`/criar?copiar=${servico.id}`)}
                  >
                    <LuRotateCw /> Publicar novamente
                  </Button>
                </VStack>
              </HStack>
            </>
          )}
        </VStack>
      </Box>
    </DefaultLayout>
  );
}
