import { AuthContext } from "@/contexts/Auth/AuthContext";
import { getReviewsUser, type IAvaliacao } from "@/services/reviewService";
import {
  Avatar,
  Box,
  Flex,
  Heading,
  HStack,
  RatingGroup,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { LuStarOff } from "react-icons/lu";

interface IReviewsReceivedProps {
  title: string;
  /** Usuário avaliado. Sem isso, usa o usuário logado. */
  userId?: number;
}

const CORES_AVATAR = ["#D6E6F8", "#F6E3B8", "#E0D8F2", "#E6E2D5", "#F8D7E3"];

export const ReviewsReceived = ({ title, userId }: IReviewsReceivedProps) => {
  const auth = useContext(AuthContext);
  const targetId = userId ?? Number(auth.user?.id);

  const [reviews, setReviews] = useState<IAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) return;

    async function fetchReview() {
      try {
        setLoading(true);
        const data = await getReviewsUser(targetId);
        setReviews(data);
      } catch (error) {
        console.error("Erro ao buscar avaliações:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchReview();
  }, [targetId]);

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
      <Heading as="h3" size="md" fontWeight="bold">
        {title}
      </Heading>

      {loading && (
        <Text fontSize="sm" color="#58665D">
          Carregando...
        </Text>
      )}

      {!loading && reviews.length === 0 && (
        <VStack textAlign="center" fontWeight="medium" py={4}>
          <LuStarOff />
          Sem avaliações ainda.
        </VStack>
      )}

      {!loading &&
        reviews.map((review, index) => (
          <HStack
            key={review.id}
            w="full"
            gap={3}
            align="flex-start"
            pt={3}
            borderTopWidth="1px"
            borderColor="#EEF1EE"
          >
            <Avatar.Root
              shape="rounded"
              rounded="10px"
              boxSize="40px"
              flexShrink={0}
              background={CORES_AVATAR[index % CORES_AVATAR.length]}
            >
              <Avatar.Fallback
                name={review.reviewerName}
                fontWeight="bold"
                fontSize="12px"
              />
            </Avatar.Root>

            <VStack align="stretch" gap={1} flex="1" minW={0}>
              <HStack justify="space-between" gap={3}>
                <Heading size="xs" fontWeight="extrabold">
                  {review.reviewerName}
                </Heading>
                <Text fontSize={11} color="#58665D">
                  {new Date(review.reviewDate).toLocaleDateString("pt-BR")}
                </Text>
              </HStack>

              <RatingGroup.Root
                count={5}
                readOnly
                defaultValue={review.rating}
                size="xs"
                colorPalette="orange"
              >
                <RatingGroup.Control />
                <RatingGroup.HiddenInput />
              </RatingGroup.Root>

              {review.comment && (
                <Box>
                  <Text fontSize="sm" color="#202722">
                    {review.comment}
                  </Text>
                </Box>
              )}
            </VStack>
          </HStack>
        ))}
    </Flex>
  );
};
