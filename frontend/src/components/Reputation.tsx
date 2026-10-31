import { AuthContext } from "@/contexts/Auth/AuthContext";
import {
  Heading,
  HStack,
  Flex,
  VStack,
  Text,
  RatingGroup,
} from "@chakra-ui/react";
import { useContext } from "react";
import { RatingDistribution } from "./RatingDistribuition";

interface IReputationProps {
  title: string;
  /** Dados de outro usuário. Sem eles, usa o usuário logado. */
  userId?: number;
  averageRating?: number | null;
  totalReviews?: number;
}

export const Reputation = ({
  title,
  userId,
  averageRating,
  totalReviews,
}: IReputationProps) => {
  const auth = useContext(AuthContext);

  const isOther = userId !== undefined;
  const rating = isOther ? averageRating : auth.user?.averageRating;
  const total = isOther ? totalReviews : auth.user?.totalReviews;

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
      </HStack>
      <HStack w="full" justify="space-between" gap="6%">
        <VStack>
          <Heading size="2xl" fontWeight="extrabold">
            {rating ? Number(rating).toFixed(1).replace(".", ",") : "–"}
          </Heading>

          <RatingGroup.Root
            key={String(rating)}
            count={5}
            defaultValue={rating ? Number(rating) : 0}
            readOnly
            size="md"
            colorPalette="orange"
          >
            <RatingGroup.Control />
            <RatingGroup.HiddenInput />
          </RatingGroup.Root>

          <Text fontSize={10} fontWeight="light">
            {total
              ? `${total} ${total === 1 ? "avaliação" : "avaliações"}`
              : "Sem avaliação"}
          </Text>
        </VStack>
        <RatingDistribution userId={userId} />
      </HStack>
    </Flex>
  );
};
