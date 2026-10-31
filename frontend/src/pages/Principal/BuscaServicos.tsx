import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { MdSearch, MdTune, MdGridView } from "react-icons/md";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { CardAd } from "@/components/CardAd";

import {
  categoryService,
  type IServiceCategory,
} from "../../services/categoryService";
import { serviceService, type IServico } from "../../services/serviceService";

type Ordenacao = "recentes" | "maior-preco" | "menor-preco" | "mais-proximo";

export function BuscaServicos() {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState<IServico[]>([]);
  const [categorias, setCategorias] = useState<IServiceCategory[]>([]);
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<
    number | null
  >(null);
  const [bairroSelecionado, setBairroSelecionado] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("recentes");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [listaServicos, listaCategorias] = await Promise.all([
          serviceService.getServicos({ size: 100 }),
          categoryService.getCategories(),
        ]);

        setServicos(listaServicos.content);
        setCategorias(listaCategorias);
      } catch (error) {
        console.error("Erro ao carregar a lista de serviços:", error);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  const bairros = useMemo(
    () =>
      [
        ...new Set(
          servicos
            .filter((servico) => servico.status === "ABERTO")
            .map((servico) => servico.neighborhood),
        ),
      ].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [servicos],
  );

  const servicosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    const resultado = servicos.filter((servico) => {
      const categoria = categorias.find(
        (item) => item.id === servico.categoryId,
      );

      const correspondeBusca =
        !termo ||
        servico.title.toLocaleLowerCase("pt-BR").includes(termo) ||
        servico.description.toLocaleLowerCase("pt-BR").includes(termo) ||
        servico.neighborhood.toLocaleLowerCase("pt-BR").includes(termo) ||
        categoria?.name.toLocaleLowerCase("pt-BR").includes(termo);

      const correspondeCategoria =
        categoriaSelecionada === null ||
        servico.categoryId === categoriaSelecionada;

      const correspondeBairro =
        !bairroSelecionado || servico.neighborhood === bairroSelecionado;

      return (
        servico.status === "ABERTO" &&
        correspondeBusca &&
        correspondeCategoria &&
        correspondeBairro
      );
    });

    return resultado.sort((a, b) => {
      if (ordenacao === "menor-preco") {
        return a.value - b.value;
      }
      if (ordenacao === "maior-preco") {
        return b.value - a.value;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    servicos,
    categorias,
    busca,
    categoriaSelecionada,
    bairroSelecionado,
    ordenacao,
  ]);

  return (
    <DefaultLayout
      titulo="Encontre um serviço"
      subtituloInferior={`${servicosFiltrados.length} ${
        servicosFiltrados.length === 1
          ? "serviço disponível"
          : "serviços disponíveis"
      } em São Luís - MA`}
    >
      <VStack align="stretch" gap={5} pb={8}>
        {/* Busca e filtros */}
        <Flex gap={2} direction={{ base: "column", md: "row" }}>
          <HStack
            flex={1}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            px={3}
            gap={2}
          >
            <MdSearch size={22} color="#65716A" />

            <Input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar: montagem, faxina, Cohama..."
              variant="flushed"
              border="none"
              _focusVisible={{ boxShadow: "none" }}
              aria-label="Buscar serviços"
            />
          </HStack>

          <Button
            variant="outline"
            bg="white"
            borderColor="gray.200"
            borderRadius="xl"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <MdTune />
            Filtros
          </Button>
        </Flex>

        {/* Filtros adicionais */}
        {mostrarFiltros && (
          <Flex
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="xl"
            p={4}
            gap={4}
            direction={{ base: "column", sm: "row" }}
          >
            <Box flex={1}>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Bairro
              </Text>

              <select
                value={bairroSelecionado}
                onChange={(event) => setBairroSelecionado(event.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  backgroundColor: "white",
                }}
              >
                <option value="">Todos os bairros</option>

                {bairros.map((bairro) => (
                  <option key={bairro} value={bairro}>
                    {bairro}
                  </option>
                ))}
              </select>
            </Box>

            <Box flex={1}>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Ordenar por
              </Text>

              <select
                value={ordenacao}
                onChange={(event) =>
                  setOrdenacao(event.target.value as Ordenacao)
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  backgroundColor: "white",
                }}
              >
                <option value="recentes">Data mais recente</option>
                <option value="menor-preco">Menor preço</option>
                <option value="maior-preco">Maior preço</option>
              </select>
            </Box>

            <Button
              alignSelf={{ base: "stretch", sm: "end" }}
              variant="ghost"
              onClick={() => {
                setBairroSelecionado("");
                setOrdenacao("recentes");
                setCategoriaSelecionada(null);
                setBusca("");
              }}
            >
              Limpar filtros
            </Button>
          </Flex>
        )}

        {/* Categorias */}
        <Flex gap={2} overflowX="auto" pb={2}>
          <Button
            flexShrink={0}
            borderRadius="full"
            bg={categoriaSelecionada === null ? "#202722" : "white"}
            color={categoriaSelecionada === null ? "white" : "#303B34"}
            border="1px solid"
            borderColor={categoriaSelecionada === null ? "#202722" : "gray.200"}
            onClick={() => setCategoriaSelecionada(null)}
          >
            <MdGridView />
            Todas
          </Button>

          {categorias.map((categoria) => {
            const CategoriaIcon = categoria.icon;
            const selecionada = categoriaSelecionada === categoria.id;

            return (
              <Button
                key={categoria.id}
                flexShrink={0}
                borderRadius="full"
                variant="outline"
                bg={selecionada ? categoria.bgColor : "white"}
                color="#303B34"
                borderColor={selecionada ? categoria.iconColor : "gray.200"}
                onClick={() =>
                  setCategoriaSelecionada(selecionada ? null : categoria.id)
                }
              >
                {CategoriaIcon && <CategoriaIcon />}
                {categoria.name}
              </Button>
            );
          })}
        </Flex>

        {/* Lista de serviços */}
        {carregando ? (
          <Text color="gray.600" py={8} textAlign="center">
            Carregando serviços...
          </Text>
        ) : servicosFiltrados.length === 0 ? (
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="2xl"
            p={10}
            textAlign="center"
          >
            <Heading size="md" mb={2}>
              Nenhum serviço encontrado
            </Heading>

            <Text color="gray.600">
              Tente mudar a busca ou selecionar outra categoria.
            </Text>

            <Button
              mt={4}
              bg="#197B50"
              color="white"
              onClick={() => {
                setBusca("");
                setCategoriaSelecionada(null);
                setBairroSelecionado("");
              }}
            >
              Ver todos os serviços
            </Button>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {servicosFiltrados.map((servico) => (
              <CardAd
                key={servico.id}
                titulo={servico.title}
                valor={servico.value}
                data={servico.serviceDate}
                bairro={servico.neighborhood}
                cidade={servico.city}
                categoria={categorias.find(
                  (item) => item.id === servico.categoryId,
                )}
                nomeUsuario={servico.requesterName}
                onClick={() => navigate(`/detalhe-servico/${servico.id}`)}
              />
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </DefaultLayout>
  );
}
