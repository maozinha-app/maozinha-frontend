import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuCircleCheck,
  LuClock,
  LuInfo,
  LuPlus,
  LuStar,
  LuUserCheck,
  LuUsers,
} from "react-icons/lu";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { Loading } from "@/components/Loading";
import { ServicoListItem } from "@/components/ServiceListItem";
import { getApiErrorMessage } from "@/services/api";
import {
  categoryService,
  type IServiceCategory,
} from "@/services/categoryService";
import { interestService, type IInteresse } from "@/services/interestService";
import { serviceService, type IServico } from "@/services/serviceService";
import { trackingService } from "@/services/trackingService";

type Aba = "publicados" | "interesses";

interface IMeuInteresse {
  interesse: IInteresse;
  servico: IServico;
}

const plural = (n: number, singular: string, pluralTxt: string) =>
  `${n} ${n === 1 ? singular : pluralTxt}`;

export function MeusServicos() {
  const navigate = useNavigate();

  const [aba, setAba] = useState<Aba>("publicados");
  const [categorias, setCategorias] = useState<IServiceCategory[]>([]);
  const [publicados, setPublicados] = useState<IServico[]>([]);
  const [interessadosPorServico, setInteressadosPorServico] = useState<
    Map<number, IInteresse[]>
  >(new Map());
  // Serviços concluídos em que ainda falta eu avaliar alguém
  const [faltaAvaliar, setFaltaAvaliar] = useState<Set<number>>(new Set());
  const [meusInteresses, setMeusInteresses] = useState<IMeuInteresse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      const [cats, meusServicos, interesses, acompanhar] =
        await Promise.allSettled([
          categoryService.getCategories(),
          serviceService.getMeusServicos(),
          interestService.getMeusInteresses(),
          trackingService.getItensParaAcompanhar(),
        ]);

      // Opcional: se falhar, só some o aviso "Falta avaliar".
      if (acompanhar.status === "fulfilled") {
        setFaltaAvaliar(
          new Set(
            acompanhar.value
              .filter((item) => item.tipo === "avaliar")
              .map((item) => Number(item.servicoId)),
          ),
        );
      }

      if (cats.status === "fulfilled") setCategorias(cats.value);

      const mensagensErro: string[] = [];

      // Publicados + quantidade de interessados/selecionados de cada um
      if (meusServicos.status === "fulfilled") {
        const lista = meusServicos.value.content;
        setPublicados(lista);

        const comInteressados = lista.filter(
          (s) => s.status !== "CANCELADO" && s.status !== "CONCLUIDO",
        );

        const resultados = await Promise.allSettled(
          comInteressados.map((s) =>
            interestService.getInteressadosDoServico(s.id),
          ),
        );

        const mapa = new Map<number, IInteresse[]>();
        resultados.forEach((resultado, index) => {
          if (resultado.status === "fulfilled") {
            mapa.set(comInteressados[index].id, resultado.value);
          }
        });
        setInteressadosPorServico(mapa);
      } else {
        mensagensErro.push(
          getApiErrorMessage(
            meusServicos.reason,
            "Não foi possível carregar seus serviços publicados.",
          ),
        );
      }

      // Meus interesses + dados do serviço de cada um
      if (interesses.status === "fulfilled") {
        const idsUnicos = [...new Set(interesses.value.map((i) => i.jobId))];

        const servicos = await Promise.allSettled(
          idsUnicos.map((jobId) => serviceService.getServicoPorId(jobId)),
        );

        const servicosPorId = new Map<number, IServico>();
        servicos.forEach((resultado, index) => {
          if (resultado.status === "fulfilled") {
            servicosPorId.set(idsUnicos[index], resultado.value);
          }
        });

        setMeusInteresses(
          interesses.value.flatMap((interesse) => {
            const servico = servicosPorId.get(interesse.jobId);
            return servico ? [{ interesse, servico }] : [];
          }),
        );
      } else {
        mensagensErro.push(
          getApiErrorMessage(
            interesses.reason,
            "Não foi possível carregar seus interesses.",
          ),
        );
      }

      setErro(mensagensErro.join(" "));
      setCarregando(false);
    };

    void carregar();
  }, []);

  if (carregando) return <Loading />;

  const categoriaDe = (servico: IServico) =>
    categorias.find((c) => c.id === servico.categoryId);

  const abrirPublicado = (servico: IServico) => {
    if (servico.status === "EM_ANDAMENTO" || servico.status === "CONCLUIDO") {
      navigate(`/servico-em-andamento/${servico.id}`);
    } else {
      navigate(`/gerenciar-servico-publicado/${servico.id}`);
    }
  };

  const abrirInteresse = ({ interesse, servico }: IMeuInteresse) => {
    if (interesse.status === "SELECIONADO") {
      navigate(`/servico-selecionado/${servico.id}`);
    } else {
      navigate(`/detalhe-servico/${servico.id}`);
    }
  };

  const detalhePublicado = (servico: IServico) => {
    const lista = interessadosPorServico.get(servico.id) ?? [];

    switch (servico.status) {
      case "ABERTO": {
        const pendentes = lista.filter((i) => i.status === "PENDENTE").length;
        return {
          texto:
            pendentes === 0
              ? "Ainda sem interessados"
              : plural(pendentes, "pessoa interessada", "pessoas interessadas"),
          icone: LuUsers,
        };
      }
      case "SELECIONADO":
      case "EM_ANDAMENTO": {
        const selecionados = lista.filter(
          (i) => i.status === "SELECIONADO",
        ).length;
        return {
          texto: plural(
            selecionados,
            "pessoa selecionada",
            "pessoas selecionadas",
          ),
          icone: LuUsers,
        };
      }
      case "CONCLUIDO":
        return faltaAvaliar.has(servico.id)
          ? { texto: "Falta avaliar", icone: LuStar }
          : { texto: "Serviço concluído", icone: LuCircleCheck };
      case "CANCELADO":
        return { texto: "Não recebe novos interessados", icone: LuInfo };
    }
  };

  const detalheInteresse = ({ interesse, servico }: IMeuInteresse) => {
    const primeiroNome = servico.requesterName.split(" ")[0];

    switch (interesse.status) {
      case "SELECIONADO":
        if (servico.status === "CONCLUIDO" && faltaAvaliar.has(servico.id)) {
          return { texto: "Falta avaliar", icone: LuStar };
        }
        return {
          texto:
            servico.status === "CONCLUIDO"
              ? "Você fez este serviço"
              : "Você foi selecionado(a)",
          icone: LuUserCheck,
        };
      case "NAO_SELECIONADO":
        return { texto: "Não foi dessa vez", icone: LuInfo };
      case "RETIRADO":
        return { texto: "Você retirou o interesse", icone: LuInfo };
      case "PENDENTE":
        return servico.status === "ABERTO"
          ? {
              texto: `Aguardando a escolha de ${primeiroNome}`,
              icone: LuClock,
            }
          : { texto: "Este serviço não está mais aberto", icone: LuInfo };
    }
  };

  const abas: { id: Aba; label: string }[] = [
    { id: "publicados", label: `Publicados (${publicados.length})` },
    { id: "interesses", label: `Meus interesses (${meusInteresses.length})` },
  ];

  return (
    <DefaultLayout>
      <Box maxW="1000px" mx="auto" w="100%">
        <VStack align="stretch" gap={6}>
          <Flex justify="space-between" align="center" gap={4}>
            <Heading
              as="h2"
              size={{ base: "2xl", md: "4xl" }}
              fontWeight="extrabold"
              letterSpacing="-0.02em"
              color="#202722"
            >
              Meus serviços
            </Heading>

            <Button
              variant="outline"
              bg="white"
              borderRadius="xl"
              fontWeight="bold"
              onClick={() => navigate("/criar")}
            >
              <LuPlus />
              Novo serviço
            </Button>
          </Flex>

          <HStack
            gap={1}
            p={1}
            bg="#E9ECE8"
            borderRadius="xl"
            alignSelf="flex-start"
          >
            {abas.map((item) => (
              <Button
                key={item.id}
                size="sm"
                borderRadius="lg"
                fontWeight="bold"
                bg={aba === item.id ? "white" : "transparent"}
                color={aba === item.id ? "#202722" : "#58665D"}
                boxShadow={aba === item.id ? "sm" : "none"}
                _hover={{ bg: aba === item.id ? "white" : "#DDE3DE" }}
                onClick={() => setAba(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </HStack>

          {erro && (
            <Alert.Root status="error" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>{erro}</Alert.Title>
            </Alert.Root>
          )}

          {aba === "publicados" && (
            <VStack align="stretch" gap={3}>
              {publicados.length === 0 && !erro && (
                <Flex
                  direction="column"
                  align="center"
                  gap={3}
                  bg="white"
                  borderRadius="2xl"
                  p={10}
                  color="#58665D"
                >
                  <Text>Você ainda não publicou nenhum serviço.</Text>
                  <Button
                    bg="#1F7A50"
                    borderRadius="xl"
                    onClick={() => navigate("/criar")}
                  >
                    <LuPlus />
                    Publicar serviço
                  </Button>
                </Flex>
              )}

              {publicados.map((servico) => {
                const detalhe = detalhePublicado(servico);

                return (
                  <ServicoListItem
                    key={servico.id}
                    servico={servico}
                    categoria={categoriaDe(servico)}
                    detalhe={detalhe.texto}
                    iconeDetalhe={detalhe.icone}
                    onClick={() => abrirPublicado(servico)}
                  />
                );
              })}
            </VStack>
          )}

          {aba === "interesses" && (
            <VStack align="stretch" gap={3}>
              {meusInteresses.length === 0 && !erro && (
                <Flex
                  direction="column"
                  align="center"
                  gap={3}
                  bg="white"
                  borderRadius="2xl"
                  p={10}
                  color="#58665D"
                >
                  <Text>
                    Você ainda não demonstrou interesse em nenhum serviço.
                  </Text>
                  <Button
                    bg="#1F7A50"
                    borderRadius="xl"
                    onClick={() => navigate("/explorar")}
                  >
                    Explorar serviços
                  </Button>
                </Flex>
              )}

              {meusInteresses.map((item) => {
                const detalhe = detalheInteresse(item);

                return (
                  <ServicoListItem
                    key={item.interesse.id}
                    servico={item.servico}
                    categoria={categoriaDe(item.servico)}
                    detalhe={detalhe.texto}
                    iconeDetalhe={detalhe.icone}
                    onClick={() => abrirInteresse(item)}
                  />
                );
              })}
            </VStack>
          )}
        </VStack>
      </Box>
    </DefaultLayout>
  );
}
