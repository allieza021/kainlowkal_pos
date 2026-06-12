import type { ReceiptOrder } from '../types';
import { formatCurrency, formatDateTime } from '../lib/utils';

function lineItems(order: ReceiptOrder) {
  return (order.items || []).map((item) => `
    <tr>
      <td>
        <div style="font-weight:700">${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}</div>
        <div style="font-size:8px;color:#555">${item.quantity} x ${formatCurrency(item.unit_price)}</div>
      </td>
      <td style="text-align:right">${formatCurrency(item.total_price)}</td>
    </tr>
  `).join('');
}

export function buildReceiptHtml(order: ReceiptOrder) {
  const hasLogo = order.logo_url && order.logo_url.trim();

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=58mm, initial-scale=1.0" />
      <style>
        @page { size: 58mm auto; margin: 0; }
        html, body { 
          margin: 0; 
          padding: 0; 
          width: 58mm; 
          background-color: #ffffff; 
          color: #000000; 
        }
        body { 
          font-family: 'Courier New', Courier, monospace; 
          font-size: 12px; 
          line-height: 1.2;
        }
        .wrap { padding: 2mm; width: 58mm; box-sizing: border-box; }
        .center { text-align: center; }
        .divider { border-top: 1px dashed #000; margin: 5px 0; }
        .logo-container { margin-bottom: 5px; }
        .logo-container img { max-width: 40mm; max-height: 30mm; display: block; margin: 0 auto; }
        .header-text { font-weight: 700; letter-spacing: 1px; font-size: 14px; }
        .tagline { font-size: 10px; color: #333; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; }
      </style>
    </head>
    <body>
      <div class="wrap" id="receipt-print-area">
        <div class="center">
          ${hasLogo ? `<div class="logo-container"><img src="${order.logo_url}" alt="Logo" /></div>` : ''}
          ${!hasLogo ? `<div class="header-text">${order.business_name || 'KAINLOWKAL'}</div><div class="tagline">${order.tagline || 'SINCE 2019'}</div>` : ''}
        </div>
        <div class="divider"></div>
        <div>Order #: ${order.order_number}</div>
        <div>Date: ${formatDateTime(order.created_at || new Date().toISOString())}</div>
        <div>Type: ${order.order_type}</div>
        <div>Customer: ${order.customer_name}</div>
        ${order.customer_contact ? `<div>Contact: ${order.customer_contact}</div>` : ''}
        ${order.delivery_address && order.order_type === 'Delivery' ? `<div>Address: ${order.delivery_address}</div>` : ''}
        <div>Cashier: ${order.cashier_name || ''}</div>
        <div class="divider"></div>
        <div style="font-weight:700">ITEMS</div>
        <table>${lineItems(order)}</table>
        <div class="divider"></div>
        <div>Subtotal: ${formatCurrency(order.subtotal)}</div>
        ${order.delivery_fee > 0 ? `<div>Delivery Fee: ${formatCurrency(order.delivery_fee)}</div>` : ''}
        <div style="font-weight:700;font-size:10px">TOTAL: ${formatCurrency(order.total)}</div>
        <div>Payment: ${order.payment_method}</div>
        <div>Status: ${order.payment_status}</div>
        <div class="divider"></div>
        <div class="center">Thank you for dining with us!</div>
        <div class="center" style="font-style:italic">${order.receipt_footer || 'This is an order slip only and not an official receipt.'}</div>
      </div>
    </body>
  </html>`;
}

export function printReceipt(order: ReceiptOrder) {
  const printDiv = document.createElement('div');
  printDiv.id = 'print-receipt-container';
  // Use a scoped style specifically for printing
  printDiv.innerHTML = `
    <style>
      @media print {
        body > *:not(#print-receipt-container) {
          display: none !important;
        }
        @page { size: 58mm auto; margin: 0; }
        #print-receipt-container {
          margin: 0; 
          padding: 0; 
          width: 58mm; 
          background-color: #ffffff; 
          color: #000000;
          font-family: 'Courier New', Courier, monospace; 
          font-size: 12px; 
          line-height: 1.2;
        }
        .receipt-wrap { padding: 2mm; width: 58mm; box-sizing: border-box; }
        .receipt-center { text-align: center; }
        .receipt-divider { border-top: 1px dashed #000; margin: 5px 0; }
        .receipt-logo img { max-width: 40mm; max-height: 30mm; display: block; margin: 0 auto 5px auto; }
        .receipt-header { font-weight: 700; letter-spacing: 1px; font-size: 14px; }
        .receipt-tagline { font-size: 10px; color: #333; }
        .receipt-table { width: 100%; border-collapse: collapse; }
        .receipt-table td { vertical-align: top; }
      }
    </style>
    <div id="print-receipt-container">
      <div class="receipt-wrap">
        <div class="receipt-center">
          ${order.logo_url ? `<div class="receipt-logo"><img src="${order.logo_url}" alt="Logo" /></div>` : ''}
          ${!order.logo_url ? `<div class="receipt-header">${order.business_name || 'KAINLOWKAL'}</div><div class="receipt-tagline">${order.tagline || 'SINCE 2019'}</div>` : ''}
        </div>
        <div class="receipt-divider"></div>
        <div>Order #: ${order.order_number}</div>
        <div>Date: ${formatDateTime(order.created_at || new Date().toISOString())}</div>
        <div>Type: ${order.order_type}</div>
        <div>Customer: ${order.customer_name}</div>
        ${order.customer_contact ? `<div>Contact: ${order.customer_contact}</div>` : ''}
        ${order.delivery_address && order.order_type === 'Delivery' ? `<div>Address: ${order.delivery_address}</div>` : ''}
        <div>Cashier: ${order.cashier_name || ''}</div>
        <div class="receipt-divider"></div>
        <div style="font-weight:700">ITEMS</div>
        <table class="receipt-table">
          ${(order.items || []).map(item => `
            <tr>
              <td>
                <div style="font-weight:700">${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}</div>
                <div style="font-size:10px;color:#333">${item.quantity} x ${formatCurrency(item.unit_price)}</div>
              </td>
              <td style="text-align:right">${formatCurrency(item.total_price)}</td>
            </tr>
          `).join('')}
        </table>
        <div class="receipt-divider"></div>
        <div>Subtotal: ${formatCurrency(order.subtotal)}</div>
        ${order.delivery_fee > 0 ? `<div>Delivery Fee: ${formatCurrency(order.delivery_fee)}</div>` : ''}
        <div style="font-weight:700;font-size:14px;margin-top:5px;">TOTAL: ${formatCurrency(order.total)}</div>
        <div style="margin-top:5px;">Payment: ${order.payment_method}</div>
        <div>Status: ${order.payment_status}</div>
        <div class="receipt-divider"></div>
        <div class="receipt-center">Thank you for dining with us!</div>
        <div class="receipt-center" style="font-style:italic;margin-top:5px;">${order.receipt_footer || 'This is an order slip only and not an official receipt.'}</div>
      </div>
    </div>
  `;

  document.body.appendChild(printDiv);
  
  setTimeout(() => {
    window.print();
    setTimeout(() => {
      if (document.body.contains(printDiv)) {
        document.body.removeChild(printDiv);
      }
    }, 1000);
  }, 500);
}

function alignCenter(str: string, len: number) {
  if (str.length >= len) return str.substring(0, len);
  const pad = len - str.length;
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return ' '.repeat(left) + str + ' '.repeat(right);
}

function padRight(str: string, len: number) {
  if (str.length >= len) return str.substring(0, len);
  return str + ' '.repeat(len - str.length);
}

export function buildReceiptText(order: ReceiptOrder) {
  const line = '-'.repeat(32) + '\\n';
  let text = '';
  
  text += alignCenter(order.business_name || 'KAINLOWKAL', 32) + '\\n';
  text += alignCenter(order.tagline || 'SINCE 2019', 32) + '\\n';
  text += line;
  
  text += `Order #: ${order.order_number}\\n`;
  text += `Date: ${formatDateTime(order.created_at || new Date().toISOString())}\\n`;
  text += `Type: ${order.order_type}\\n`;
  text += `Customer: ${order.customer_name}\\n`;
  if (order.customer_contact) text += `Contact: ${order.customer_contact}\\n`;
  if (order.delivery_address && order.order_type === 'Delivery') {
    text += `Address: ${order.delivery_address}\\n`;
  }
  text += `Cashier: ${order.cashier_name || ''}\\n`;
  text += line;
  text += 'ITEMS\\n';
  
  (order.items || []).forEach(item => {
    let name = item.product_name;
    if (item.variant_name) name += ` (${item.variant_name})`;
    if (name.length > 32) name = name.substring(0, 32);
    text += name + '\\n';
    
    const qtyPrice = `${item.quantity} x ${formatCurrency(item.unit_price)}`;
    const total = formatCurrency(item.total_price);
    
    const space = 32 - qtyPrice.length - total.length;
    text += qtyPrice + (space > 0 ? ' '.repeat(space) : ' ') + total + '\\n';
  });
  
  text += line;
  
  const subtotalStr = formatCurrency(order.subtotal);
  text += padRight('Subtotal:', 32 - subtotalStr.length) + subtotalStr + '\\n';
  
  if (order.delivery_fee > 0) {
    const feeStr = formatCurrency(order.delivery_fee);
    text += padRight('Delivery:', 32 - feeStr.length) + feeStr + '\\n';
  }
  
  const totalStr = formatCurrency(order.total);
  text += padRight('TOTAL:', 32 - totalStr.length) + totalStr + '\\n';
  
  text += `Payment: ${order.payment_method}\\n`;
  text += `Status: ${order.payment_status}\\n`;
  text += line;
  text += alignCenter('Thank you!', 32) + '\\n';
  text += alignCenter(order.receipt_footer || 'Order slip only.', 32) + '\\n';
  
  return text;
}

export function printRawBT(order: ReceiptOrder) {
  const text = buildReceiptText(order);
  const beforeUrl = 'intent:';
  const afterUrl = '#Intent;component=ru.a402d.rawbtprinter.activity.PrintDownloadActivity;package=ru.a402d.rawbtprinter;end;';
  window.location.href = beforeUrl + encodeURI(text) + afterUrl;
}


