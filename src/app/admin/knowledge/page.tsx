'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@/lib/lang';
import { useDemo } from '@/lib/demo-store';

// ─── Types ───────────────────────────────────────────────────

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  source_type: string;
  category: string;
  tags: string[];
  created_at: string;
}

interface FaqRule {
  id: string;
  keywords: string[];
  response_template: string;
  category: string;
  priority: number;
  is_active: boolean;
  language: string;
}

interface BrainStats {
  totalDocs: number;
  totalFaq: number;
  categories: Record<string, number>;
}

// ─── Category Config ─────────────────────────────────────────

const CATEGORIES = [
  { value: 'general', en: 'General', zh: '一般', color: '#6B7280' },
  { value: 'product_spec', en: 'Product Specs', zh: '产品规格', color: '#3B82F6' },
  { value: 'supplier_info', en: 'Supplier Info', zh: '供应商信息', color: '#10B981' },
  { value: 'pricing', en: 'Pricing', zh: '定价', color: '#F59E0B' },
  { value: 'certifications', en: 'Certifications', zh: '认证', color: '#8B5CF6' },
  { value: 'terms_conditions', en: 'Terms & Conditions', zh: '条款', color: '#EF4444' },
  { value: 'faq', en: 'FAQ', zh: '常见问题', color: '#06B6D4' },
  { value: 'process', en: 'Processes', zh: '流程', color: '#EC4899' }
];

// ─── Page ────────────────────────────────────────────────────

export default function KnowledgePage() {
  const { t } = useLang();
  const { tenant } = useDemo();

  const [activeTab, setActiveTab] = useState<'documents' | 'faq' | 'brain'>('documents');
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [faqRules, setFaqRules] = useState<FaqRule[]>([]);
  const [stats, setStats] = useState<BrainStats>({ totalDocs: 0, totalFaq: 0, categories: {} });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('general');
  const [uploadContent, setUploadContent] = useState('');
  const [uploading, setUploading] = useState(false);

  // FAQ state
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [faqKeywords, setFaqKeywords] = useState('');
  const [faqResponse, setFaqResponse] = useState('');
  const [faqCategory, setFaqCategory] = useState('general');

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = tenant?.id || '';
      const [docsRes, faqRes] = await Promise.all([
        fetch(`/api/knowledge?action=search&companyId=${companyId}`),
        fetch(`/api/knowledge?action=search&companyId=${companyId}&category=faq`)
      ]);

      const docsData = await docsRes.json();
      const faqData = await faqRes.json();

      setDocuments(docsData.documents || []);
      // FAQ rules are separate from knowledge docs
      // For now, use mock data
      setFaqRules([]);

      // Calculate stats
      const cats: Record<string, number> = {};
      (docsData.documents || []).forEach((doc: KnowledgeDoc) => {
        cats[doc.category] = (cats[doc.category] || 0) + 1;
      });
      setStats({
        totalDocs: (docsData.documents || []).length,
        totalFaq: 0,
        categories: cats
      });
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Upload handler
  const handleUpload = async () => {
    if (!uploadFile && !uploadContent) return;
    setUploading(true);
    try {
      const companyId = tenant?.id || '';
      let content = uploadContent;
      let title = uploadTitle || uploadFile?.name || 'Untitled';

      if (uploadFile && !uploadContent) {
        content = await uploadFile.text();
      }

      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          action: 'upload-document',
          title,
          content,
          sourceType: uploadFile ? 'file_upload' : 'manual_entry',
          category: uploadCategory,
          fileName: uploadFile?.name,
          fileType: uploadFile?.type,
          tags: []
        })
      });

      setShowUpload(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadContent('');
      loadData();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  // FAQ handler
  const handleCreateFaq = async () => {
    if (!faqKeywords || !faqResponse) return;
    try {
      const companyId = tenant?.id || '';
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          action: 'create-faq',
          keywords: faqKeywords.split(',').map(k => k.trim()),
          responseTemplate: faqResponse,
          category: faqCategory,
          priority: 0,
          language: 'en'
        })
      });
      setShowFaqForm(false);
      setFaqKeywords('');
      setFaqResponse('');
      loadData();
    } catch (err) {
      console.error('FAQ creation failed:', err);
    }
  };

  // Delete handler
  const handleDelete = async (type: 'document' | 'faq', id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      const companyId = tenant?.id || '';
      await fetch(`/api/knowledge?action=${type}&id=${id}&companyId=${companyId}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
            {t('Company Brain', '公司大脑')}
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {t(
              'Your knowledge base — products, suppliers, certifications, pricing rules. The more you add, the smarter TradeFlow gets.',
              '您的知识库——产品、供应商、认证、定价规则。添加越多，TradeFlow越智能。'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="rounded-[4px] px-4 py-2 text-[13px] font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            + {t('Add Document', '添加文档')}
          </button>
          <button
            onClick={() => setShowFaqForm(true)}
            className="rounded-[4px] border px-4 py-2 text-[13px] font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            + {t('Add FAQ Rule', '添加FAQ规则')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label={t('Documents', '文档')} value={stats.totalDocs} color="var(--accent)" />
        <StatCard label={t('FAQ Rules', 'FAQ规则')} value={stats.totalFaq} color="#10B981" />
        <StatCard label={t('Categories', '分类')} value={Object.keys(stats.categories).length} color="#F59E0B" />
        <StatCard label={t('Brain Status', '大脑状态')} value="Active" color="#8B5CF6" isText />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-[4px] p-1" style={{ background: 'var(--surface-alt)' }}>
        {(['documents', 'faq', 'brain'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 rounded-[3px] px-4 py-2 text-[13px] font-medium transition-all"
            style={{
              background: activeTab === tab ? 'var(--surface)' : 'transparent',
              color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            {tab === 'documents' && t('📄 Documents', '📄 文档')}
            {tab === 'faq' && t('💬 FAQ Rules', '💬 FAQ规则')}
            {tab === 'brain' && t('🧠 Brain Status', '🧠 大脑状态')}
          </button>
        ))}
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Search + Filter */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={t('Search documents...', '搜索文档...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 rounded-[4px] border px-3 py-2 text-[13px]"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="rounded-[4px] border px-3 py-2 text-[13px]"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            >
              <option value="all">{t('All Categories', '所有分类')}</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{t(cat.en, cat.zh)}</option>
              ))}
            </select>
          </div>

          {/* Document List */}
          {loading ? (
            <div className="py-12 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {t('Loading...', '加载中...')}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="rounded-[4px] border py-12 text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>
                {t('No documents yet', '暂无文档')}
              </p>
              <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {t('Upload product specs, supplier info, or pricing rules to get started', '上传产品规格、供应商信息或定价规则以开始')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-[4px] border p-4 transition-all hover:shadow-sm"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[12px]"
                      style={{
                        background: CATEGORIES.find(c => c.value === doc.category)?.color + '15',
                        color: CATEGORIES.find(c => c.value === doc.category)?.color
                      }}
                    >
                      {doc.source_type === 'file_upload' ? '📎' : doc.source_type === 'url_scrape' ? '🔗' : '✏️'}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                        {doc.title}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {CATEGORIES.find(c => c.value === doc.category)?.en || doc.category} · {doc.source_type} · {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete('document', doc.id)}
                    className="rounded-[3px] px-2 py-1 text-[11px] hover:bg-red-50 hover:text-red-600"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          {faqRules.length === 0 ? (
            <div className="rounded-[4px] border py-12 text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <p className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>
                {t('No FAQ rules yet', '暂无FAQ规则')}
              </p>
              <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {t('Add keyword-triggered responses for common customer questions', '为常见客户问题添加关键词触发回复')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {faqRules.map(rule => (
                <div
                  key={rule.id}
                  className="rounded-[4px] border p-4"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {rule.keywords.map(kw => (
                        <span
                          key={kw}
                          className="rounded-full px-2 py-0.5 text-[11px]"
                          style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleDelete('faq', rule.id)}
                      className="rounded-[3px] px-2 py-1 text-[11px] hover:bg-red-50 hover:text-red-600"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Delete
                    </button>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed" style={{ color: 'var(--text)' }}>
                    {rule.response_template}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Brain Status Tab */}
      {activeTab === 'brain' && (
        <div className="space-y-4">
          <div className="rounded-[4px] border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
              {t('How Company Brain Works', '公司大脑如何工作')}
            </h3>
            <div className="mt-4 space-y-3">
              <BrainStep
                icon="📥"
                title={t('Ingest', '摄取')}
                desc={t('Upload documents, forward emails, connect files', '上传文档、转发邮件、连接文件')}
                status={stats.totalDocs > 0 ? 'active' : 'empty'}
              />
              <BrainStep
                icon="🔍"
                title={t('Extract', '提取')}
                desc={t('AI extracts products, suppliers, pricing, specs', 'AI提取产品、供应商、定价、规格')}
                status={stats.totalDocs > 0 ? 'active' : 'empty'}
              />
              <BrainStep
                icon="💡"
                title={t('Learn', '学习')}
                desc={t('Builds your company knowledge graph over time', '随时间构建公司知识图谱')}
                status={stats.totalDocs > 5 ? 'active' : 'learning'}
              />
              <BrainStep
                icon="🎯"
                title={t('Apply', '应用')}
                desc={t('Uses knowledge to draft replies, extract RFQs, validate quotes', '利用知识起草回复、提取RFQ、验证报价')}
                status={stats.totalDocs > 10 ? 'active' : 'learning'}
              />
            </div>
          </div>

          <div className="rounded-[4px] border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
              {t('Knowledge Coverage', '知识覆盖度')}
            </h3>
            <div className="mt-4 space-y-2">
              {CATEGORIES.map(cat => {
                const count = stats.categories[cat.value] || 0;
                const max = 20;
                const pct = Math.min((count / max) * 100, 100);
                return (
                  <div key={cat.value} className="flex items-center gap-3">
                    <span className="w-32 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {t(cat.en, cat.zh)}
                    </span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--surface-alt)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: cat.color }}
                      />
                    </div>
                    <span className="w-8 text-right text-[11px] font-medium" style={{ color: 'var(--text)' }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <Modal onClose={() => setShowUpload(false)} title={t('Add Document', '添加文档')}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                {t('Title', '标题')}
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder={t('Document title', '文档标题')}
                className="w-full rounded-[4px] border px-3 py-2 text-[13px]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                {t('Category', '分类')}
              </label>
              <select
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value)}
                className="w-full rounded-[4px] border px-3 py-2 text-[13px]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{t(cat.en, cat.zh)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                {t('Upload File', '上传文件')}
              </label>
              <input
                type="file"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                className="w-full rounded-[4px] border px-3 py-2 text-[13px]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                accept=".txt,.md,.csv,.json,.pdf,.xlsx,.docx"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                {t('Or paste content', '或粘贴内容')}
              </label>
              <textarea
                value={uploadContent}
                onChange={e => setUploadContent(e.target.value)}
                placeholder={t('Paste document content here...', '在此粘贴文档内容...')}
                rows={6}
                className="w-full rounded-[4px] border px-3 py-2 text-[13px]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUpload(false)}
                className="rounded-[4px] border px-4 py-2 text-[13px]"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {t('Cancel', '取消')}
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || (!uploadFile && !uploadContent)}
                className="rounded-[4px] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {uploading ? t('Uploading...', '上传中...') : t('Upload', '上传')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* FAQ Modal */}
      {showFaqForm && (
        <Modal onClose={() => setShowFaqForm(false)} title={t('Add FAQ Rule', '添加FAQ规则')}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                {t('Trigger Keywords (comma-separated)', '触发关键词（逗号分隔）')}
              </label>
              <input
                type="text"
                value={faqKeywords}
                onChange={e => setFaqKeywords(e.target.value)}
                placeholder="e.g. minimum order, MOQ, sample"
                className="w-full rounded-[4px] border px-3 py-2 text-[13px]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text)' }}>
                {t('Response Template', '回复模板')}
              </label>
              <textarea
                value={faqResponse}
                onChange={e => setFaqResponse(e.target.value)}
                placeholder={t('The response to send when these keywords are detected...', '检测到这些关键词时发送的回复...')}
                rows={4}
                className="w-full rounded-[4px] border px-3 py-2 text-[13px]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFaqForm(false)}
                className="rounded-[4px] border px-4 py-2 text-[13px]"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {t('Cancel', '取消')}
              </button>
              <button
                onClick={handleCreateFaq}
                disabled={!faqKeywords || !faqResponse}
                className="rounded-[4px] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {t('Create', '创建')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function StatCard({ label, value, color, isText }: { label: string; value: number | string; color: string; isText?: boolean }) {
  return (
    <div className="rounded-[4px] border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="mt-1 text-[20px] font-bold" style={{ color }}>
        {isText ? value : value}
      </p>
    </div>
  );
}

function BrainStep({ icon, title, desc, status }: { icon: string; title: string; desc: string; status: 'active' | 'learning' | 'empty' }) {
  const colors = { active: '#10B981', learning: '#F59E0B', empty: '#D1D5DB' };
  return (
    <div className="flex items-start gap-3 rounded-[4px] border p-3" style={{ borderColor: 'var(--border)' }}>
      <span className="text-[18px]">{icon}</span>
      <div className="flex-1">
        <p className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{title}</p>
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{ background: colors[status] + '20', color: colors[status] }}
      >
        {status}
      </span>
    </div>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-full max-w-lg rounded-[6px] border p-6 shadow-xl"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>{title}</h2>
          <button onClick={onClose} className="text-[18px]" style={{ color: 'var(--text-muted)' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
