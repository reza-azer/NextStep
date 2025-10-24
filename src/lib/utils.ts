import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { addYears, differenceInDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateKGB(lastKGBDate: string | Date): { nextKGBDate: Date; daysUntilNextKGB: number } {
  const lastDate = new Date(lastKGBDate);
  const nextKGBDate = addYears(lastDate, 1);
  const daysUntilNextKGB = differenceInDays(nextKGBDate, new Date());
  return { nextKGBDate, daysUntilNextKGB };
}
