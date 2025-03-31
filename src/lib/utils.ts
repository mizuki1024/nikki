import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 ✅ クラス名ユーティリティ関数
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
