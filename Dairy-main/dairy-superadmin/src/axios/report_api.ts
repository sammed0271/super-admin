import { api } from "./axiosInstance";

export const getDailyReport = (centerId: string, date: string) =>
  api.get(`/reports/daily?centerId=${centerId}&date=${date}`);


export const getMonthlyReport = (centerId: string) =>
  api.get(`/reports/monthly?centerId=${centerId}`);