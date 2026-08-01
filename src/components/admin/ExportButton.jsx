"use client"
import { useState, useRef, useEffect } from 'react';
import { exportToExcel } from '@/lib/exportExcel';
import { exportToPdf } from '@/lib/exportPdf';

export default function ExportButton({ data = [], columns = [], filename = 'export', title = 'Report' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleExcel = async () => {
    setOpen(false);
    if (!data.length) return;
    await exportToExcel({ data, columns, filename, title });
  };

  const handlePdf = () => {
    setOpen(false);
    if (!data.length) return;
    exportToPdf({ data, columns, filename, title });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={!data.length}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        Export
        <span className="material-symbols-outlined text-[16px]">{open ? 'expand_less' : 'expand_more'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 overflow-hidden z-50">
          <button
            onClick={handleExcel}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-[#1B7A21]">table_chart</span>
            Download Excel
          </button>
          <button
            onClick={handlePdf}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-[#C62828]">picture_as_pdf</span>
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
