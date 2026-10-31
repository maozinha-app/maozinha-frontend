import {
  Alert,
  Avatar,
  Badge,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { HiStar } from "react-icons/hi";
import { LuLock } from "react-icons/lu";
import { MdOutlineLocationOn } from "react-icons/md";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { BackButton } from "@/components/BackButton";
import { Loading } from "@/components/Loading";
import { Reputation } from "@/components/Reputation";
import { ReviewsReceived } from "@/components/ReviewsReceived";
import { ServicoListItem } from "@/components/ServiceListItem";
import { Skills } from "@/components/Skills";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import { getApiErrorMessage } from "@/services/api";
import {
  categoryService,
  type IServiceCategory,
} from "@/services/categoryService";
import { serviceService, type IServico } from "@/services/serviceService";
import { getPublicProfile, type IPerfilPublico } from "@/services/userService";

export function PerfilPublicoUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [perfil, setPerfil] = useState<IPerfilPublico | null>(null);
  const [servicosAbertos, setServicosAbertos] = useState<IServico[]>([]);
  const [categorias, setCategorias] = useState<IServiceCategory[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const userId = Number(id);

  useEffect(() => {
    const carregar = async () => {
      if (!id || Number.isNaN(userId)) {
        setErro("Usuário não encontrado.");
        setCarregando(false);
        return;
      }

      try {
        setPerfil(await getPublicProfile(userId));
      } catch (error) {
        setErro(
          getApiErrorMessage(error, "Não foi possível carregar o perfil."),
        );
        setCarregando(false);
        return;
      }

      // Serviços abertos e categorias são complementares: se falharem, o perfil aparece mesmo assim.
      const [abertos, cats] = await Promise.allSettled([
        serviceService.getServicos({ size: 50, requesterId: userId }),
        categoryService.getCategories(),
      ]);

      if (abertos.status === "fulfilled") {
        setServicosAbertos(abertos.value.content);
      }
      if (cats.status === "fulfilled") setCategorias(cats.value);

      setCarregando(false);
    };

    void carregar();
  }, [id, userId]);

  // O próprio perfil tem tela própria (com edição).
  if (auth.user && auth.user.id === userId) {
    return <Navigate to="/meu-perfil" replace />;
  }

  if (carregando) return <Loading />;

  if (erro || !perfil) {
    return (
      <DefaultLayout>
        <VStack align="stretch" gap={4} maxW="720px" mx="auto">
          <BackButton to="" />
          <Alert.Root status="error" borderRadius="xl">
            <Alert.Indicator />
            <Alert.Title>{erro || "Usuário não encontrado."}</Alert.Title>
          </Alert.Root>
        </VStack>
      </DefaultLayout>
    );
  }

  const primeiroNome = perfil.name.split(" ")[0];
  const desde = new Date(perfil.createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <DefaultLayout>
      <VStack align="stretch" gap={6}>
        <HStack gap={3}>
          <BackButton to="" />
          <Text fontWeight="bold" color="#202722">
            Voltar
          </Text>
        </HStack>

        <Flex
          gap={8}
          direction={{ base: "column", md: "row" }}
          align={{ base: "center", md: "flex-start" }}
        >
          {/* Cartão do usuário */}
          <VStack
            flex={1}
            background="#fff"
            gap={5}
            rounded={28}
            p={10}
            pt={16}
            w={{ base: "full", md: "70%" }}
          >
            <Avatar.Root
              shape="rounded"
              size="2xl"
              outlineColor="#fff"
              outlineStyle="solid"
              rounded="32px"
              outlineWidth="5px"
              background="#E0D8F2"
              boxSize="112px"
              boxShadow="xl"
            >
              <Avatar.Fallback
                name={perfil.name}
                fontWeight="extrabold"
                fontSize="36px"
              />
            </Avatar.Root>

            <VStack gap={3} w="full">
              <Heading size="2xl" fontWeight="extrabold" textAlign="center">
                {perfil.name}
              </Heading>

              <HStack gap={1}>
                <MdOutlineLocationOn />
                <Text fontSize="14px" fontWeight="light">
                  {perfil.neighborhood}, {perfil.city}
                </Text>
              </HStack>

              <Stack align="center">
                <Badge
                  variant="solid"
                  background="#FBF4E2"
                  color="#000"
                  p={"6px 22px"}
                  rounded="2xl"
                  size="md"
                >
                  <HiStar color="#E0A11A" size={16} />
                  <Text fontWeight="bold" fontSize="md">
                    {perfil.averageRating
                      ? Number(perfil.averageRating).toFixed(1)
                      : ""}
                  </Text>
                  <Text fontWeight="light">
                    {perfil.totalReviews
                      ? `${perfil.totalReviews} avaliações`
                      : "sem avaliação"}
                  </Text>
                </Badge>
              </Stack>

              <Text fontSize="xs" fontWeight="light">
                No Mãozinha desde {desde}
              </Text>
            </VStack>

            <HStack
              gap={3}
              w="full"
              bg="#F6F7F4"
              borderRadius="xl"
              p={4}
              fontSize="sm"
              color="#58665D"
            >
              <LuLock size={16} />
              <Text>
                O WhatsApp só é liberado entre pessoas selecionadas para um
                mesmo serviço.
              </Text>
            </HStack>
          </VStack>

          {/* Informações */}
          <VStack
            w={{ base: "full", md: "70%" }}
            pb={20}
            gap={4}
            align="stretch"
          >
            <Skills
              title="Habilidades"
              skills={perfil.skills}
              editable={false}
            />
            <Reputation
              title="Reputação"
              userId={perfil.id}
              averageRating={perfil.averageRating}
              totalReviews={perfil.totalReviews}
            />
            <ReviewsReceived
              title={`Avaliações de ${primeiroNome}`}
              userId={perfil.id}
            />

            {servicosAbertos.length > 0 && (
              <VStack align="stretch" gap={3}>
                <Heading as="h3" size="md" fontWeight="bold" color="#202722">
                  Serviços abertos de {primeiroNome}
                </Heading>

                {servicosAbertos.map((servico) => (
                  <ServicoListItem
                    key={servico.id}
                    servico={servico}
                    categoria={categorias.find(
                      (c) => c.id === servico.categoryId,
                    )}
                    onClick={() => navigate(`/detalhe-servico/${servico.id}`)}
                  />
                ))}
              </VStack>
            )}
          </VStack>
        </Flex>
      </VStack>
    </DefaultLayout>
  );
}
