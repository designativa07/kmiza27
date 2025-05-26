'use client'

import { useState, useEffect } from 'react'

export function useTheme() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Verificar tema salvo ou preferência do sistema
    const savedTheme = localStorage.getItem('theme')
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    
    console.log('🎨 Tema inicial:', { savedTheme, shouldBeDark })
    
    setIsDark(shouldBeDark)
    applyTheme(shouldBeDark)
  }, [])

  const applyTheme = (dark: boolean) => {
    if (typeof window === 'undefined') return
    
    const html = document.documentElement
    
    console.log('🎨 Aplicando tema:', dark ? 'escuro' : 'claro')
    
    if (dark) {
      html.classList.add('dark')
      html.setAttribute('data-theme', 'dark')
    } else {
      html.classList.remove('dark')
      html.setAttribute('data-theme', 'light')
    }
    
    console.log('📄 Classes HTML:', html.className)
    console.log('📄 Data-theme:', html.getAttribute('data-theme'))
  }

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    console.log('🎨 Alternando para:', newTheme ? 'escuro' : 'claro')
    
    applyTheme(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  return {
    isDark,
    toggleTheme,
    mounted
  }
} 