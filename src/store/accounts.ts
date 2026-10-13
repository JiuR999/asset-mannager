import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Identity, SavedAccount } from '../types'

interface AccountsState {
  accounts: SavedAccount[]
  /** 按名去重插入/更新（新者置顶），用于登录、切换、头像缓存回写 */
  upsert: (account: Omit<SavedAccount, 'savedAt'>) => void
  remove: (name: string) => void
  setAvatar: (name: string, avatar: string | null) => void
}

export const useAccounts = create<AccountsState>()(
  persist(
    (set) => ({
      accounts: [],
      upsert: (account) =>
        set((s) => ({
          accounts: [
            { ...account, savedAt: new Date().toISOString() },
            ...s.accounts.filter((a) => a.name !== account.name),
          ].slice(0, 12),
        })),
      remove: (name) => set((s) => ({ accounts: s.accounts.filter((a) => a.name !== name) })),
      setAvatar: (name, avatar) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.name === name ? { ...a, avatar: avatar ?? undefined } : a,
          ),
        })),
    }),
    { name: 'asset-accounts' },
  ),
)

/** 身份 → 本机账号缓存条目（Shell 中用于统一 upsert） */
export function toSavedAccount(identity: Identity): Omit<SavedAccount, 'savedAt'> {
  return { mode: identity.mode, name: identity.name, token: identity.token }
}
