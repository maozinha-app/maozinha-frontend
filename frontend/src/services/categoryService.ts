import type { ElementType } from "react";

import { api } from "./api";
import {
  LuArmchair,
  LuCamera,
  LuLaptop,
  LuPawPrint,
  LuSprayCan,
  LuSprout,
  LuTruck,
  LuWrench,
} from "react-icons/lu";

export interface IServiceCategory {
  id: number;
  name: string;
  icon?: ElementType;
  bgColor?: string;
  iconColor?: string;
}

interface ICategoryResponse {
  id: number;
  name: string;
}

const estilosCategorias: Record<
  number,
  Pick<IServiceCategory, "icon" | "bgColor" | "iconColor">
> = {
  1: {
    icon: LuArmchair,
    bgColor: "#FBE9D5",
    iconColor: "#B8631B",
  },
  2: {
    icon: LuLaptop,
    bgColor: "#E1EBFB",
    iconColor: "#2F5FB3",
  },
  3: {
    icon: LuSprout,
    bgColor: "#DDEEE3",
    iconColor: "#1F7A50",
  },
  4: {
    icon: LuSprayCan,
    bgColor: "#D9F0F2",
    iconColor: "#1F7F8C",
  },
  5: {
    icon: LuWrench,
    bgColor: "#FBE3DD",
    iconColor: "#C2452B",
  },
  6: {
    icon: LuTruck,
    bgColor: "#E9E2F8",
    iconColor: "#6B4DC0",
  },
  7: {
    icon: LuPawPrint,
    bgColor: "#FADDE6",
    iconColor: "#B02C58",
  },
  8: {
    icon: LuCamera,
    bgColor: "#F7EFCB",
    iconColor: "#8A6D0B",
  },
};

export const categoryService = {
  getCategories: async (): Promise<IServiceCategory[]> => {
    const response = await api.get<ICategoryResponse[]>("/categories");

    return response.data.map((categoria) => ({
      ...categoria,
      ...estilosCategorias[categoria.id],
    }));
  },
};
