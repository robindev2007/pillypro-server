
export type IDose = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IDoseFilters = {
  searchTerm?: string;
  page?: number;
  limit?: number;
};
