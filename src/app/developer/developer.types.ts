
export type IDeveloper = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IDeveloperFilters = {
  searchTerm?: string;
  page?: number;
  limit?: number;
};
