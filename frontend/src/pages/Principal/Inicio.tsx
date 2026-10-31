import { Box, Flex, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdFrontHand, MdArrowForward, MdAdd } from "react-icons/md";
import { LuShapes } from "react-icons/lu";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { ButtonBox } from "@/components/ButtonBox";
import { CardAd } from "@/components/CardAd";
import { IconTile } from "@/components/IconTile";
import { SectionHeader } from "@/components/SectionHeader";
import { TrackingList } from "@/components/TrackingList";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import {
  categoryService,
  type IServiceCategory,
} from "@/services/categoryService";
import { serviceService, type IServico } from "@/services/serviceService";
import {
  trackingService,
  type ITrackingItem,
} from "@/services/trackingService";

const LIMITE_PERTO_DE_VOCE = 6;

export function Inicio() {
  const [categories, setCategories] = useState<IServiceCategory[]>([]);
  const [servicos, setServicos] = useState<IServico[]>([]);
  const [trackingItens, setTrackingItens] = useState<ITrackingItem[]>([]);
  const [carregando, setCarregando] = useState(true);

  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const saudacao = "Olá, " + auth.user?.name + "! Do que você precisa hoje?";
  const localizacao = `${auth.user?.neighborhood}, ${auth.user?.city}`;

  useEffect(() => {
    const carregarDados = async () => {
      // Cada seção carrega de forma independente: se uma falhar, as outras aparecem.
      const resultados = await Promise.allSettled([
        categoryService.getCategories(),
        serviceService.getServicos({ size: 50 }),
        trackingService.getItensParaAcompanhar(),
      ]);

      const [categorias, listaServicos, acompanhar] = resultados;

      if (categorias.status === "fulfilled") setCategories(categorias.value);
      if (listaServicos.status === "fulfilled") {
        setServicos(listaServicos.value.content);
      }
      if (acompanhar.status === "fulfilled") {
        setTrackingItens(acompanhar.value);
      }

      resultados.forEach((resultado) => {
        if (resultado.status === "rejected") {
          console.error("Erro ao carregar a tela inicial:", resultado.reason);
        }
      });

      setCarregando(false);
    };

    carregarDados();
  }, []);

  // Serviços disponíveis de outras pessoas: mesmo bairro primeiro, depois mesma
  // cidade, depois os mais recentes.
  const pertoDeVoce = useMemo(() => {
    const meuId = auth.user ? String(auth.user.id) : null;
    const meuBairro = auth.user?.neighborhood?.trim().toLowerCase();
    const minhaCidade = auth.user?.city?.trim().toLowerCase();

    const proximidade = (servico: IServico) => {
      if (
        meuBairro &&
        servico.neighborhood.trim().toLowerCase() === meuBairro
      ) {
        return 2;
      }
      if (minhaCidade && servico.city.trim().toLowerCase() === minhaCidade) {
        return 1;
      }
      return 0;
    };

    return servicos
      .filter(
        (servico) =>
          servico.status === "ABERTO" && String(servico.requesterId) !== meuId,
      )
      .sort(
        (a, b) =>
          proximidade(b) - proximidade(a) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, LIMITE_PERTO_DE_VOCE);
  }, [servicos, auth.user]);

  return (
    <DefaultLayout titulo={saudacao} subtituloSuperior={localizacao}>
      <Flex gap={8} justifyContent="space-between" direction="column" pb="80px">
        <Flex
          gap="4"
          justifyContent="space-between"
          direction={{ base: "column", lg: "row" }}
        >
          <ButtonBox
            iconLeft={MdAdd}
            iconRight={MdArrowForward}
            iconColorFillLeft="#1F7A50"
            iconColorFillRight="#ffffff"
            backgrundColor="#DDEEE3"
            titulo="Preciso de uma mãozinha"
            subtitulo="Publique um serviço com valor, data e bairro. Quem puder ajudar demonstra interesse."
            onClick={() => navigate("/criar")}
          />

          <ButtonBox
            iconLeft={MdFrontHand}
            iconRight={MdArrowForward}
            iconColorFillLeft="#6E5A12"
            iconColorFillRight="#ffffff"
            backgrundColor="#F5ECD2"
            titulo="Quero dar uma mãozinha"
            subtitulo="Veja serviços perto de você e demonstre interesse no valor anunciado."
            onClick={() => navigate("/explorar")}
          />
        </Flex>

        {/* Para acompanhar */}
        <Flex flexDir="column" gap={4}>
          <SectionHeader
            titulo="Para acompanhar"
            itemsCount={carregando ? undefined : trackingItens.length}
            itemsLabel={
              carregando
                ? undefined
                : trackingItens.length === 1
                  ? "coisa"
                  : "coisas"
            }
          />

          <TrackingList itens={trackingItens} carregando={carregando} />
        </Flex>

        {/* Categorias */}
        <Flex flexDir="column" gap={5} align="start">
          <SectionHeader titulo="Categorias" />
          <Box
            w="100%"
            py={0}
            overflow="auto"
            css={{
              "&::-webkit-scrollbar": {
                display: "none",
              },
              scrollbarWidth: "none",
              "-webkit-overflow-scrolling": "touch",
            }}
          >
            <HStack
              gap={4}
              minW="max-content"
              px={4}
              justifyContent="flex-start"
            >
              {categories.map((category) => (
                <Box
                  key={category.id ?? category.name}
                  justifyItems="center"
                  gap={2.5}
                  p={3}
                >
                  <IconTile
                    icone={category.icon ?? LuShapes}
                    iconColor={category.iconColor}
                    backgroundColor={category.bgColor}
                    ring={true}
                    borderRadius="50%"
                    size="85px"
                  />
                  <Text fontSize="13px" textAlign="center" color="#2A332E">
                    {category.name}
                  </Text>
                </Box>
              ))}
            </HStack>
          </Box>
        </Flex>

        {/* Perto de você */}
        <Flex flexDir="column" gap={4}>
          <SectionHeader
            titulo="Perto de você"
            linkIsOn={true}
            linkTo="/explorar"
            linkLabel="Ver todos"
          />

          {carregando ? null : pertoDeVoce.length === 0 ? (
            <Box bg="white" borderRadius="3xl" p={6}>
              <Text fontSize="sm" color="#58665D">
                Ainda não há serviços disponíveis perto de você.
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {pertoDeVoce.map((servico) => (
                <CardAd
                  key={servico.id}
                  titulo={servico.title}
                  valor={servico.value}
                  data={servico.serviceDate}
                  bairro={servico.neighborhood}
                  cidade={servico.city}
                  categoria={categories.find(
                    (item) => item.id === servico.categoryId,
                  )}
                  nomeUsuario={servico.requesterName}
                  onClick={() => navigate(`/detalhe-servico/${servico.id}`)}
                />
              ))}
            </SimpleGrid>
          )}
        </Flex>
      </Flex>
    </DefaultLayout>
  );
}
