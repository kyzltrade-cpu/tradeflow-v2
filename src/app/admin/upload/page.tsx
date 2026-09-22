'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/lang';

// ─── Types ───────────────────────────────────────────────────

type Step = 'choose' | 'upload' | 'classify' | 'review' | 'done';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  extractedCount?: number;
  category?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'product_spec', en: 'Product Specs', zh: '产品规格', icon: '📦', desc: 'Dimensions, materials, certifications, photos' },
  { value: 'supplier_info', en: 'Supplier Info', zh: '供应商信息', icon: '🏭', desc: 'Price lists, MOQs, lead times, contacts' },
  { value: 'pricing', en: 'Pricing & Margins', zh: '定价与利润', icon: '💰', desc: 'Cost sheets, margin rules, volume breaks' },
  { value: 'terms_conditions', en: 'Terms & Conditions', zh: '条款', icon: '📋', desc: 'Payment terms, warranty, return policies' },
  { value: 'faq', en: 'FAQ / Templates', zh: '常见问题', icon: '💬', desc: 'Canned responses, objection handling' },
  { value: 'certifications', en: 'Certifications', zh: '认证', icon: '✅', desc: 'ISO, CE, FDA, test reports' },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// ─── Helpers ─────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string): string {
  if (type.includes('pdf')) return '📄';
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return '📊';
  if (type.includes('image')) return '🖼️';
  if (type.includes('word') || type.includes('document')) return '📝';
  return '📎';
}

// ─── Page ────────────────────────────────────────────────────

export default function UploadWizardPage() {
  const { t } = useLang();
  const router = useRouter();

  const [step, setStep] = useState<Step>('choose');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Add files
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const valid = arr.filter((f) => {
      if (f.size > MAX_FILE_SIZE) return false;
      if (!ACCEPTED_TYPES.some((t) => f.type === t || f.name.endsWith('.csv'))) return false;
      return true;
    });

    const mapped: UploadedFile[] = valid.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      status: 'pending',
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...mapped]);
    if (step === 'choose') setStep('upload');
  }, [step]);

  // Remove file
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Simulate processing
  const processFiles = async () => {
    setProcessing(true);
    setStep('review');

    for (const file of files) {
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' as const, progress: 0 } : f))
      );

      // Simulate progress
      for (let p = 0; p <= 100; p += 20) {
        await new Promise((r) => setTimeout(r, 300));
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress: p } : f))
        );
      }

      const extractedCount = Math.floor(Math.random() * 15) + 3;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, status: 'done', progress: 100, extractedCount, category: f.category || 'general' }
            : f
        )
      );
    }

    setProcessing(false);
    setStep('done');
  };

  // Set category for a file
  const setCategory = (id: string, category: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, category } : f)));
  };

  const pendingFiles = files.filter((f) => f.status === 'pending');
  const doneFiles = files.filter((f) => f.status === 'done');
  const totalExtracted = doneFiles.reduce((sum, f) => sum + (f.extractedCount || 0), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[20px] md:text-[24px] font-semibold tracking-[-0.5px]">Upload to Company Brain</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Upload documents, price lists, and specs. The AI will extract and index everything.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[
          { key: 'choose', label: 'Select Files' },
          { key: 'upload', label: 'Review' },
          { key: 'review', label: 'Processing' },
          { key: 'done', label: 'Complete' },
        ].map((s, i) => {
          const stepOrder: Step[] = ['choose', 'upload', 'classify', 'review', 'done'];
          const currentIdx = stepOrder.indexOf(step);
          const sIdx = stepOrder.indexOf(s.key as Step);
          const isActive = s.key === step || (s.key === 'upload' && step === 'classify');
          const isDone = sIdx < currentIdx && s.key !== 'classify';

          return (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{
                  background: isDone ? '#0A6E5C' : isActive ? 'var(--accent)' : 'var(--border)',
                  color: isDone || isActive ? '#fff' : 'var(--text-muted)',
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span className={`text-[12px] font-medium ${isActive ? '' : 'hidden sm:inline'}`} style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }}>
                {s.label}
              </span>
              {i < 3 && <div className="flex-1 h-px mx-2" style={{ background: 'var(--border)' }} />}
            </div>
          );
        })}
      </div>

      {/* Step: Choose / Upload */}
      {(step === 'choose' || step === 'upload') && (
        <div className="space-y-4">
          {/* Drop zone */}
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            className="flex flex-col items-center justify-center gap-3 rounded-[4px] border-2 border-dashed p-10 cursor-pointer transition-colors"
            style={{
              borderColor: dragOver ? 'var(--accent)' : 'var(--border)',
              background: dragOver ? 'var(--surface)' : 'transparent',
            }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
              <svg className="w-6 h-6" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Drop files here or click to browse</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                PDF, Excel, CSV, Word, Images — up to 20MB each
              </p>
            </div>
            <input
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </label>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold">{files.length} file{files.length !== 1 ? 's' : ''} selected</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setFiles([]); setStep('choose'); }} className="text-[12px] px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    Clear All
                  </button>
                  <button onClick={() => setStep('classify')} className="text-[12px] px-4 py-1.5 rounded-lg font-semibold text-white" style={{ background: 'var(--accent)' }}>
                    Classify Files →
                  </button>
                </div>
              </div>

              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 rounded-[4px] border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <span className="text-[20px]">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{file.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatSize(file.size)}</p>
                  </div>
                  <button onClick={() => removeFile(file.id)} className="text-[12px] px-2 py-1 rounded hover:bg-red-50" style={{ color: 'var(--danger)' }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Classify */}
      {step === 'classify' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Classify each file</h3>
            <button onClick={processFiles} className="text-[12px] px-4 py-1.5 rounded-lg font-semibold text-white" style={{ background: 'var(--accent)' }}>
              Process {files.length} Files →
            </button>
          </div>

          {files.map((file) => (
            <div key={file.id} className="p-4 rounded-[4px] border space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-3">
                <span className="text-[20px]">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{file.name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatSize(file.size)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(file.id, cat.value)}
                    className="flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all"
                    style={{
                      borderColor: file.category === cat.value ? 'var(--accent)' : 'var(--border)',
                      background: file.category === cat.value ? 'var(--accent)10' : 'var(--bg)',
                    }}
                  >
                    <span className="text-[16px]">{cat.icon}</span>
                    <div>
                      <p className="text-[11px] font-semibold" style={{ color: file.category === cat.value ? 'var(--accent)' : 'var(--text)' }}>{cat.en}</p>
                      <p className="text-[10px] hidden sm:block" style={{ color: 'var(--text-muted)' }}>{cat.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step: Processing */}
      {step === 'review' && processing && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-[4px] border" style={{ borderColor: 'var(--accent)', background: 'var(--surface)' }}>
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            <span className="text-[13px] font-medium">Processing files and extracting content...</span>
          </div>

          {files.map((file) => (
            <div key={file.id} className="p-4 rounded-[4px] border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[16px]">{getFileIcon(file.type)}</span>
                <span className="text-[13px] font-medium flex-1">{file.name}</span>
                <span className="text-[12px]" style={{ color: file.status === 'done' ? 'var(--success)' : 'var(--text-muted)' }}>
                  {file.status === 'done' ? `✓ ${file.extractedCount} items extracted` : file.status === 'processing' ? 'Processing...' : 'Pending'}
                </span>
              </div>
              {file.status === 'processing' && (
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${file.progress}%`, background: 'var(--accent)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#ECFDF5' }}>
              <svg className="w-8 h-8" style={{ color: '#038153' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-[18px] font-semibold">Brain Updated</h2>
            <p className="text-[13px] text-center max-w-md" style={{ color: 'var(--text-muted)' }}>
              Extracted <span className="font-semibold" style={{ color: 'var(--accent)' }}>{totalExtracted}</span> knowledge items from{' '}
              <span className="font-semibold">{doneFiles.length}</span> file{doneFiles.length !== 1 ? 's' : ''}.
            </p>
          </div>

          {/* Results */}
          <div className="rounded-[4px] border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <h3 className="text-[13px] font-semibold">Extraction Results</h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {doneFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-[16px]">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{file.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {file.extractedCount} items · {CATEGORY_OPTIONS.find((c) => c.value === file.category)?.en || 'General'}
                    </p>
                  </div>
                  <span className="text-[12px] font-medium" style={{ color: 'var(--success)' }}>✓ Indexed</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setFiles([]); setStep('choose'); }} className="px-4 py-2 rounded-lg text-[13px] font-semibold border" style={{ borderColor: 'var(--border)' }}>
              Upload More
            </button>
            <button onClick={() => router.push('/admin/knowledge')} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: 'var(--accent)' }}>
              View Knowledge Base →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
