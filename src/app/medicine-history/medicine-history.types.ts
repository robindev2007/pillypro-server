
export type IMedicineHistory = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IMedicineHistoryFilters = {
  searchTerm?: string;
  page?: number;
  limit?: number;
};
