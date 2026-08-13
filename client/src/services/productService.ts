import api from "./api";
import type { Product } from "../types/product";
import type { ApiResponse } from "../types/apiResponse";

export const getProducts = async (): Promise<Product[]> => {
  const res = await api.get<ApiResponse<Product[]>>("/products");
  return res.data.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
  return res.data.data;
};

export const getHeroProduct = async (): Promise<Product> => {
  const res = await api.get<ApiResponse<Product>>("/products/hero");
  return res.data.data;
};