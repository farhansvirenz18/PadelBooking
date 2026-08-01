import ExcelJS from 'exceljs';

export async function exportToExcel({ data, columns, filename, title }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PadelBook';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title || 'Report');

  sheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1B5E20' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  data.forEach((row, idx) => {
    const addedRow = sheet.addRow(row);
    if (idx % 2 === 0) {
      addedRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F1F8E9' },
      };
    }
  });

  const lastRow = sheet.lastRow.number;
  const footerRow = sheet.addRow([`Total: ${data.length} records | Exported: ${new Date().toLocaleDateString('id-ID')}`]);
  footerRow.font = { italic: true, color: { argb: '666666' }, size: 9 };
  sheet.mergeCells(lastRow + 1, 1, lastRow + 1, columns.length);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
