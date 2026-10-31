import {
  Alert,
  Avatar,
  Box,
  Button,
  Field,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Text,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { withMask } from "use-mask-input";
import { LuLock, LuPlus, LuX } from "react-icons/lu";
import { MdSearch } from "react-icons/md";

import { DefaultLayout } from "../../layouts/DefaultLayout";
import { BackButton } from "@/components/BackButton";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import { getApiErrorMessage } from "@/services/api";
import { buscarLocalPorCep } from "@/services/cepService";
import { skillService, type ISkill } from "@/services/SkillService";
import { updateMyProfile } from "@/services/userService";
import type { User } from "@/types/User";

const LIMITE_HABILIDADES = 10;
const LIMITE_SUGESTOES = 8;

const inputStyle = {
  borderRadius: "xl",
  height: "52px",
  _focus: { borderColor: "#1F7A50" },
} as const;

// 98988124410 -> (98) 98812-4410 (o backend pode ter guardado só os números)
const formatarWhatsapp = (valor: string) => {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return valor;
};

const mesmoNome = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

export function EditarPerfil() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const usuario = auth.user;

  const [name, setName] = useState(usuario?.name ?? "");
  const [whatsapp, setWhatsapp] = useState(
    formatarWhatsapp(usuario?.whatsapp ?? ""),
  );
  const [cep, setCep] = useState("");
  const [neighborhood, setNeighborhood] = useState(usuario?.neighborhood ?? "");
  const [city, setCity] = useState(usuario?.city ?? "");

  const [habilidades, setHabilidades] = useState<string[]>(
    usuario?.skills ?? [],
  );
  const [catalogo, setCatalogo] = useState<ISkill[]>([]);
  const [novaHabilidade, setNovaHabilidade] = useState("");

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    const carregarCatalogo = async () => {
      try {
        setCatalogo(await skillService.getSkills());
      } catch (error) {
        // Sem catálogo ainda dá para editar os dados; só as sugestões somem.
        console.error("Erro ao carregar habilidades:", error);
      }
    };

    void carregarCatalogo();
  }, []);

  const handleCep = async () => {
    setBuscandoCep(true);
    setErro("");

    try {
      const endereco = await buscarLocalPorCep(cep);
      setNeighborhood(endereco.bairro);
      setCity(endereco.cidade);
    } catch {
      setErro("Não foi possível buscar o endereço. Verifique o CEP.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const adicionarHabilidade = (nome: string) => {
    const limpo = nome.trim();

    if (!limpo) return;
    if (habilidades.some((h) => mesmoNome(h, limpo))) {
      setNovaHabilidade("");
      return;
    }
    if (habilidades.length >= LIMITE_HABILIDADES) {
      setErro(`Você pode ter até ${LIMITE_HABILIDADES} habilidades.`);
      return;
    }

    // Se já existe no catálogo, usa o nome oficial (mesma grafia).
    const existente = catalogo.find((s) => mesmoNome(s.name, limpo));

    setHabilidades((atuais) => [...atuais, existente?.name ?? limpo]);
    setNovaHabilidade("");
    setErro("");
  };

  const removerHabilidade = (nome: string) => {
    setHabilidades((atuais) => atuais.filter((h) => h !== nome));
    setErro("");
  };

  // Aplica só a diferença entre as habilidades do perfil e as da tela.
  const sincronizarHabilidades = async (
    perfilAtual: User,
    original: string[],
  ): Promise<User> => {
    const remover = original.filter(
      (nome) => !habilidades.some((h) => mesmoNome(h, nome)),
    );
    const adicionar = habilidades.filter(
      (nome) => !original.some((o) => mesmoNome(o, nome)),
    );

    let perfil = perfilAtual;
    const catalogoAtual = [...catalogo];

    for (const nome of remover) {
      const skill = catalogoAtual.find((s) => mesmoNome(s.name, nome));
      if (skill) perfil = await skillService.removeFromMyProfile(skill.id);
    }

    for (const nome of adicionar) {
      let skill = catalogoAtual.find((s) => mesmoNome(s.name, nome));

      if (!skill) {
        skill = await skillService.createSkill(nome);
        catalogoAtual.push(skill);
      }

      perfil = await skillService.addToMyProfile(skill.id);
    }

    setCatalogo(catalogoAtual);
    return perfil;
  };

  const handleSalvar = async () => {
    if (!usuario) return;

    setHasSubmitted(true);
    setErro("");
    setSucesso("");

    if (
      !name.trim() ||
      !whatsapp.trim() ||
      !neighborhood.trim() ||
      !city.trim()
    ) {
      setErro("Preencha nome, WhatsApp, bairro e cidade.");
      return;
    }

    setSalvando(true);

    try {
      const perfilAtualizado = await updateMyProfile({
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
      });

      const perfilFinal = await sincronizarHabilidades(
        perfilAtualizado,
        usuario.skills ?? [],
      );

      auth.updateUser(perfilFinal);
      setSucesso("Perfil atualizado!");
      navigate("/meu-perfil");
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível salvar o perfil."));
    } finally {
      setSalvando(false);
    }
  };

  const sugestoes = catalogo
    .filter((s) => !habilidades.some((h) => mesmoNome(h, s.name)))
    .slice(0, LIMITE_SUGESTOES);

  return (
    <DefaultLayout>
      <Box maxW="860px" mx="auto" w="100%">
        <VStack align="stretch" gap={6}>
          <HStack gap={3}>
            <BackButton to="meu-perfil" />
            <Heading
              as="h2"
              size="3xl"
              fontWeight="extrabold"
              letterSpacing="-0.02em"
              color="#202722"
            >
              Editar perfil
            </Heading>
          </HStack>

          {/* Dados pessoais */}
          <VStack
            align="stretch"
            gap={5}
            bg="white"
            borderRadius="3xl"
            p={{ base: 5, md: 7 }}
          >
            <HStack gap={4}>
              <Avatar.Root
                shape="rounded"
                boxSize="88px"
                rounded="24px"
                background="#F6D8C5"
              >
                <Avatar.Fallback
                  name={name || usuario?.name}
                  fontWeight="extrabold"
                  fontSize="28px"
                />
              </Avatar.Root>
              <Text fontSize="sm" color="#58665D">
                A foto de perfil ainda não está disponível. Por enquanto
                mostramos suas iniciais.
              </Text>
            </HStack>

            <Field.Root invalid={hasSubmitted && !name.trim()}>
              <Field.Label fontWeight="bold">Nome completo</Field.Label>
              <Input
                {...inputStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field.Root>

            <Field.Root invalid={hasSubmitted && !whatsapp.trim()}>
              <Field.Label fontWeight="bold">WhatsApp</Field.Label>
              <Input
                {...inputStyle}
                ref={withMask("(99) 99999-9999", { placeholder: "_" })}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
              <Field.HelperText color="#58665D">
                <LuLock /> Não aparece no perfil público.
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label fontWeight="bold">
                CEP{" "}
                <Text as="span" fontWeight="normal" color="#58665D">
                  (para atualizar bairro e cidade)
                </Text>
              </Field.Label>
              <InputGroup
                endElement={
                  <IconButton
                    aria-label="Buscar CEP"
                    variant="ghost"
                    size="sm"
                    loading={buscandoCep}
                    onClick={handleCep}
                  >
                    <MdSearch />
                  </IconButton>
                }
              >
                <Input
                  {...inputStyle}
                  placeholder="00000-000"
                  ref={withMask("99999-999", { placeholder: "_" })}
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  onBlur={() => {
                    if (cep.replace(/\D/g, "").length === 8) void handleCep();
                  }}
                />
              </InputGroup>
            </Field.Root>

            <Flex gap={4} direction={{ base: "column", md: "row" }}>
              <Field.Root invalid={hasSubmitted && !neighborhood.trim()}>
                <Field.Label fontWeight="bold">Bairro</Field.Label>
                <Input
                  {...inputStyle}
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </Field.Root>

              <Field.Root invalid={hasSubmitted && !city.trim()}>
                <Field.Label fontWeight="bold">Cidade</Field.Label>
                <Input
                  {...inputStyle}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Field.Root>
            </Flex>
          </VStack>

          {/* Habilidades */}
          <VStack
            align="stretch"
            gap={4}
            bg="white"
            borderRadius="3xl"
            p={{ base: 5, md: 7 }}
          >
            <HStack justify="space-between" align="baseline">
              <Heading size="lg" fontWeight="extrabold" color="#202722">
                Habilidades
              </Heading>
              <Text fontSize="sm" color="#58665D">
                {habilidades.length}/{LIMITE_HABILIDADES}
              </Text>
            </HStack>

            <Text fontSize="sm" color="#58665D">
              Conte no que você é bom. Isso aparece quando você demonstra
              interesse.
            </Text>

            <Wrap gap={2}>
              {habilidades.map((nome) => (
                <HStack
                  key={nome}
                  gap={2}
                  pl={4}
                  pr={2}
                  py={2}
                  borderRadius="full"
                  bg="#EEF6F1"
                  color="#185B3E"
                  fontWeight="semibold"
                >
                  <Text>{nome}</Text>
                  <IconButton
                    aria-label={`Remover ${nome}`}
                    variant="ghost"
                    size="2xs"
                    rounded="full"
                    color="#185B3E"
                    onClick={() => removerHabilidade(nome)}
                  >
                    <LuX />
                  </IconButton>
                </HStack>
              ))}
            </Wrap>

            <HStack gap={3}>
              <Input
                {...inputStyle}
                placeholder="Ex.: Pintura de parede"
                value={novaHabilidade}
                maxLength={60}
                onChange={(e) => setNovaHabilidade(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarHabilidade(novaHabilidade);
                  }
                }}
              />
              <Button
                h="52px"
                px={6}
                borderRadius="xl"
                bg="#202722"
                fontWeight="bold"
                disabled={!novaHabilidade.trim()}
                onClick={() => adicionarHabilidade(novaHabilidade)}
              >
                Adicionar
              </Button>
            </HStack>

            {sugestoes.length > 0 && (
              <VStack align="stretch" gap={2}>
                <Text fontSize="sm" fontWeight="bold" color="#58665D">
                  Sugestões
                </Text>
                <Wrap gap={2}>
                  {sugestoes.map((skill) => (
                    <Button
                      key={skill.id}
                      size="sm"
                      variant="outline"
                      borderStyle="dashed"
                      borderRadius="full"
                      onClick={() => adicionarHabilidade(skill.name)}
                    >
                      <LuPlus />
                      {skill.name}
                    </Button>
                  ))}
                </Wrap>
              </VStack>
            )}
          </VStack>

          {erro && (
            <Alert.Root status="error" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>{erro}</Alert.Title>
            </Alert.Root>
          )}

          {sucesso && (
            <Alert.Root status="success" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title>{sucesso}</Alert.Title>
            </Alert.Root>
          )}

          <Flex gap={3} direction={{ base: "column", sm: "row" }}>
            <Button
              flex="1"
              h="56px"
              borderRadius="16px"
              bg="#1F7A50"
              fontWeight="bold"
              loading={salvando}
              onClick={handleSalvar}
            >
              Salvar alterações
            </Button>
            <Button
              h="56px"
              px={10}
              borderRadius="16px"
              variant="outline"
              fontWeight="bold"
              disabled={salvando}
              onClick={() => navigate("/meu-perfil")}
            >
              Cancelar
            </Button>
          </Flex>
        </VStack>
      </Box>
    </DefaultLayout>
  );
}
