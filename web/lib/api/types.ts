export interface Page<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MessageResponse {
  message: string;
}

export interface ApiErrorPayload {
  error: string;
  issues?: Record<string, string[]>;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  musicUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  password: string;
  musicUrl?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  cpf: string;
  password: string;
  musicUrl?: string | null;
}

export interface StudyGroup {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyGroupRequest {
  name: string;
  description?: string | null;
}

export interface Content {
  id: number;
  title: string;
  description: string | null;
  studyGroupId: number;
  position: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentRequest {
  title: string;
  description?: string | null;
  studyGroupId: number;
}

export interface ReorderContentsRequest {
  studyGroupId: number;
  ids: number[];
}

export interface Note {
  id: number;
  title: string;
  fileName: string;
  markdownContent: string;
  mimeType: string;
  sizeBytes: number;
  contentId: number;
  position: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  name: string;
  mimeType?: string;
  contentId: number;
}

export interface UpdateNoteRequest {
  title: string;
  fileName: string;
  markdownContent: string;
  mimeType?: string;
  contentId: number;
}

export interface ReorderNotesRequest {
  contentId: number;
  ids: number[];
}

export interface Exam {
  id: number;
  title: string;
  description: string | null;
  examDate: string;
  location: string | null;
  studyGroupId: number | null;
  googleEventId: string | null;
  contentIds: number[];
  noteIds: number[];
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamRequest {
  title: string;
  description?: string | null;
  examDate: string;
  location?: string | null;
  studyGroupId?: number | null;
  contentIds?: number[];
  noteIds?: number[];
}

export type CyclePriority = 1 | 2 | 3;

export const CYCLE_PRIORITIES: { value: CyclePriority; label: string }[] = [
  { value: 1, label: "Alta" },
  { value: 2, label: "Média" },
  { value: 3, label: "Baixa" },
];

export interface StudyCycle {
  id: number;
  name: string;
  active: boolean;
  currentRound: number;
  nextItemOrder: number;
  examId: number;
  studyGroupId: number;
  priority: CyclePriority;
  position: number;
  contentIds: number[];
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyCycleRequest {
  name: string;
  active?: boolean;
  studyGroupId: number;
  priority: CyclePriority;
  contentIds?: number[];
}

export interface UpdateStudyCycleRequest {
  name: string;
  active: boolean;
  studyGroupId: number;
  priority: CyclePriority;
  contentIds?: number[];
}

export interface ReorderStudyCyclesRequest {
  priority: CyclePriority;
  ids: number[];
}
