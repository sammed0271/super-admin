import { api } from "./axiosInstance";

// GET ALL CENTERS
export const getCenters = async () => {
  const res = await api.get("/centers");
  return res.data;
};

// CREATE CENTER
export const createCenter = async (data: any) => {
  const res = await api.post("/centers", data);
  return res.data;
};

// GET CENTER DETAILS
export const getCenterById = async (id: string) => {
  const res = await api.get(`/centers/${id}`);
  return res.data;
};

// UPDATE CENTER
export const updateCenter = async (id: string, data: any) => {
  const res = await api.put(`/centers/${id}`, data);
  return res.data;
};

// TOGGLE STATUS
export const toggleCenter = async (id: string) => {
  const res = await api.patch(`/centers/${id}/toggle`);
  return res.data;
};