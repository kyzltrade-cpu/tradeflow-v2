import Link from 'next/link';
import { getCurrentUser, getSuppliers } from '@/lib/supabase/queries';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>Suppliers</h1>
        <p style={{ color: 'var(--text-muted)' }}>Please log in to view suppliers.</p>
      </div>
    );
  }

  const suppliers = await getSuppliers(user.company_id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text)' }}>
            Suppliers
            {suppliers.length > 0 && (
              <span
                className="ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[12px] font-semibold"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                {suppliers.length}
              </span>
            )}
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Manage your supplier directory and verification status.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {suppliers.length === 0 && (
        <div
          className="rounded-[4px] border p-12 text-center"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
          </svg>
          <h3 className="mt-4 text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
            No suppliers yet
          </h3>
          <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Add suppliers to your directory to start sourcing and comparing quotes.
          </p>
        </div>
      )}

      {/* Supplier grid */}
      {suppliers.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="rounded-[4px] border p-4 transition-all hover:shadow-md"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Name + location */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {supplier.legal_name}
                  </h3>
                  {supplier.location && (
                    <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {supplier.location}
                    </p>
                  )}
                </div>
                <span
                  className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: supplier.is_approved ? '#ECFDF5' : '#FFFBEB',
                    color: supplier.is_approved ? '#038153' : '#EA580C',
                    border: `1px solid ${supplier.is_approved ? '#A7F3D0' : '#FED7AA'}`,
                  }}
                >
                  {supplier.is_approved ? 'Approved' : 'Pending'}
                </span>
              </div>

              {/* Contact */}
              {(supplier.contact_name || supplier.contact_email) && (
                <div className="mt-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {supplier.contact_name && <span>{supplier.contact_name}</span>}
                  {supplier.contact_name && supplier.contact_email && <span> &middot; </span>}
                  {supplier.contact_email && <span>{supplier.contact_email}</span>}
                </div>
              )}

              {/* Certifications */}
              {supplier.certifications && supplier.certifications.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {supplier.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              )}

              {/* View details */}
              <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                <Link
                  href={`/admin/suppliers/${supplier.id}`}
                  className="inline-flex items-center gap-1 text-[12px] font-medium transition-colors hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  View Details
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
