import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utilitários para formatação e validação de dados
 */

/**
 * Formata um valor monetário de forma segura
 * @param value - Valor a ser formatado
 * @param fallback - Valor padrão caso o valor seja null/undefined
 * @returns String formatada ou fallback
 */
export function formatCurrency(value: number | null | undefined, fallback: string = 'N/A'): string {
  if (value == null || isNaN(value)) {
    return fallback;
  }
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

/**
 * Formata um valor numérico de forma segura
 * @param value - Valor a ser formatado
 * @param fallback - Valor padrão caso o valor seja null/undefined
 * @returns String formatada ou fallback
 */
export function formatNumber(value: number | null | undefined, fallback: string = 'N/A'): string {
  if (value == null || isNaN(value)) {
    return fallback;
  }
  return value.toLocaleString('pt-BR');
}

/**
 * Verifica se um valor é válido para operações numéricas
 * @param value - Valor a ser verificado
 * @returns true se o valor for válido
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}
