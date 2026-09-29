import { createContext } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastContextValue {
  toast(message: string, type?: ToastType): void;
  success(message: string): void;
  error(message: string): void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
