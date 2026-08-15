import { useSyncExternalStore } from "react";
import type { Product } from "../types/product";

const STORAGE_KEY = "lapora-ai-recommendations";

export type AiRecommendedProduct = Product & {
  recommendation?: {
    label?: string;
    priceStatus?: string;
    reasons?: string[];
    considerations?: string[];
  };
};

function loadRecommendations(): AiRecommendedProduct[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);

    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

let recommendations: AiRecommendedProduct[] = loadRecommendations();

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function setAiRecommendations(products: AiRecommendedProduct[]) {
  recommendations = products;

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(products));

  emitChange();
}

export function clearAiRecommendations() {
  recommendations = [];

  sessionStorage.removeItem(STORAGE_KEY);

  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return recommendations;
}

export function useAiRecommendations() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}