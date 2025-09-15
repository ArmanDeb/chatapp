'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  Music, 
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { uploadFile, formatFileSize, getFileCategory } from '@/lib/actions/files'
import { UploadedFile } from '@/lib/types/app'

interface FileUploadProps {
  teamId: string
  onUploadComplete?: (file: UploadedFile) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  acceptedFileTypes?: Record<string, string[]>
  maxFileSize?: number // in bytes
  className?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
  uploadedFile?: UploadedFile
}

export function FileUpload({
  teamId,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  acceptedFileTypes = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.webm', '.ogg'],
    'audio/*': ['.mp3', '.wav', '.ogg'],
    'application/pdf': ['.pdf'],
    'text/*': ['.txt', '.md'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  maxFileSize = 10 * 1024 * 1024, // 10MB
  className = ''
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const filesToUpload = acceptedFiles.slice(0, maxFiles)
    
    // Initialize uploading files state
    const initialUploadingFiles = filesToUpload.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }))
    
    setUploadingFiles(prev => [...prev, ...initialUploadingFiles])

    // Upload files one by one
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]
      const fileIndex = uploadingFiles.length + i

      try {
        // Simulate progress (since we can't track real upload progress with server actions)
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => 
            prev.map((uploadingFile, index) => 
              index === fileIndex && uploadingFile.progress < 90
                ? { ...uploadingFile, progress: uploadingFile.progress + 10 }
                : uploadingFile
            )
          )
        }, 200)

        const result = await uploadFile(file, teamId)
        
        clearInterval(progressInterval)

        if (result.error) {
          setUploadingFiles(prev => 
            prev.map((uploadingFile, index) => 
              index === fileIndex
                ? { 
                    ...uploadingFile, 
                    status: 'error',
                    error: result.error,
                    progress: 100
                  }
                : uploadingFile
            )
          )
          onUploadError?.(result.error)
        } else {
          setUploadingFiles(prev => 
            prev.map((uploadingFile, index) => 
              index === fileIndex
                ? { 
                    ...uploadingFile, 
                    status: 'completed',
                    progress: 100,
                    uploadedFile: result.data
                  }
                : uploadingFile
            )
          )
          onUploadComplete?.(result.data!)
        }
      } catch (error) {
        setUploadingFiles(prev => 
          prev.map((uploadingFile, index) => 
            index === fileIndex
              ? { 
                  ...uploadingFile, 
                  status: 'error',
                  error: 'Upload failed',
                  progress: 100
                }
              : uploadingFile
          )
        )
        onUploadError?.('Upload failed')
      }
    }
  }, [teamId, maxFiles, onUploadComplete, onUploadError, uploadingFiles.length])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    maxFiles,
    multiple: true
  })

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    const category = getFileCategory(file.type)
    switch (category) {
      case 'image': return <Image className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Music className="h-4 w-4" />
      default: return <File className="h-4 w-4" />
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            
            {isDragActive ? (
              <p className="text-lg font-medium text-blue-600">
                Drop files here to upload
              </p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Maximum {maxFiles} files, up to {formatFileSize(maxFileSize)} each
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File rejections */}
      {fileRejections.length > 0 && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Some files were rejected:</span>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {fileRejections.map(({ file, errors }) => (
                <li key={file.name}>
                  <strong>{file.name}</strong>: {errors.map(e => e.message).join(', ')}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Uploading files */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Uploading files</h3>
            <div className="space-y-3">
              {uploadingFiles.map((uploadingFile, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getFileIcon(uploadingFile.file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {uploadingFile.file.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(uploadingFile.file.size)}
                        </span>
                        {uploadingFile.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {uploadingFile.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUploadingFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <Progress value={uploadingFile.progress} className="h-2" />
                    
                    {uploadingFile.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1">
                        {uploadingFile.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
