'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

import {
  tenant,
  users,
  customers,
  categories,
  suppliers as mockSuppliers,
} from './mock-data';
import {
  inquiryFields,
  inquiry as mockInquiry,
  requirementVersion1,
  opportunity as mockOpportunity,
  rfqBatch as mockRfqBatch,
  supplierResponse1,
  supplierResponse2,
  supplierResponse3,
  comparison as mockComparison,
  costCalculation as mockCostCalc,
  quote as mockQuote,
  followUp as mockFollowUp,
} from './mock-workflow';
import {
  conversation as mockConversation,
  messages as mockMessages,
} from './mock-messages';

import type {
  Inquiry,
  Opportunity,
  Supplier,
  SupplierRfqBatch,
  SupplierResponse,
  SupplierComparison,
  CostCalculation,
  Quote,
  FollowUp,
  Conversation,
  Message,
} from './types';

/* ── Snapshot of mock data for reset ─────────────────────────────────────── */

const INITIAL = {
  tenant,
  users,
  customers,
  categories,
  suppliers: mockSuppliers,
  inquiry: mockInquiry,
  inquiryFields,
  requirementVersions: [requirementVersion1],
  opportunity: mockOpportunity,
  rfqBatch: mockRfqBatch,
  supplierResponses: [supplierResponse1, supplierResponse2, supplierResponse3],
  comparison: mockComparison,
  costCalculation: mockCostCalc,
  quote: mockQuote,
  followUp: mockFollowUp,
  conversation: mockConversation,
  messages: mockMessages,
};

type InitialSnapshot = typeof INITIAL;

/* ── Context shape ───────────────────────────────────────────────────────── */

interface DemoContextValue extends InitialSnapshot {
  // Actions
  advanceInquiryStatus: (nextStatus: Inquiry['status']) => void;
  approveQuote: (quoteId: string) => void;
  sendQuote: (quoteId: string) => void;
  advanceOpportunityStage: (nextStage: Opportunity['stage']) => void;
  markSupplierVerified: (supplierId: string) => void;
  advanceFollowUpStep: (followUpId: string) => void;
  addMessage: (message: Message) => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

/* ── Provider ────────────────────────────────────────────────────────────── */

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InitialSnapshot>(() => structuredClone(INITIAL));

  const advanceInquiryStatus = useCallback((nextStatus: Inquiry['status']) => {
    setState((prev) => ({
      ...prev,
      inquiry: { ...prev.inquiry, status: nextStatus },
    }));
  }, []);

  const approveQuote = useCallback((quoteId: string) => {
    setState((prev) => ({
      ...prev,
      quote:
        prev.quote.id === quoteId
          ? {
              ...prev.quote,
              status: 'approved',
              approvedBy: 'u1',
              approvedAt: new Date().toISOString(),
            }
          : prev.quote,
    }));
  }, []);

  const sendQuote = useCallback((quoteId: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      quote:
        prev.quote.id === quoteId
          ? {
              ...prev.quote,
              status: 'sent',
              sentAt: now,
              auditTrail: [
                ...prev.quote.auditTrail,
                {
                  action: 'sent' as const,
                  actor: 'u2',
                  timestamp: now,
                  details: 'Quote sent to customer',
                },
              ],
            }
          : prev.quote,
    }));
  }, []);

  const advanceOpportunityStage = useCallback((nextStage: Opportunity['stage']) => {
    setState((prev) => ({
      ...prev,
      opportunity: { ...prev.opportunity, stage: nextStage },
    }));
  }, []);

  const markSupplierVerified = useCallback((supplierId: string) => {
    setState((prev) => ({
      ...prev,
      suppliers: prev.suppliers.map((s) =>
        s.id === supplierId
          ? {
              ...s,
              verificationStatus: 'verified' as const,
              verificationLevel: 'site_visit_completed' as const,
              lastVerifiedAt: new Date().toISOString(),
            }
          : s,
      ),
    }));
  }, []);

  const advanceFollowUpStep = useCallback((followUpId: string) => {
    setState((prev) => ({
      ...prev,
      followUp:
        prev.followUp.id === followUpId
          ? {
              ...prev.followUp,
              currentStep: prev.followUp.currentStep + 1,
              steps: prev.followUp.steps.map((step, i) =>
                i === prev.followUp.currentStep
                  ? { ...step, status: 'completed' as const, sentAt: new Date().toISOString() }
                  : step,
              ),
            }
          : prev.followUp,
    }));
  }, []);

  const addMessage = useCallback((message: Message) => {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(structuredClone(INITIAL));
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      ...state,
      advanceInquiryStatus,
      approveQuote,
      sendQuote,
      advanceOpportunityStage,
      markSupplierVerified,
      advanceFollowUpStep,
      addMessage,
      resetDemo,
    }),
    [
      state,
      advanceInquiryStatus,
      approveQuote,
      sendQuote,
      advanceOpportunityStage,
      markSupplierVerified,
      advanceFollowUpStep,
      addMessage,
      resetDemo,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

/* ── Hook ────────────────────────────────────────────────────────────────── */

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within a DemoProvider');
  return ctx;
}
