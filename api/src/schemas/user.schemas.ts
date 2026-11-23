import { z } from "zod";
import { ValidationError } from "../errors/AppError.js";

function isValidCpf(value: string) {
  if (value.length !== 11 || /^(\d)\1{10}$/.test(value)) {
    return false;
  }

  const calculateDigit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(value[index]) * (length + 1 - index);
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return (
    calculateDigit(9) === Number(value[9]) &&
    calculateDigit(10) === Number(value[10])
  );
}

const cpfSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 11, "CPF deve ter 11 dígitos")
  .refine(isValidCpf, "CPF inválido");

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "Senha deve ter ao menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve ter ao menos uma letra minúscula")
  .regex(/\d/, "Senha deve ter ao menos um número");

const musicUrlSchema = z
  .string()
  .trim()
  .url("URL inválida")
  .max(500)
  .nullable()
  .optional();

export const createUserSchema = z
  .object({
    name: z.string().trim().min(1, "Nome é obrigatório"),
    email: z.string().trim().toLowerCase().email("E-mail inválido"),
    cpf: cpfSchema,
    password: passwordSchema,
    musicUrl: musicUrlSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("E-mail inválido"),
    password: z.string().min(1, "Senha é obrigatória"),
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, "Nome não pode ser vazio"),
    cpf: cpfSchema,
    password: passwordSchema,
    musicUrl: musicUrlSchema,
  })
  .strict();

export type CreateUserData = z.infer<typeof createUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;

export function parseSchema<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError("Dados inválidos", {
      issues: result.error.flatten().fieldErrors,
    });
  }

  return result.data;
}
