'use client';

import { useState, useEffect } from 'react';
import { X, Search, Download, Copy, Trash2 } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

interface ImageItem {
  id: string;
  url: string;
  name: string;
  folder: string;
  uploaded_at: string;
  size: number;
}

interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  folder?: string;
  title?: string;
}

export default function ImageGallery({ isOpen, onClose, onSelect, folder, title = 'Galeria de Imagens' }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(folder || 'all');

  const folders = [
    { value: 'all', label: 'Todas as Pastas' },
    { value: 'competicoes', label: 'Competições' },
    { value: 'escudos', label: 'Escudos' },
    { value: 'jogadores', label: 'Jogadores' },
    { value: 'estadios', label: 'Estádios' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, selectedFolder]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedFolder !== 'all') {
        params.append('folder', selectedFolder);
      }

      const response = await fetch(`/api/system-settings/gallery?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (imageUrl: string) => {
    onSelect(imageUrl);
    onClose();
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // Você pode adicionar um toast aqui
    } catch (error) {
      console.error('Erro ao copiar URL:', error);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/system-settings/gallery/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId));
      }
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
    }
  };

  const filteredImages = images.filter(image =>
    image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.folder.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Selecione uma imagem para usar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Fechar galeria"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar imagens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                aria-label="Filtrar por pasta"
              >
                {folders.map(folder => (
                  <option key={folder.value} value={folder.value}>
                    {folder.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Carregando imagens...</span>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma imagem encontrada
              </h3>
              <p className="text-gray-600">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Faça upload de imagens para começar.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => handleSelect(image.url)}
                >
                  <div className="aspect-square mb-2">
                    <ImageWithFallback
                      src={image.url}
                      alt={image.name}
                      fallbackType="team"
                      size="md"
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  
                  <div className="text-xs text-gray-600 truncate mb-1">
                    {image.name}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {image.folder}
                  </div>

                  {/* Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyUrl(image.url);
                        }}
                        className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                        title="Copiar URL"
                      >
                        <Copy className="h-3 w-3 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image.id);
                        }}
                        className="p-1 bg-white rounded shadow-sm hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {filteredImages.length} imagem{filteredImages.length !== 1 ? 'ns' : ''} encontrada{filteredImages.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 