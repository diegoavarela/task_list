import { useState, useRef } from 'react';
import { Upload, File, X, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

interface FileAttachmentsProps {
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  disabled?: boolean;
}

export function FileAttachments({
  attachments,
  onAttachmentsChange,
  maxFileSize = 10, // 10MB default
  allowedTypes = ['image/*', 'application/pdf', 'text/*', '.doc', '.docx', '.xls', '.xlsx'],
  disabled = false
}: FileAttachmentsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    const isAllowed = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type);
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = async (files: FileList) => {
    if (disabled) return;

    setUploading(true);
    const newAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);
      
      if (validation) {
        toast({
          title: "File upload error",
          description: `${file.name}: ${validation}`,
          variant: "destructive"
        });
        continue;
      }

      try {
        // In a real app, you would upload to a file storage service
        // For now, we'll create a local URL and simulate the upload
        const url = URL.createObjectURL(file);
        
        const attachment: FileAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: url,
          uploadedAt: new Date()
        };

        newAttachments.push(attachment);
      } catch (error) {
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
      toast({
        title: "Files uploaded",
        description: `${newAttachments.length} file(s) uploaded successfully`
      });
    }

    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    if (disabled) return;
    
    const updatedAttachments = attachments.filter(att => att.id !== id);
    onAttachmentsChange(updatedAttachments);
    
    // Revoke object URL to free memory
    const attachment = attachments.find(att => att.id === id);
    if (attachment && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
  };

  const downloadAttachment = (attachment: FileAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewAttachment = (attachment: FileAttachment) => {
    if (attachment.type.startsWith('image/')) {
      window.open(attachment.url, '_blank');
    } else {
      downloadAttachment(attachment);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    if (type.startsWith('text/')) return '📃';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : disabled 
              ? 'border-muted bg-muted/20 cursor-not-allowed' 
              : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="p-6 text-center">
          <Upload className={`mx-auto h-8 w-8 mb-2 ${disabled ? 'text-muted-foreground' : 'text-muted-foreground'}`} />
          <p className={`text-sm ${disabled ? 'text-muted-foreground' : 'text-foreground'}`}>
            {uploading ? 'Uploading...' : disabled ? 'File uploads disabled' : 'Click to upload or drag and drop files'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max {maxFileSize}MB • {allowedTypes.join(', ')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attachments ({attachments.length})</h4>
          <div className="grid gap-2">
            {attachments.map((attachment) => (
              <Card key={attachment.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-lg">{getFileIcon(attachment.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => previewAttachment(attachment)}
                      className="h-8 w-8 p-0"
                    >
                      {attachment.type.startsWith('image/') ? <Eye className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                    </Button>
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(attachment.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}