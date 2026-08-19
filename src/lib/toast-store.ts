"use client";

// Minimal framework-free pub/sub so deeply nested client components (inside
// server-rendered pages) can trigger a toast without prop-drilling a handler
// down from the layout. Consumed via useSyncExternalStore in <Toaster/>.

export type ToastVariant = "success" | "error" | "info";
export type Toast = { id: number; message: string; variant: ToastVariant };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function toast(message: string, variant: ToastVariant = "success") {
  const id = nextId++;
  toasts = [...toasts, { id, message, variant }];
  emit();
  setTimeout(() => dismissToast(id), 3200);
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function subscribeToasts(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getToasts() {
  return toasts;
}
