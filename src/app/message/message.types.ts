
export type IMessage = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IMessageFilters = {
  searchTerm?: string;
  page?: number;
  limit?: number;
};
