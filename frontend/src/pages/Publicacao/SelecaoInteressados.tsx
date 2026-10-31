import { Navigate, useParams, useSearchParams } from "react-router-dom";

export function SelecaoInteressados() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const id = params.id ?? searchParams.get("id");

  return (
    <Navigate
      to={id ? `/gerenciar-servico-publicado/${id}` : "/meus-servicos"}
      replace
    />
  );
}
