// src/types.ts
export type FileNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
};

export type SearchResult = {
  path: string;
  name: string;
  line: number;
  text: string;
};