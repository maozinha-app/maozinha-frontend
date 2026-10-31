import { HStack, Text, VStack, Box, Spinner } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/contexts/Auth/AuthContext";
import { getReviewsUser } from "@/services/reviewService";

interface RatingRowProps {
  star: number;
  value: number;
  max: number;
}

const RatingRow = ({ star, value, max }: RatingRowProps) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <HStack gap={4} width="100%" alignItems="center">
      <HStack gap={1} minW="35px">
        <Text fontSize="sm" fontWeight="bold" color="gray.700">
          {star}
        </Text>
        <Text fontSize="sm" color="gray.600">
          ★
        </Text>
      </HStack>

      {/* Barra de progresso */}
      <Box flex="1" h="8px" bg="gray.100" borderRadius="full" overflow="hidden">
        <Box h="100%" w={`${percentage}%`} bg="#d99b26" borderRadius="full" />
      </Box>

      <Text fontSize="sm" color="gray.600" minW="15px" textAlign="right">
        {value}
      </Text>
    </HStack>
  );
};

interface IRatingDistributionProps {
  /** Usuário avaliado. Sem isso, usa o usuário logado. */
  userId?: number;
}

export const RatingDistribution = ({ userId }: IRatingDistributionProps) => {
  const auth = useContext(AuthContext);
  const targetId = userId ?? Number(auth.user?.id);

  const [ratings, setRatings] = useState([
    { star: 5, value: 0 },
    { star: 4, value: 0 },
    { star: 3, value: 0 },
    { star: 2, value: 0 },
    { star: 1, value: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) return;

    async function fetchReviewDistribution() {
      try {
        setLoading(true);

        const reviews = await getReviewsUser(targetId);

        // contador para cada nota
        const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        reviews.forEach((review) => {
          if (counts[review.rating] !== undefined) {
            counts[review.rating] += 1;
          }
        });

        setRatings([5, 4, 3, 2, 1].map((star) => ({ star, value: counts[star] })));
      } catch (error) {
        console.error("Erro ao carregar distribuição de avaliações:", error);
      } finally {
        setLoading(false);
      }
    }

    void fetchReviewDistribution();
  }, [targetId]);

  if (loading) {
    return <Spinner color="#1F7A50" />;
  }

  const sumRatings = ratings.reduce((total, rate) => total + rate.value, 0);
  const maxVal = Math.max(...ratings.map((r) => r.value), sumRatings);

  return (
    <VStack gap={0} align="stretch" w="100%" justify="space-between">
      {ratings.map((item) => (
        <RatingRow
          key={item.star}
          star={item.star}
          value={item.value}
          max={maxVal}
        />
      ))}
    </VStack>
  );
};