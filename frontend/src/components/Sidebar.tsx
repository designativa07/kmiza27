'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface NavigationItem {
  name: string
  href: string
  icon: any
  current: boolean
}

interface SidebarProps {
  navigation: NavigationItem[]
  currentPage: string
  setCurrentPage: (page: string) => void
}

export default function Sidebar({ navigation, currentPage, setCurrentPage }: SidebarProps) {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-white" />
          <span className="ml-2 text-white text-lg font-semibold">Kmiza27 Admin</span>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => setCurrentPage(item.name)}
                      className={classNames(
                        currentPage === item.name
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold w-full text-left'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          currentPage === item.name ? 'text-white' : 'text-gray-400 group-hover:text-white',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
            <li className="mt-auto">
              <div className="text-xs leading-6 font-semibold text-gray-400">
                Status do Sistema
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-x-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-400">Backend Online</span>
                </div>
                <div className="flex items-center gap-x-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-400">WhatsApp Conectado</span>
                </div>
                <div className="flex items-center gap-x-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-400">Banco de Dados OK</span>
                </div>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
} 