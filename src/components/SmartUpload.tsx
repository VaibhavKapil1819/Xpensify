import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, FileText, Image as ImageIcon, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SmartUploadProps {
  userId: string;
  onTransactionsExtracted: (transactions: any[]) => void;
}

export default function SmartUpload({ userId, onTransactionsExtracted }: SmartUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    // Validate file type
    const validTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload PDF, PNG, JPG, or text files.');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);
  };

  const uploadAndParse = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      // Call the local parse-transactions API
      const response = await fetch('/api/transactions/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64,
          fileName: file.name,
          fileType: file.type,
          userId
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to parse transactions');

      if (!data?.transactions || data.transactions.length === 0) {
        toast.error('No transactions found in the uploaded file');
        return;
      }

      toast.success(`Found ${data.transactions.length} transaction(s)!`);
      onTransactionsExtracted(data.transactions);
      setFile(null);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-6 h-6" />;
    }
    return <FileText className="w-6 h-6" />;
  };

  return (
    <Card className="glass-card p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Upload className="w-6 h-6 text-accent" />
          Smart Upload
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload receipts, bank statements, or transaction screenshots
        </p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-accent bg-accent/5' : 'border-muted-foreground/20'
          }`}
      >
        {!file ? (
          <>
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">
              Drag & drop a file here, or click to select
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supported: PDF, PNG, JPG, WEBP (max 10MB)
            </p>
            <Label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>Select File</span>
              </Button>
            </Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.xls,.xlsx"
              className="hidden"
            />
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 p-4 bg-accent/5 rounded-lg">
              {getFileIcon(file.type)}
              <div className="flex-1 text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={uploadAndParse}
                disabled={uploading}
                variant="outline"
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Parse Transactions
                  </>
                )}
              </Button>
              {!uploading && (
                <Button
                  onClick={() => setFile(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-600 dark:text-blue-400">
          💡 <strong>Tip:</strong> For best results, upload clear images or PDFs of receipts,
          bank statements, or expense reports. The AI will automatically detect and extract
          transaction details including amounts, dates, categories, and descriptions.
        </p>
      </div>
    </Card>
  );
}


