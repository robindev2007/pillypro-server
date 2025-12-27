
export type IPils = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IPilsFilters = {
  searchTerm?: string;
  page?: number;
  limit?: number;
};
