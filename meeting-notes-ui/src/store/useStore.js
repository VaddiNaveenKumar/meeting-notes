import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // ─── Auth Modal ─────────────────────────────────────────────
      isAuthModalOpen: false,
      authModalMode: 'register', // 'login' | 'register'
      openAuthModal: (mode = 'register') => set({ isAuthModalOpen: true, authModalMode: mode }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),

      // ─── User ───────────────────────────────────────────────────
      userEmail: null,
      setUserEmail: (email) => set({ userEmail: email }),
      logout: () => {
        localStorage.removeItem('ms_jwt_token')
        localStorage.removeItem('ms_user_id')
        localStorage.removeItem('ms_user_email')
        set({ userEmail: null })
        window.location.reload()
      },

      // ─── Theme ──────────────────────────────────────────────────
      isDarkMode: false,
      toggleDarkMode: () => {
        const next = !get().isDarkMode
        set({ isDarkMode: next })
        if (next) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      // ─── Command Palette ────────────────────────────────────────
      isCommandPaletteOpen: false,
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),

      // ─── Summary / Streaming State ──────────────────────────────
      isStreaming: false,
      streamDone: false,
      summary: '',
      summaryId: null,
      transcriptId: null,
      setIsStreaming: (v) => set({ isStreaming: v }),
      setStreamDone: (v) => set({ streamDone: v }),
      setSummary: (v) => set({ summary: v }),
      appendSummary: (chunk) => set((state) => ({ summary: state.summary + chunk })),
      setSummaryId: (id) => set({ summaryId: id }),
      setTranscriptId: (id) => set({ transcriptId: id }),
      resetSummary: () => set({ summary: '', summaryId: null, transcriptId: null, isStreaming: false, streamDone: false }),

      // ─── Focus Mode (collapse input panel during generation) ─────
      focusMode: false,
      setFocusMode: (v) => set({ focusMode: v }),
    }),
    {
      name: 'ms-app-store',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        userEmail: state.userEmail,
      }),
    }
  )
)
