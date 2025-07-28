'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Crop, RotateCw, Download } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUpload: (imageUrl: string) => void;
  onImageRemove: () => void;
  folder: string;
  entityName: string;
  label?: string;
  maxSize?: number; // em MB
  allowedTypes?: string[];
  aspectRatio?: number; // para crop
  showGallery?: boolean;
  onGalleryOpen?: () => void;
}

const DEFAULT_MAX_SIZE = 5; // 5MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DEFAULT_ASPECT_RATIO = 1; // quadrado

export default function ImageUpload({
  currentImageUrl,
  onImageUpload,
  onImageRemove,
  folder,
  entityName,
  label = 'Upload de Imagem',
  maxSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  aspectRatio = DEFAULT_ASPECT_RATIO,
  showGallery = true,
  onGalleryOpen
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [showCrop, setShowCrop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log dos props para debug
  console.log('ImageUpload props:', {
    currentImageUrl,
    folder,
    entityName,
    label,
    onImageUpload: typeof onImageUpload,
    onImageRemove: typeof onImageRemove
  });

  const validateFile = (file: File): Promise<string | null> => {
    // Verificar tipo
    if (!allowedTypes.includes(file.type)) {
      return Promise.resolve(`Tipo de arquivo não suportado. Tipos aceitos: ${allowedTypes.join(', ')}`);
    }

    // Verificar tamanho
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return Promise.resolve(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
    }

    // Verificar dimensões mínimas
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 100 || img.height < 100) {
          resolve('Imagem muito pequena. Dimensões mínimas: 100x100 pixels');
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve('Erro ao carregar imagem');
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsUploading(true);

    try {
      // Validar arquivo
      const validationError = await validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Criar preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Fazer upload direto, independente do aspectRatio
      await uploadFile(file);
    } catch (error) {
      setError('Erro ao processar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setError('');
      console.log('Iniciando upload do arquivo:', file.name);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('entityName', entityName);

      console.log('FormData preparado:', {
        folder,
        entityName,
        fileSize: file.size,
        fileType: file.type
      });

      const token = localStorage.getItem('token');
      console.log('Token presente:', !!token);
      
      const response = await fetch('/api/system-settings/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Upload response data:', data);
        
        const imageUrl = data.cloudUrl || data.url;
        console.log('Image URL to be set:', imageUrl);
        
        onImageUpload(imageUrl);
        setPreviewUrl(null);
        setShowCrop(false);
      } else {
        const errorData = await response.json();
        console.error('Upload error:', errorData);
        setError(errorData.message || 'Erro no upload');
      }
    } catch (error) {
      console.error('Upload exception:', error);
      setError('Erro de conexão');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCrop = async () => {
    // Aqui você pode implementar a lógica de crop
    // Por enquanto, vamos fazer upload direto
    if (fileInputRef.current?.files?.[0]) {
      await uploadFile(fileInputRef.current.files[0]);
    }
  };

  const handleRemove = () => {
    onImageRemove();
    setPreviewUrl(null);
    setShowCrop(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Preview da imagem atual */}
      {currentImageUrl && !previewUrl && (
        <div className="relative inline-block">
          <ImageWithFallback
            src={currentImageUrl}
            alt={entityName}
            fallbackType="team"
            size="md"
            className="w-32 h-32 object-cover rounded-lg"
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Remover imagem"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Preview da nova imagem */}
      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg"
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Cancelar upload"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Área de upload */}
      {!currentImageUrl && !previewUrl && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
            aria-label="Upload de imagem"
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-gray-100 rounded-full">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Clique para selecionar uma imagem ou arraste aqui
              </p>
              <p className="text-xs text-gray-500">
                Formatos: {allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} | 
                Máximo: {maxSize}MB | 
                Mínimo: 100x100px
              </p>
            </div>

            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Enviando...' : 'Selecionar Arquivo'}
              </button>
              
              {showGallery && onGalleryOpen && (
                <button
                  type="button"
                  onClick={onGalleryOpen}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Galeria
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controles de crop */}
      {showCrop && previewUrl && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">Ajustar Imagem</h4>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleCrop}
                disabled={isUploading}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isUploading ? 'Processando...' : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            <p>• Arraste para reposicionar</p>
            <p>• Use as alças para redimensionar</p>
            <p>• Mantenha a proporção quadrada</p>
          </div>
        </div>
      )}
    </div>
  );
} 