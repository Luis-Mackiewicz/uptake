export const GENERIC_ERROR_MESSAGE = "Não foi possível concluir a operação. Tente novamente.";

export const STATUS_MESSAGES: Record<number, string> = {
  400: "Verifique os dados informados.",
  401: "Sua sessão expirou. Entre novamente.",
  403: "Você não tem permissão para esta ação.",
  404: "Registro não encontrado.",
  409: "Já existe um registro com esses dados.",
};
