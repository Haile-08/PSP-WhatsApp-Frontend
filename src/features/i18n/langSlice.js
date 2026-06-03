import { createSlice } from '@reduxjs/toolkit'

const STORAGE_KEY = 'lang'
/* Spanish is the product default; a previously chosen language is restored. */
const stored = localStorage.getItem(STORAGE_KEY)
const initialLang = stored === 'en' || stored === 'es' ? stored : 'es'

const langSlice = createSlice({
  name: 'lang',
  initialState: { lang: initialLang },
  reducers: {
    setLanguage: (state, action) => {
      state.lang = action.payload
      localStorage.setItem(STORAGE_KEY, action.payload)
    },
    toggleLanguage: (state) => {
      state.lang = state.lang === 'es' ? 'en' : 'es'
      localStorage.setItem(STORAGE_KEY, state.lang)
    },
  },
})

export const { setLanguage, toggleLanguage } = langSlice.actions
export default langSlice.reducer

export const selectLang = (state) => state.lang.lang
