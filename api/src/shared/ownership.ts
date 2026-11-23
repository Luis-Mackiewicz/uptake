export interface OwnedRecord {
  id: number;
  userId: number;
}

export interface EntityLookup<T> {
  findById(id: number, userId: number): Promise<T | null>;
}

export interface StudyGroupLookup {
  findById(
    id: number,
    userId: number,
  ): Promise<{ id: number; name: string } | null>;
}

export interface ContentLookup {
  findById(
    id: number,
    userId: number,
  ): Promise<{ id: number; title: string } | null>;
}

export interface NoteLookup {
  findById(
    id: number,
    userId: number,
  ): Promise<{ id: number; title: string } | null>;
}
