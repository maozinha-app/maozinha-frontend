import { getCurrentUser } from "@/services/userService";
import {
  Heading,
  HStack,
  Text,
  Badge,
  Wrap,
  WrapItem,
  Flex,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

interface ISkillsProps {
  title: string;
  /** Habilidades de outro usuário. Sem isso, carrega as do usuário logado. */
  skills?: string[];
  /** Mostra o link "Editar" (só faz sentido no próprio perfil). */
  editable?: boolean;
}

export const Skills = ({
  title,
  skills: externalSkills,
  editable = true,
}: ISkillsProps) => {
  const [ownSkills, setOwnSkills] = useState<string[]>([]);

  useEffect(() => {
    if (externalSkills) return;

    const loadSkills = async () => {
      try {
        const response = await getCurrentUser();
        setOwnSkills(response.skills);
      } catch (error) {
        console.error("Erro ao carregar habilidades:", error);
      }
    };

    void loadSkills();
  }, [externalSkills]);

  const skills = externalSkills ?? ownSkills;

  return (
    <Flex
      flex={1}
      bg="#fff"
      w="full"
      rounded={28}
      p={6}
      justify="center"
      direction="column"
      gap={3}
    >
      <HStack justify="space-between" w="full">
        <Heading as="h3" size="md" fontWeight="bold">
          {title}
        </Heading>
        {editable && (
          <RouterLink aria-label="Ir para editar perfil" to="/editar-perfil">
            <Text fontSize="14px" color="#1F7A50" fontWeight="medium">
              Editar
            </Text>
          </RouterLink>
        )}
      </HStack>

      {skills.length === 0 ? (
        <Text fontSize="sm" color="#58665D">
          Nenhuma habilidade informada.
        </Text>
      ) : (
        <Wrap direction="row" w="full" gap={2}>
          {skills.map((skill) => (
            <WrapItem key={skill}>
              <Badge
                variant="solid"
                background="#E3F3EB"
                color="#155238"
                p={"6px 22px"}
                rounded="2xl"
                size="sm"
              >
                <Text fontSize={11}>{skill}</Text>
              </Badge>
            </WrapItem>
          ))}
        </Wrap>
      )}
    </Flex>
  );
};
