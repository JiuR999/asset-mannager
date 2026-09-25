import { create } from 'zustand'

interface UiState {
  assetFormOpen: boolean
  editingId: string | null
  openForm: (id?: string | null) => void
  closeForm: () => void
}

export const useUi = create<UiState>((set) => ({
  assetFormOpen: false,
  editingId: null,
  openForm: (id = null) => set({ assetFormOpen: true, editingId: id }),
  closeForm: () => set({ assetFormOpen: false, editingId: null }),
}))
