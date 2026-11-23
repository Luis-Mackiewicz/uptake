import { MAX_NOTE_SIZE_BYTES } from "../../shared/domain.js";
import { OrderedEntity } from "../../shared/entity.js";
import { ValidationError } from "../../shared/errors.js";
import { assertPositiveInteger } from "../../shared/guards.js";
import type { NoteInput } from "./repository.js";

export class NoteFile extends OrderedEntity {
  #title: string;
  #fileName: string;
  #markdownContent: string;
  #mimeType: string;
  #sizeBytes: number;
  #contentId: number;

  constructor(data: NoteInput) {
    super(data.position ?? 1);
    this.#title = data.title;
    this.#fileName = data.fileName;
    this.#markdownContent = "";
    this.#mimeType = data.mimeType ?? "text/markdown";
    this.#sizeBytes = 0;
    this.#contentId = assertPositiveInteger(data.contentId, "Conteúdo inválido");
    this.markdownContent = data.markdownContent;
  }

  get title(): string {
    return this.#title;
  }

  get fileName(): string {
    return this.#fileName;
  }

  get markdownContent(): string {
    return this.#markdownContent;
  }

  set markdownContent(value: string) {
    const sizeBytes = Buffer.byteLength(value, "utf8");
    if (sizeBytes > MAX_NOTE_SIZE_BYTES) {
      throw new ValidationError("Nota excede o tamanho máximo de 2 MB");
    }
    this.#markdownContent = value;
    this.sizeBytes = sizeBytes;
  }

  get mimeType(): string {
    return this.#mimeType;
  }

  get sizeBytes(): number {
    return this.#sizeBytes;
  }

  private set sizeBytes(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new ValidationError("Tamanho da nota inválido");
    }
    this.#sizeBytes = value;
  }

  get contentId(): number {
    return this.#contentId;
  }

  toInput(): NoteInput {
    return {
      title: this.title,
      fileName: this.fileName,
      markdownContent: this.markdownContent,
      mimeType: this.mimeType,
      sizeBytes: this.sizeBytes,
      contentId: this.contentId,
      position: this.position,
    };
  }
}
