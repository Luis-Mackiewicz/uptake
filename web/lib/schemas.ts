import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NOTE_BYTES = 2 * 1024 * 1024;

function isValidCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const calculateDigit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(digits[index]) * (length + 1 - index);
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(9) === Number(digits[9]) && calculateDigit(10) === Number(digits[10]);
}

function isValidPassword(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidPositiveId(value: number) {
  return Number.isInteger(value) && value > 0;
}

function hasNoSlash(value: string) {
  return !value.includes("/") && !value.includes("\\");
}

const emailSchema = z.string().trim().min(1, "Informe seu e-mail").regex(EMAIL_PATTERN, "E-mail inválido");
const cpfSchema = z.string().refine(isValidCpf, "CPF inválido");
const strongPasswordSchema = z.string().refine(isValidPassword, "Use 8+ caracteres com maiúscula, minúscula e número");
const confirmPasswordSchema = z.string();

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "Informe seu nome"),
    lastName: z.string().trim().min(1, "Informe seu sobrenome"),
    email: emailSchema,
    cpf: cpfSchema,
    password: strongPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const profileFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "Informe seu nome"),
    lastName: z.string().trim().min(1, "Informe seu sobrenome"),
    cpf: cpfSchema,
    password: strongPasswordSchema,
    confirmPassword: confirmPasswordSchema,
    musicUrl: z
      .string()
      .trim()
      .refine((value) => value.length === 0 || isValidUrl(value), "URL inválida"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const groupFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(100, "Máximo de 100 caracteres"),
  description: z.string().trim().max(500, "Máximo de 500 caracteres"),
});
export type GroupFormValues = z.infer<typeof groupFormSchema>;

export const contentFormSchema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(200, "Máximo de 200 caracteres"),
  description: z.string().trim().max(2000, "Máximo de 2000 caracteres"),
});
export type ContentFormValues = z.infer<typeof contentFormSchema>;

export const noteNameSchema = z
  .string()
  .trim()
  .min(1, "Informe o nome")
  .max(251, "Máximo de 251 caracteres")
  .refine(hasNoSlash, "Não use barras no nome");

export const noteFormSchema = z.object({ name: noteNameSchema });
export type NoteFormValues = z.infer<typeof noteFormSchema>;

export const noteFileNameSchema = z
  .string()
  .trim()
  .min(1, "Informe o nome")
  .max(255, "Máximo de 255 caracteres")
  .refine(hasNoSlash, "Não use barras no nome");

export const examFormSchema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(200, "Máximo de 200 caracteres"),
  description: z.string().trim().max(500, "Máximo de 500 caracteres"),
  examDate: z.string().refine(isValidDate, "Informe uma data válida"),
  location: z.string().trim().max(255, "Máximo de 255 caracteres"),
  studyGroupId: z
    .string()
    .refine((value) => !value || isValidPositiveId(Number(value)), "Grupo inválido"),
  contentIds: z.array(z.string()).max(50, "Máximo de 50 conteúdos"),
  noteIds: z.array(z.string()).max(50, "Máximo de 50 notas"),
});
export type ExamFormValues = z.infer<typeof examFormSchema>;

export const cycleFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120, "Máximo de 120 caracteres"),
  active: z.boolean(),
  studyGroupId: z.string().min(1, "Selecione um grupo"),
  priority: z.string(),
  contentIds: z.array(z.string()).max(50, "Máximo de 50 conteúdos"),
});
export type CycleFormValues = z.infer<typeof cycleFormSchema>;

export type TreeFormValues = { name: string; description: string };

const treeContentSchema = z.object({
  name: z.string().trim().min(1, "Informe o título").max(200, "Máximo de 200 caracteres"),
  description: z.string().trim().max(2000, "Máximo de 2000 caracteres"),
});

const treeGroupSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(100, "Máximo de 100 caracteres"),
  description: z.string().trim().max(500, "Máximo de 500 caracteres"),
});

const treeNoteSchema = (name: z.ZodString) => z.object({ name, description: z.string() });

const emptyTreeSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export function fileTreeSchema(actionType: string) {
  if (actionType === "create-content" || actionType === "rename-content") return treeContentSchema;
  if (actionType === "create-group" || actionType === "rename-group") return treeGroupSchema;
  if (actionType === "create-note") return treeNoteSchema(noteNameSchema);
  if (actionType === "rename-note") return treeNoteSchema(noteFileNameSchema);
  return emptyTreeSchema;
}

export const noteDraftSchema = z.object({
  markdownContent: z
    .string()
    .min(1, "Escreva o conteúdo da nota")
    .refine(
      (value) => new TextEncoder().encode(value).byteLength <= MAX_NOTE_BYTES,
      "Nota excede o tamanho máximo de 2 MB",
    ),
});
