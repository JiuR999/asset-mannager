import { create } from 'zustand'

export interface Toast {
  id: number
  msg: string
  type: 'info' | 'error'
}

interface ToastState {
  toasts: Toast[]
  push: (msg: string, type?: Toast['type']) => void
  remove: (id: number) => void
}

let nextId = 1

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (msg, type = 'info') => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, msg, type }] }))
    setTimeout(() => get().remove(id), 3000)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = (msg: string, type: Toast['type'] = 'info') =>
  useToasts.getState().push(msg, type)
