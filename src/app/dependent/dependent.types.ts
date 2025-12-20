
export type IDependent = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IDependentFilters = {
  searchTerm?: string;
  page?: number;
  limit?: number;
};
