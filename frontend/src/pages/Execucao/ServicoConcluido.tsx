import { Navigate, useParams, useSearchParams } from "react-router-dom";

export function ServicoConcluido() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const id = params.id ?? searchParams.get("id");

  return (
    <Navigate
      to={id ? `/servico-em-andamento/${id}` : "/meus-servicos"}
      replace
    />
  );
}
