export const getDateTimeFromServiceTime = (time: string) => {
  return new Date(`1970-01-01T${time}:00Z`);
};

export const getServiceTimeFromDate = (date: string | Date) => {
  return new Date(date).toISOString().slice(11, 16);
};
