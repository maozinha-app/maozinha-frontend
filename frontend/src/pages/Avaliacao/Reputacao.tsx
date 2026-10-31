import {
  Alert,
  Avatar,
  Box,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { BackButton } from "@/components/BackButton";
import { Loading } from "@/components/Loading";
import { Reputation } from "@/components/Reputation";
import { ReviewsReceived } from "@/components/ReviewsReceived";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import { getApiErrorMessage } from "@/services/api";
import { getPublicProfile, type IPerfilPublico } from "@/services/userService";

export function Reputacao() {
  // /reputacao  (a minha)  |  /reputacao/5  |  /reputacao?usuario=5
  const params = useParams();
  const [searchParams] = useSearchParams();
  const auth = useContext(AuthContext);

  const idDaUrl = Number(params.id ?? searchParams.get("usuario"));
  const outroUsuario =
    Number.isFinite(idDaUrl) && idDaUrl > 0 && idDaUrl !== auth.user?.id;

  const [perfil, setPerfil] = useState<IPerfilPublico | null>(null);
  const [carregando, setCarregando] = useState(outroUsuario);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!outroUsuario) {
      setCarregando(false);
      return;
    }

    const carregar = async () => {
      try {
        setPerfil(await getPublicProfile(idDaUrl));
      } catch (error) {
        setErro(
          getApiErrorMessage(error, "Não foi possível carregar o usuário."),
        );
      } finally {
        setCarregando(false);
      }
    };

    void carregar();
  }, [outroUsuario, idDaUrl]);

  if (carregando) return <Loading />;

  const nome = outroUsuario ? perfil?.name : auth.user?.name;
  const primeiroNome = nome?.split(" ")[0] ?? "";

  return (
    <DefaultLayout>
      <Box maxW="720px" mx="auto" w="100%">
        <VStack align="stretch" gap={5} pb={20}>
          <HStack gap={3}>
            <BackButton
              to={outroUsuario ? `perfil/${idDaUrl}` : "meu-perfil"}
            />
            <Text fontWeight="bold" color="#202722">
              Voltar
            </Text>
          </HStack>

          {erro || !nome ? (
            <Alert.Root status="error" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>{erro || "Usuário não encontrado."}</Alert.Title>
            </Alert.Root>
          ) : (
            <>
              <HStack gap={4}>
                <Avatar.Root
                  shape="rounded"
                  rounded="14px"
                  boxSize="52px"
                  background="#D6E6F8"
                >
                  <Avatar.Fallback name={nome} fontWeight="bold" />
                </Avatar.Root>

                <Heading
                  as="h2"
                  size="2xl"
                  fontWeight="extrabold"
                  color="#202722"
                >
                  {outroUsuario
                    ? `Avaliações de ${primeiroNome}`
                    : "Minha reputação"}
                </Heading>
              </HStack>

              {outroUsuario && perfil ? (
                <Reputation
                  title="Média geral"
                  userId={perfil.id}
                  averageRating={perfil.averageRating}
                  totalReviews={perfil.totalReviews}
                />
              ) : (
                <Reputation title="Média geral" />
              )}

              <ReviewsReceived
                title="Avaliações recebidas"
                userId={outroUsuario ? idDaUrl : undefined}
              />
            </>
          )}
        </VStack>
      </Box>
    </DefaultLayout>
  );
}
