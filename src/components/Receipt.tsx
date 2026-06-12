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
      <style>
        @page { size: 58mm auto; margin: 0; }
        body { margin:0; width:58mm; font-family:'Courier New', monospace; font-size:9px; color:#111; }
        .wrap { padding: 4mm 3mm; }
        .center { text-align:center; }
        .divider { border-top:1px dashed #111; margin:6px 0; }
        .logo-container { margin-bottom:6px; }
        .logo-container img { max-width:50mm; max-height:30mm; display:block; margin:0 auto; }
        .header-text { font-weight:700;letter-spacing:2px; }
        .tagline { font-size:8px;color:#555; }
        table { width:100%; border-collapse:collapse; }
        td { vertical-align:top; }
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
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  iframe.contentDocument?.open();
  iframe.contentDocument?.write(buildReceiptHtml(order));
  iframe.contentDocument?.close();
  
  // Give images a moment to load before printing
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 500);
}

export function printRawBT(order: ReceiptOrder) {
  const html = buildReceiptHtml(order);
  // Use base64 data URI format for RawBT to properly parse HTML
  const b64 = btoa(unescape(encodeURIComponent(html)));
  const intentUrl = "intent:data:text/html;base64," + b64 + "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;";
  window.location.href = intentUrl;
}

