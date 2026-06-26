import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { CreditTransaction } from '@/types/credits.types';
import { formatPesos } from './money';
import { parseStoredTimestamp } from '@/utils/timezone';
import { format } from 'date-fns';

interface GeneratePdfOptions {
  storeName: string;
  customerName: string;
  credits: CreditTransaction[];
  totalBalance: number;
}

/**
 * Generates an HTML template representing a premium, retro-inspired paper receipt (resibo) statement.
 */
function buildStatementHtml({ storeName, customerName, credits, totalBalance }: GeneratePdfOptions): string {
  const currentDateStr = format(new Date(), 'MMMM dd, yyyy - hh:mm a');
  
  // Filter only unpaid/partially paid credit items
  const activeCredits = credits.filter((c) => c.status !== 'paid');
  
  // Sort by date descending
  const sortedCredits = [...activeCredits].sort((a, b) => {
    const aTime = parseStoredTimestamp(a.date)?.getTime() ?? 0;
    const bTime = parseStoredTimestamp(b.date)?.getTime() ?? 0;
    return bTime - aTime;
  });

  const creditRows = sortedCredits.map((c) => {
    const date = parseStoredTimestamp(c.date);
    const dateStr = date ? format(date, 'MMM dd, yyyy') : 'Unknown Date';
    const product = c.product_name || 'Credit Account';
    const totalAmount = formatPesos(c.amount);
    const remaining = formatPesos(c.amount - c.amount_paid);
    const statusLabel = c.status.toUpperCase();
    const statusColor = c.status === 'partial' ? '#b45309' : '#b91c1c'; // Warm amber or red
    
    return `
      <tr>
        <td class="date-col">${dateStr}</td>
        <td>
          <div class="product-name">${product}</div>
          <div class="qty-label">${c.quantity ? `Qty: ${c.quantity}` : ''}</div>
        </td>
        <td class="text-right">${totalAmount}</td>
        <td class="text-right" style="color: ${statusColor}; font-weight: bold;">${remaining}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Statement of Account - ${customerName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;600;800&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            color: #1e1e24;
            background-color: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 13px;
            line-height: 1.4;
          }

          .receipt-container {
            max-width: 500px;
            margin: 0 auto;
            border: 2px solid #564e45;
            padding: 30px 24px;
            background: #faf8f5;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            position: relative;
          }

          /* Perforation indicator top and bottom */
          .receipt-container::before, .receipt-container::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            height: 6px;
            background-image: radial-gradient(circle, #faf8f5 3px, transparent 4px);
            background-size: 12px 12px;
          }
          .receipt-container::before {
            top: -3px;
            background-repeat: repeat-x;
          }
          .receipt-container::after {
            bottom: -3px;
            background-repeat: repeat-x;
          }

          .header {
            text-align: center;
            margin-bottom: 24px;
          }

          .store-name {
            font-family: 'Inter', sans-serif;
            font-weight: 800;
            font-size: 22px;
            color: #623418; /* Cinnamon theme color */
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
          }

          .store-subtitle {
            font-size: 11px;
            color: #7b7167;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin: 0 0 16px 0;
          }

          .divider-dotted {
            border-top: 2px dotted #c4b9ae;
            margin: 16px 0;
          }

          .divider-double {
            border-top: 4px double #564e45;
            margin: 16px 0;
          }

          .meta-info {
            font-size: 12px;
            margin-bottom: 20px;
            color: #403a34;
          }

          .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
          }

          .meta-label {
            font-weight: bold;
            color: #7b7167;
          }

          .meta-value {
            font-weight: 600;
            color: #1e1e24;
          }

          .statement-title {
            text-align: center;
            font-weight: 800;
            font-size: 15px;
            color: #564e45;
            letter-spacing: 1px;
            margin: 20px 0 12px 0;
            text-transform: uppercase;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          th {
            font-weight: 800;
            font-size: 11px;
            color: #7b7167;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            text-align: left;
            border-bottom: 2px solid #564e45;
            padding: 8px 4px;
          }

          td {
            padding: 10px 4px;
            border-bottom: 1px dotted #c4b9ae;
            vertical-align: top;
            font-size: 12px;
          }

          tr:last-child td {
            border-bottom: none;
          }

          .date-col {
            font-family: 'Courier Prime', monospace;
            font-size: 11px;
            color: #564e45;
            white-space: nowrap;
          }

          .product-name {
            font-weight: 600;
          }

          .qty-label {
            font-size: 10px;
            color: #7b7167;
            margin-top: 2px;
          }

          .text-right {
            text-align: right;
          }

          .total-section {
            background-color: #eae3d9;
            padding: 14px 18px;
            border-radius: 8px;
            border: 1px solid #c4b9ae;
            margin-top: 10px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .total-label {
            font-weight: 800;
            font-size: 14px;
            color: #564e45;
            text-transform: uppercase;
          }

          .total-value {
            font-family: 'Inter', sans-serif;
            font-weight: 800;
            font-size: 18px;
            color: #b91c1c; /* Prominent red for debt balance */
          }

          .footer-note {
            text-align: center;
            font-size: 11px;
            color: #7b7167;
            margin-top: 24px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1 class="store-name">${storeName}</h1>
            <p class="store-subtitle">Sari-Sari Store Statement</p>
          </div>

          <div class="divider-double"></div>

          <div class="meta-info">
            <div class="meta-row">
              <span class="meta-label">Customer (Suki):</span>
              <span class="meta-value">${customerName}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Date Generated:</span>
              <span class="meta-value">${currentDateStr}</span>
            </div>
          </div>

          <div class="divider-dotted"></div>

          <h2 class="statement-title">Unpaid Credit Ledger</h2>

          <table>
            <thead>
              <tr>
                <th style="width: 25%;">Date</th>
                <th style="width: 45%;">Item Description</th>
                <th style="width: 15%; text-align: right;">Total</th>
                <th style="width: 15%; text-align: right;">Unpaid</th>
              </tr>
            </thead>
            <tbody>
              ${creditRows || `
                <tr>
                  <td colspan="4" style="text-align: center; color: #7b7167; padding: 20px 0;">
                    Walang aktibong utang (No active credits)
                  </td>
                </tr>
              `}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Total Outstanding:</span>
              <span class="total-value">${formatPesos(totalBalance)}</span>
            </div>
          </div>

          <p class="footer-note">
            Mangyaring bayaran sa inyong pinakamadaling panahon.<br/>
            Maraming salamat sa inyong pagtangkilik!
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Renders a suki's credit statement into a PDF file and launches the OS native share drawer.
 */
export async function shareCreditStatementPdf(options: GeneratePdfOptions): Promise<boolean> {
  try {
    const html = buildStatementHtml(options);
    
    // Render HTML to PDF file on device
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });
    
    // Rename temp PDF to something readable by the recipient
    const sanitizedCustomerName = options.customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const newPdfPath = `${FileSystem.cacheDirectory}SariSari_Statement_${sanitizedCustomerName}.pdf`;
    
    await FileSystem.copyAsync({
      from: uri,
      to: newPdfPath,
    });

    // Share PDF
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('Sharing is not available on this platform');
      return false;
    }

    await Sharing.shareAsync(newPdfPath, {
      mimeType: 'application/pdf',
      dialogTitle: `Statement for ${options.customerName}`,
      UTI: 'com.adobe.pdf',
    });

    // Clean up cache file asynchronously
    FileSystem.deleteAsync(newPdfPath, { idempotent: true }).catch(() => {});

    return true;
  } catch (error) {
    console.error('Failed to generate or share credit statement PDF:', error);
    return false;
  }
}
