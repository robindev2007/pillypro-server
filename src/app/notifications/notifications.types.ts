
export type INotifications = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type INotificationsFilters = {
  searchTerm?: string;
  page?: number;
  limit?: number;
};
