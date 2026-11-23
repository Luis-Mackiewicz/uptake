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

export interface LoginResponse {
  token: string;
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
  noteIds?: number[];
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
  noteIds?: number[];
}

export interface Review {
  id: number;
  userId: number;
  noteId: number;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  intervalDays: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  noteId: number;
  nextReviewAt?: string;
  intervalDays?: number;
}

export interface UpdateReviewRequest {
  nextReviewAt?: string;
  intervalDays?: number;
}

export interface StudyCycle {
  id: number;
  name: string;
  active: boolean;
  currentRound: number;
  nextItemOrder: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyCycleRequest {
  name: string;
  active?: boolean;
}

export interface UpdateStudyCycleRequest {
  name: string;
  active: boolean;
}

export interface StudyCycleItem {
  id: number;
  studyCycleId: number;
  studyGroupId: number;
  position: number;
  minutesPerSession: number;
  createdAt: string;
}

export interface CreateCycleItemRequest {
  studyGroupId: number;
  position?: number;
  minutesPerSession?: number;
}

export interface AdvanceCycleResponse {
  cycle: StudyCycle;
  nextItem: StudyCycleItem | null;
}
