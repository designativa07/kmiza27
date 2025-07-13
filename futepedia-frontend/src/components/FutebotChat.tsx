'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, X, Bot, User } from 'lucide-react'
import { getOrCreateSiteUserId, generateDisplayName } from '../lib/user-utils'

interface Message {
  id: string
  text: string
  isBot: boolean
  timestamp: Date
}

interface FutebotChatProps {
  /** Se true, exibe como widget flutuante. Se false, exibe como página completa */
  isWidget?: boolean
  /** URL da API do backend */
  apiUrl?: string
}

export default function FutebotChat({ 
  isWidget = true, 
  apiUrl = 'http://localhost:3000' 
}: FutebotChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Inicializar ID do usuário
  useEffect(() => {
    const id = getOrCreateSiteUserId()
    setUserId(id)
    setUserName(generateDisplayName(id))
    
    // Adicionar mensagem de boas-vindas
    setMessages([{
      id: 'welcome',
      text: 'Olá! Sou o Futebot 🤖⚽\n\nPosso te ajudar com informações sobre futebol. Digite "oi" para ver as opções ou faça uma pergunta diretamente!',
      isBot: true,
      timestamp: new Date()
    }])
  }, [])

  // Scroll automático para a última mensagem
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      const response = await fetch(`${apiUrl}/chatbot/simulate-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: userId,
          message: userMessage.text,
          origin: 'site'
        }),
      })

      const data = await response.json()

      if (data.success && data.response) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          isBot: true,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error(data.error || 'Erro na resposta do servidor')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '❌ Desculpe, ocorreu um erro. Tente novamente.',
        isBot: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessage = (text: string) => {
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Widget flutuante
  if (isWidget) {
    return (
      <>
        {/* Botão flutuante */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50"
            aria-label="Abrir chat do Futebot"
          >
            <MessageCircle size={24} />
          </button>
        )}

        {/* Chat widget */}
        {isOpen && (
          <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <div>
                  <h3 className="font-semibold">Futebot</h3>
                  <p className="text-xs opacity-90">Chat público • Futepédia</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-blue-700 p-1 rounded"
                aria-label="Fechar chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isBot
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.isBot && <Bot size={16} className="mt-1 flex-shrink-0" />}
                      {!message.isBot && <User size={16} className="mt-1 flex-shrink-0" />}
                      <div className="flex-1">
                        <div className="text-sm">
                          {formatMessage(message.text)}
                        </div>
                        <div className={`text-xs mt-1 ${
                          message.isBot ? 'text-gray-500' : 'text-blue-100'
                        }`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bot size={16} />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Enviar mensagem"
                >
                  <Send size={20} />
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {userName} • Conectado como visitante
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Página completa
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Bot size={32} />
          <div>
            <h1 className="text-2xl font-bold">Futebot</h1>
            <p className="opacity-90">Chat público do Futepédia • Pergunte sobre futebol!</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[70%] p-4 rounded-lg ${
                  message.isBot
                    ? 'bg-white text-gray-800 shadow-sm border border-gray-200'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.isBot && <Bot size={20} className="mt-1 flex-shrink-0" />}
                  {!message.isBot && <User size={20} className="mt-1 flex-shrink-0" />}
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">
                      {message.isBot ? 'Futebot' : userName}
                    </div>
                    <div>
                      {formatMessage(message.text)}
                    </div>
                    <div className={`text-xs mt-2 ${
                      message.isBot ? 'text-gray-500' : 'text-blue-100'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <Bot size={20} />
                  <div>
                    <div className="text-sm font-medium mb-1">Futebot</div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta sobre futebol..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Enviar mensagem"
            >
              <Send size={24} />
            </button>
          </div>
          <div className="text-sm text-gray-500 mt-3">
            {userName} • Conectado como visitante • Chat público
          </div>
        </div>
      </div>
    </div>
  )
} 