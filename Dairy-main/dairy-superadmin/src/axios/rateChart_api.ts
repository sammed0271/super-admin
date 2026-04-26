import { api } from "./axiosInstance";
export const getRateCharts = async (centerId: string) => {
  if (!centerId) throw new Error("centerId required");

  const res = await api.get("/rate-chart", {
    params: { centerId },
  });

  return res.data; // ✅ standardized
};

export const updateRateChart = async (
  milkType: string,
  data: any,
  centerId: string
) => {
  if (!centerId) throw new Error("centerId required");

  const res = await api.put(`/rate-chart/${milkType}`, {
    ...data,
    centerId,
  });

  return res.data;
};
export const getRatePreview = async (params: any) => {
  const res = await api.get("/rate-chart/rate", { params });
  return res.data;
};