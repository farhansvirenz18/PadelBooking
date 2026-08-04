import jsPDF from 'jspdf';

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function shortId(uuid) {
  return uuid.replace(/-/g, '').substring(0, 8).toUpperCase();
}

export async function generateTicketPdf(booking, qrCodeDataUrl) {
  const doc = new jsPDF('p', 'mm', 'a5');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Background
  doc.setFillColor(250, 253, 247);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Top green header bar
  doc.setFillColor(27, 94, 32);
  doc.rect(0, 0, pageW, 35, 'F');

  // Brand name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('AERO PADEL', margin, 16);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 230, 201);
  doc.text('BOOKING CONFIRMATION TICKET', margin, 25);

  // Booking ref badge
  doc.setFillColor(200, 230, 201);
  doc.roundedRect(pageW - margin - 45, 8, 45, 14, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(27, 94, 32);
  doc.text('BOOKING REF', pageW - margin - 45 + 22.5, 14, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(shortId(booking.id), pageW - margin - 45 + 22.5, 21, { align: 'center' });

  // QR Code
  let y = 45;
  if (qrCodeDataUrl) {
    const qrSize = 40;
    const qrX = (pageW - qrSize) / 2;
    doc.addImage(qrCodeDataUrl, 'PNG', qrX, y, qrSize, qrSize);
    y += qrSize + 5;

    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('Scan QR code at venue for check-in', pageW / 2, y, { align: 'center' });
    y += 8;
  }

  // Divider
  doc.setDrawColor(218, 220, 224);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(margin, y, pageW - margin, y);
  doc.setLineDashPattern([], 0);
  y += 8;

  // Ticket details section
  function drawField(label, value, yPos) {
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin, yPos);
    doc.setFontSize(11);
    doc.setTextColor(26, 28, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(value || '-', margin, yPos + 5);
    return yPos + 12;
  }

  y = drawField('COURT', `${booking.courts?.name || 'Court'} (${booking.courts?.type || '-'})`, y);
  y = drawField('DATE', formatDate(booking.time_slots?.date || booking.booking_date), y);
  y = drawField('TIME', `${booking.time_slots?.start_time || booking.start_time} - ${booking.time_slots?.end_time || booking.end_time}`, y);

  if (booking.coaches?.name) {
    y = drawField('COACH', booking.coaches.name, y);
  }

  y = drawField('DURATION', `${booking.duration_hours || 1} hour(s)`, y);
  y = drawField('TOTAL PRICE', formatPrice(booking.total_price), y);

  // Status badge
  y += 2;
  const statusText = booking.payment_status === 'paid' ? 'PAID' : booking.status?.toUpperCase() || 'PENDING';
  const statusColor = booking.payment_status === 'paid' ? [27, 94, 32] : [255, 152, 0];
  doc.setFillColor(...statusColor);
  doc.roundedRect(margin, y, 30, 8, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, margin + 15, y + 5.5, { align: 'center' });

  // Bottom footer
  const footerY = pageH - 20;
  doc.setDrawColor(218, 220, 224);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(margin, footerY, pageW - margin, footerY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'normal');
  doc.text('Show this ticket at the venue entrance.', pageW / 2, footerY + 6, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString('id-ID')} | Aero Padel`, pageW / 2, footerY + 11, { align: 'center' });

  return doc;
}
