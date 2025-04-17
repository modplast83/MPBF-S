import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as formatDate } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(number: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

export function formatDateString(date: string | Date): string {
  if (!date) return "";
  return formatDate(new Date(date), "dd-MMM-yyyy");
}

export function formatDateTime(date: string | Date): string {
  if (!date) return "";
  return formatDate(new Date(date), "dd-MMM-yyyy HH:mm");
}

export function getInitials(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function calculateProgress(current: number, total: number): number {
  if (!current || !total || total === 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}

export function getStageColorClass(stage: string): string {
  switch (stage) {
    case "extrusion":
      return "bg-blue-500";
    case "printing":
      return "bg-yellow-500";
    case "cutting":
      return "bg-green-500";
    case "completed":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
}

export function getStatusColorClass(status: string): {
  bgColor: string;
  textColor: string;
  borderColor: string;
} {
  switch (status) {
    case "pending":
      return {
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-700",
        borderColor: "border-yellow-200",
      };
    case "processing":
      return {
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
      };
    case "completed":
      return {
        bgColor: "bg-green-100",
        textColor: "text-green-700",
        borderColor: "border-green-200",
      };
    case "cancelled":
      return {
        bgColor: "bg-red-100",
        textColor: "text-red-700",
        borderColor: "border-red-200",
      };
    default:
      return {
        bgColor: "bg-gray-100",
        textColor: "text-gray-700",
        borderColor: "border-gray-200",
      };
  }
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 10);
}
