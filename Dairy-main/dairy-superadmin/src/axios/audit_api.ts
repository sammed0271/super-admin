import { api } from "./axiosInstance";

export const getAuditLogs = async (params: any) => {
  const res = await api.get("/audit", { params });
  return res.data;
};