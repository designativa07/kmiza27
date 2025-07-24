import React from 'react';

/**
 * Renderiza texto com markdown simples
 * Suporta: **texto** para negrito
 */
export function renderMarkdown(text: string): string {
  if (!text) return '';
  
  // Converte **texto** para <strong>texto</strong>
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Componente React para renderizar markdown
 */
export function MarkdownText({ children, className = '' }: { children: string; className?: string }) {
  const html = renderMarkdown(children);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
} 