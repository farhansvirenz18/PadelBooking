import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPdf({ data, columns, filename, title }) {
  const doc = new jsPDF('landscape');

  doc.setFontSize(18);
  doc.setTextColor(27, 94, 32);
  doc.text(title || 'Aero Padel Report', 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Exported: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`, 14, 28);

  const tableColumns = columns.map(col => col.header);
  const tableRows = data.map(row =>
    columns.map(col => {
      const val = row[col.key];
      if (val === null || val === undefined) return '-';
      if (typeof val === 'number') return val.toLocaleString('id-ID');
      return String(val);
    })
  );

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 32,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [27, 94, 32],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 248, 240],
    },
    margin: { top: 32 },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} | Aero Padel`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    },
  });

  doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
}
