export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: Date;
}

export interface TagInput {
  name: string;
  color: string;
  description?: string;
}