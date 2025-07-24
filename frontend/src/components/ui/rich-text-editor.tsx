import React, { useRef, useState } from 'react'
import { BoldIcon } from '@heroicons/react/24/outline'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Digite seu texto aqui...", 
  rows = 4,
  className = ""
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectionStart, setSelectionStart] = useState(0)
  const [selectionEnd, setSelectionEnd] = useState(0)

  const handleTextareaSelect = () => {
    if (textareaRef.current) {
      setSelectionStart(textareaRef.current.selectionStart)
      setSelectionEnd(textareaRef.current.selectionEnd)
    }
  }

  const handleBoldClick = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      
      if (start === end) {
        // Nenhum texto selecionado, inserir **
        const newValue = value.slice(0, start) + '**texto**' + value.slice(end)
        onChange(newValue)
        
        // Posicionar cursor após o primeiro **
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + 2, start + 8)
        }, 0)
      } else {
        // Texto selecionado, envolver com **
        const selectedText = value.slice(start, end)
        const newValue = value.slice(0, start) + `**${selectedText}**` + value.slice(end)
        onChange(newValue)
        
        // Manter seleção do texto original
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start, start + selectedText.length + 4)
        }, 0)
      }
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={handleBoldClick}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded border border-gray-200"
            title="Negrito (Ctrl+B)"
          >
            <BoldIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500">
          Use **texto** para negrito
        </div>
      </div>
      
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleTextareaSelect}
        placeholder={placeholder}
        rows={rows}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm resize-none"
      />
    </div>
  )
} 