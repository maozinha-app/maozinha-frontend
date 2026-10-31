import { Box, Flex, HStack, Text, Wrap } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { DefaultLayout } from "../../layouts/DefaultLayout";
import { ButtonBox } from "@/components/ButtonBox";
import { MdFrontHand, MdArrowForward, MdAdd } from "react-icons/md";
import { SectionHeader } from "@/components/SectionHeader";
import { categoryService } from "@/services/categoryService";
import { IconTile } from "@/components/IconTile";
import { AuthContext } from "@/contexts/Auth/AuthContext";

export function Inicio() {
  const [categories, setCategories] = useState<any[]>([]);
  const auth = useContext(AuthContext);

  const saudacao = "Olá, " + auth.user?.name + "! Do que você precisa hoje?";
  const localizacao = `${auth.user?.neighborhood}, ${auth.user?.city}`;

  useEffect(() => {
    const loadCategories = async () => {
      const response = await categoryService.getCategories();
      setCategories(response);
    };

    loadCategories();
  }, []);

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
          />
          <ButtonBox
            iconLeft={MdFrontHand}
            iconRight={MdArrowForward}
            iconColorFillLeft="#6E5A12"
            iconColorFillRight="#ffffff"
            backgrundColor="#F5ECD2"
            titulo="Quero dar uma mãozinha"
            subtitulo="Veja serviços perto de você e demonstre interesse no valor anunciado."
          />
        </Flex>
        <Flex>
          <SectionHeader
            titulo="Para acompanhar"
            itemsCount={4}
            itemsLabel="coisas"
          />
        </Flex>

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
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Box justifyItems="center" gap={2.5} p={3}>
                    <IconTile
                      key={category.id ?? category.name}
                      icone={IconComponent}
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
                );
              })}
            </HStack>
          </Box>
        </Flex>

        <Flex flexDir="column" gap={10}>
          <SectionHeader titulo="Perto de você" linkIsOn={true} />
        </Flex>
      </Flex>
    </DefaultLayout>
  );
}
