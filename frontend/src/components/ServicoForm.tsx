import { useEffect, useState, type ElementType, type ReactNode } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  InputGroup,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  LuCalendar,
  LuHandshake,
  LuMapPin,
  LuShapes,
  LuShieldCheck,
  LuTag,
} from "react-icons/lu";

import { getApiErrorMessage } from "@/services/api";
import { buscarLocalPorCep } from "@/services/cepService";
import {
  categoryService,
  type IServiceCategory,
} from "@/services/categoryService";
import type { ICriarServico } from "@/services/serviceService";

const TITULO_MAX = 60;
const DESCRICAO_MAX = 500;

// Ícone e cores vêm do categoryService; aqui só há o fallback
interface IEstiloCategoria {
  icon: ElementType;
  bg: string;
  color: string;
}

function estiloDaCategoria(categoria?: IServiceCategory): IEstiloCategoria {
  return {
    icon: categoria?.icon ?? LuTag,
    bg: categoria?.bgColor ?? "#EEF1EE",
    color: categoria?.iconColor ?? "#58665D",
  };
}

function formatarCep(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function formatarData(iso: string) {
  if (!iso) return "Data a definir";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarValor(valor: string) {
  const n = Number(valor);
  return (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const inputProps = {
  borderRadius: "xl",
  bg: "white",
  borderColor: "#DDE3DE",
  size: "lg" as const,
  _focusVisible: {
    borderColor: "#1F7A50",
    boxShadow: "0 0 0 1px #1F7A50",
    outline: "none",
  },
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text fontWeight="semibold" fontSize="sm" color="#202722">
      {children}
    </Text>
  );
}

export interface IValoresServico {
  titulo: string;
  descricao: string;
  categoriaId: string;
  valor: string;
  dataServico: string;
  cidade: string;
  bairro: string;
}

interface IServicoFormProps {
  /** Valores para preencher o formulário (edição) */
  valoresIniciais?: Partial<IValoresServico>;
  /** Texto do botão principal */
  textoEnviar: string;
  /** Faixa de aviso no topo do formulário */
  aviso?: ReactNode;
  /** Mensagem mostrada quando o envio dá certo */
  textoSucesso?: string;
  /** Esvazia o formulário depois de enviar (criação) */
  limparAposEnviar?: boolean;
  onSubmit: (dados: ICriarServico) => Promise<void>;
  onCancel: () => void;
}

export function ServicoForm({
  valoresIniciais,
  textoEnviar,
  aviso,
  textoSucesso,
  limparAposEnviar = false,
  onSubmit,
  onCancel,
}: IServicoFormProps) {
  const [categorias, setCategorias] = useState<IServiceCategory[]>([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [titulo, setTitulo] = useState(valoresIniciais?.titulo ?? "");
  const [descricao, setDescricao] = useState(valoresIniciais?.descricao ?? "");
  const [categoriaId, setCategoriaId] = useState(
    valoresIniciais?.categoriaId ?? "",
  );
  const [valor, setValor] = useState(valoresIniciais?.valor ?? "");
  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep] = useState("");
  const [cidade, setCidade] = useState(valoresIniciais?.cidade ?? "");
  const [bairro, setBairro] = useState(valoresIniciais?.bairro ?? "");
  const [dataServico, setDataServico] = useState(
    valoresIniciais?.dataServico ?? "",
  );

  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        const response = await categoryService.getCategories();
        setCategorias(response);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      } finally {
        setCarregandoCategorias(false);
      }
    };

    void carregarCategorias();
  }, []);

  // Preenche bairro e cidade quando o CEP estiver completo
  useEffect(() => {
    const digitos = cep.replace(/\D/g, "");
    setErroCep("");

    if (digitos.length !== 8) {
      setBuscandoCep(false);
      return;
    }

    let cancelado = false;

    const buscar = async () => {
      try {
        setBuscandoCep(true);
        const local = await buscarLocalPorCep(digitos);
        if (cancelado) return;

        if (local.cidade) setCidade(local.cidade);
        if (local.bairro) setBairro(local.bairro);
      } catch (error) {
        if (cancelado) return;
        setErroCep(
          error instanceof Error
            ? error.message
            : "Não foi possível buscar o CEP.",
        );
      } finally {
        if (!cancelado) setBuscandoCep(false);
      }
    };

    void buscar();

    return () => {
      cancelado = true;
    };
  }, [cep]);

  const hoje = new Date();
  const dataValida = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("-");

  const categoriaSelecionada = categorias.find(
    (c) => String(c.id) === categoriaId,
  );
  const estiloSelecionado = estiloDaCategoria(categoriaSelecionada);
  const IconeSelecionado = estiloSelecionado.icon;

  const handleSubmit = async () => {
    setMensagemSucesso("");
    setMensagemErro("");

    if (
      !titulo.trim() ||
      !descricao.trim() ||
      !categoriaId ||
      !valor ||
      !cidade ||
      !bairro ||
      !dataServico
    ) {
      setMensagemErro("Por favor, preencha todos os campos.");
      return;
    }

    if (Number(valor) <= 0 || !Number.isFinite(Number(valor))) {
      setMensagemErro("Informe um número válido para precificar o serviço.");
      return;
    }

    if (dataServico < dataValida) {
      setMensagemErro("A data do serviço não pode ser anterior à data atual.");
      return;
    }

    const dados: ICriarServico = {
      title: titulo.trim(),
      description: descricao.trim(),
      categoryId: Number(categoriaId),
      value: Number(valor),
      city: cidade.trim(),
      neighborhood: bairro.trim(),
      serviceDate: dataServico,
    };

    try {
      setEnviando(true);

      await onSubmit(dados);

      if (textoSucesso) setMensagemSucesso(textoSucesso);

      if (limparAposEnviar) {
        setTitulo("");
        setDescricao("");
        setCategoriaId("");
        setValor("");
        setCidade(valoresIniciais?.cidade ?? "");
        setBairro(valoresIniciais?.bairro ?? "");
        setDataServico("");
        setCep("");
      }
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      setMensagemErro(
        getApiErrorMessage(
          error,
          "Não foi possível salvar o serviço. Tente novamente.",
        ),
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Flex gap={6} align="flex-start" direction={{ base: "column", lg: "row" }}>
      {/* Card do formulário */}
      <VStack
        align="stretch"
        gap={5}
        bg="white"
        borderRadius="3xl"
        p={{ base: 5, md: 7 }}
        flex="1"
        w="100%"
        minW={0}
      >
        {aviso}

        {/* Título */}
        <Box>
          <Flex justify="space-between" align="baseline" mb={2}>
            <Label>O que você precisa?</Label>
            <Text fontSize="xs" color="#58665D">
              {titulo.length}/{TITULO_MAX}
            </Text>
          </Flex>

          <Input
            placeholder="Ex.: Montar guarda-roupa de 6 portas"
            value={titulo}
            maxLength={TITULO_MAX}
            onChange={(e) => setTitulo(e.target.value)}
            {...inputProps}
          />
        </Box>

        {/* Categoria */}
        <Box>
          <Box mb={2}>
            <Label>Categoria</Label>
          </Box>

          {carregandoCategorias ? (
            <Text fontSize="sm" color="#58665D">
              Carregando categorias...
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
              {categorias.map((categoria) => {
                const ativa = String(categoria.id) === categoriaId;
                const estilo = estiloDaCategoria(categoria);
                const Icone = estilo.icon;

                return (
                  <Flex
                    key={categoria.id}
                    as="button"
                    // @ts-expect-error: atributo nativo do <button>
                    type="button"
                    onClick={() => setCategoriaId(String(categoria.id))}
                    aria-pressed={ativa}
                    align="center"
                    gap={2}
                    p={2}
                    textAlign="left"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={ativa ? "#1F7A50" : "#DDE3DE"}
                    bg={ativa ? "#EEF6F1" : "white"}
                    boxShadow={ativa ? "0 0 0 1px #1F7A50" : "none"}
                    transition="all 0.15s"
                    _hover={{ borderColor: "#1F7A50" }}
                  >
                    <Flex
                      boxSize="32px"
                      flexShrink={0}
                      align="center"
                      justify="center"
                      borderRadius="full"
                      bg={estilo.bg}
                      color={estilo.color}
                    >
                      <Icone size={16} />
                    </Flex>

                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      lineHeight="1.2"
                      color="#202722"
                    >
                      {categoria.name}
                    </Text>
                  </Flex>
                );
              })}
            </SimpleGrid>
          )}
        </Box>

        {/* Descrição */}
        <Box>
          <Flex justify="space-between" align="baseline" mb={2}>
            <Label>Descrição</Label>
            <Text fontSize="xs" color="#58665D">
              {descricao.length}/{DESCRICAO_MAX}
            </Text>
          </Flex>

          <Textarea
            placeholder="Conte o que precisa ser feito, o tamanho do serviço e se você já tem o material."
            value={descricao}
            maxLength={DESCRICAO_MAX}
            onChange={(e) => setDescricao(e.target.value)}
            minH="130px"
            {...inputProps}
          />
        </Box>

        {/* Valor + Data */}
        <Flex gap={4} direction={{ base: "column", md: "row" }}>
          <Box flex="1">
            <Box mb={2}>
              <Label>Quanto você vai pagar?</Label>
            </Box>

            <InputGroup
              startElement={
                <Text fontWeight="semibold" color="#58665D">
                  R$
                </Text>
              }
            >
              <Input
                type="number"
                placeholder="80,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                min={0.01}
                step="0.01"
                {...inputProps}
              />
            </InputGroup>
          </Box>

          <Box flex="1">
            <Box mb={2}>
              <Label>Quando?</Label>
            </Box>

            <Input
              type="date"
              value={dataServico}
              onChange={(e) => setDataServico(e.target.value)}
              min={dataValida}
              {...inputProps}
            />
          </Box>
        </Flex>

        {/* Aviso de valor */}
        <HStack
          bg="#EEF6F1"
          borderRadius="xl"
          px={4}
          py={3}
          gap={3}
          color="#185B3E"
        >
          <LuHandshake size={18} style={{ flexShrink: 0 }} />
          <Text fontSize="sm">
            Quem tiver interesse aceita esse valor. Não existe negociação no
            Mãozinha.
          </Text>
        </HStack>

        {/* CEP */}
        <Box maxW={{ md: "calc(50% - 8px)" }}>
          <Box mb={2}>
            <Label>CEP</Label>
          </Box>

          <InputGroup
            endElement={
              buscandoCep ? <Spinner size="sm" color="#1F7A50" /> : undefined
            }
          >
            <Input
              value={cep}
              onChange={(e) => setCep(formatarCep(e.target.value))}
              placeholder="00000-000"
              inputMode="numeric"
              maxLength={9}
              {...inputProps}
            />
          </InputGroup>

          {erroCep ? (
            <Text fontSize="xs" color="red.600" mt={1}>
              {erroCep}. Você pode preencher bairro e cidade manualmente.
            </Text>
          ) : (
            <Text fontSize="xs" color="#58665D" mt={1}>
              Digite o CEP para preencher bairro e cidade automaticamente.
            </Text>
          )}
        </Box>

        {/* Bairro + Cidade */}
        <Flex gap={4} direction={{ base: "column", md: "row" }}>
          <Box flex="1">
            <Box mb={2}>
              <Label>Bairro</Label>
            </Box>

            <Input
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Seu bairro"
              {...inputProps}
            />
          </Box>

          <Box flex="1">
            <Box mb={2}>
              <Label>Cidade</Label>
            </Box>

            <Input
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Sua cidade"
              {...inputProps}
            />
          </Box>
        </Flex>

        <HStack gap={2} color="#58665D" mt={-2}>
          <LuShieldCheck size={14} style={{ flexShrink: 0 }} />
          <Text fontSize="xs">
            Só o bairro e a cidade aparecem no anúncio. Nunca peça ou publique o
            endereço exato.
          </Text>
        </HStack>

        {/* Mensagens */}
        {mensagemErro && (
          <Box
            bg="red.50"
            borderRadius="xl"
            p={3}
            border="1px solid"
            borderColor="red.200"
          >
            <Text color="red.700" fontSize="sm">
              {mensagemErro}
            </Text>
          </Box>
        )}

        {mensagemSucesso && (
          <Box bg="#DDEEE3" borderRadius="xl" p={3}>
            <Text color="#185B3E" fontSize="sm" fontWeight="medium">
              {mensagemSucesso}
            </Text>
          </Box>
        )}

        {/* Ações */}
        <Flex
          gap={3}
          pt={4}
          borderTop="1px solid"
          borderColor="#EEF1EE"
          direction={{ base: "column-reverse", md: "row" }}
        >
          <Button
            bg="#1F7A50"
            color="white"
            _hover={{ bg: "#185B3E" }}
            borderRadius="xl"
            size="lg"
            flex="1"
            fontWeight="bold"
            onClick={handleSubmit}
            loading={enviando}
            disabled={enviando || carregandoCategorias}
          >
            {textoEnviar}
          </Button>

          <Button
            variant="outline"
            bg="white"
            color="#202722"
            borderColor="#DDE3DE"
            _hover={{ bg: "#F6F7F5" }}
            borderRadius="xl"
            size="lg"
            fontWeight="bold"
            onClick={onCancel}
            disabled={enviando}
          >
            Cancelar
          </Button>
        </Flex>
      </VStack>

      {/* Prévia do anúncio */}
      <Box
        w={{ base: "100%", lg: "300px" }}
        flexShrink={0}
        position={{ lg: "sticky" }}
        top={{ lg: "24px" }}
        mb="80px"
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          letterSpacing="0.06em"
          color="#58665D"
          mb={3}
        >
          PRÉVIA DO ANÚNCIO
        </Text>

        <VStack align="stretch" gap={3} bg="white" borderRadius="2xl" p={5}>
          <HStack
            alignSelf="flex-start"
            bg="#EEF1EE"
            borderRadius="full"
            px={3}
            py={1}
            gap={2}
            color="#303B34"
          >
            {categoriaSelecionada ? (
              <IconeSelecionado size={14} color={estiloSelecionado.color} />
            ) : (
              <LuShapes size={14} />
            )}
            <Text fontSize="xs" fontWeight="medium">
              {categoriaSelecionada?.name || "Categoria"}
            </Text>
          </HStack>

          <Text
            fontWeight="bold"
            color="#202722"
            lineClamp={2}
            wordBreak="break-word"
          >
            {titulo.trim() || "Título do serviço"}
          </Text>

          <Text fontSize="2xl" fontWeight="extrabold" color="#185B3E">
            {formatarValor(valor)}
          </Text>

          <VStack align="stretch" gap={1} fontSize="sm" color="#58665D">
            <HStack gap={2}>
              <LuCalendar size={15} />
              <Text>{formatarData(dataServico)}</Text>
            </HStack>

            <HStack gap={2}>
              <LuMapPin size={15} />
              <Text>
                {[bairro.trim(), cidade.trim()].filter(Boolean).join(", ") ||
                  "Local do serviço"}
              </Text>
            </HStack>
          </VStack>
        </VStack>

        <Text fontSize="xs" color="#58665D" mt={3}>
          É assim que as pessoas vão ver seu serviço na busca.
        </Text>
      </Box>
    </Flex>
  );
}
