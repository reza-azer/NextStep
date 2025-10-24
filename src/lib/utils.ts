import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { addYears, differenceInDays, differenceInMonths, differenceInYears } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateKGB(lastKGBDate: string | Date): { 
  nextKGBDate: Date; 
  daysUntilNextKGB: number;
  monthsUntilNextKGB: number;
  yearsUntilNextKGB: number;
} {
  const lastDate = new Date(lastKGBDate);
  const nextKGBDate = addYears(lastDate, 2);
  const now = new Date();
  const daysUntilNextKGB = differenceInDays(nextKGBDate, now);
  const monthsUntilNextKGB = differenceInMonths(nextKGBDate, now);
  const yearsUntilNextKGB = differenceInYears(nextKGBDate, now);
  return { nextKGBDate, daysUntilNextKGB, monthsUntilNextKGB, yearsUntilNextKGB };
}
