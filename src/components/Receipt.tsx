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

import React, { forwardRef } from 'react';

// ... (keep existing buildReceiptHtml and buildReceiptText)

export const PrintableReceipt = forwardRef<HTMLDivElement, { order: ReceiptOrder }>(({ order }, ref) => {
  return (
    <div id="print-receipt-container" ref={ref}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-receipt-container, #print-receipt-container * {
            visibility: visible;
          }
          #print-receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            width: 100%;
            max-width: 80mm;
            background-color: #ffffff;
            color: #000000;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 16px;
            line-height: 1.3;
          }
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          .receipt-wrap { padding: 4mm 4mm 12mm 4mm; width: 100%; box-sizing: border-box; }
          .receipt-center { text-align: center; }
          .receipt-divider { border-top: 1px dashed #000; margin: 8px 0; }
          .receipt-logo img { max-width: 50mm; max-height: 40mm; display: block; margin: 0 auto 8px auto; }
          .receipt-header { font-weight: 700; letter-spacing: 1px; font-size: 20px; text-transform: uppercase; }
          .receipt-tagline { font-size: 14px; color: #333; }
          .receipt-table { width: 100%; border-collapse: collapse; }
          .receipt-table td { vertical-align: top; padding: 4px 0; }
        }
        @media screen {
          #print-receipt-container {
            /* Render off-screen instead of display:none so assets load immediately */
            position: absolute;
            left: -9999px;
            top: -9999px;
            opacity: 0;
            pointer-events: none;
          }
        }
      `}</style>
      <div className="receipt-wrap">
        <div className="receipt-center">
          {order.logo_url && (
            <div className="receipt-logo">
              <img src={order.logo_url} alt="Logo" />
            </div>
          )}
          {!order.logo_url && (
            <>
              <div className="receipt-header">{order.business_name || 'KAINLOWKAL'}</div>
              <div className="receipt-tagline">{order.tagline || 'SINCE 2019'}</div>
            </>
          )}
        </div>
        <div className="receipt-divider"></div>
        <div>Order #: <strong>{order.order_number}</strong></div>
        <div>Date: {formatDateTime(order.created_at || new Date().toISOString())}</div>
        <div>Type: <strong>{order.order_type}</strong></div>
        <div>Customer: {order.customer_name}</div>
        {order.customer_contact && <div>Contact: {order.customer_contact}</div>}
        {order.delivery_address && order.order_type === 'Delivery' && <div>Address: {order.delivery_address}</div>}
        <div>Cashier: {order.cashier_name || ''}</div>
        <div className="receipt-divider"></div>
        <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '6px' }}>ITEMS</div>
        <table className="receipt-table">
          <tbody>
            {(order.items || []).map((item, idx) => (
              <tr key={idx}>
                <td>
                  <div style={{ fontWeight: 700 }}>
                    {item.product_name}{item.variant_name ? ` (${item.variant_name})` : ''}
                  </div>
                  <div style={{ fontSize: '14px', color: '#333' }}>
                    {item.quantity} x {formatCurrency(item.unit_price)}
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(item.total_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="receipt-divider"></div>
        <table className="receipt-table">
          <tbody>
            <tr>
              <td>Subtotal:</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(order.subtotal)}</td>
            </tr>
            {order.delivery_fee > 0 && (
              <tr>
                <td>Delivery Fee:</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(order.delivery_fee)}</td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ fontWeight: 700, fontSize: '22px', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
        <div style={{ marginTop: '8px' }}>Payment: {order.payment_method}</div>
        <div>Status: {order.payment_status}</div>
        <div className="receipt-divider"></div>
        <div className="receipt-center" style={{ fontWeight: 700, fontSize: '18px' }}>Thank you for dining with us!</div>
        <div className="receipt-center" style={{ fontStyle: 'italic', marginTop: '8px', fontSize: '12px' }}>
          {order.receipt_footer || 'This is an order slip only and not an official receipt.'}
        </div>
      </div>
    </div>
  );
});

export async function executePrint(printRef: React.RefObject<HTMLDivElement>) {
  if (!printRef.current) return;

  // 1. Wait for custom fonts to load (crucial for receipt formatting)
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // 2. Wait for all images in the receipt to finish loading
  const images = printRef.current.getElementsByTagName('img');
  const imagePromises = Array.from(images).map(img => {
    // If the image is already loaded and has dimensions, resolve immediately
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve; // Resolve on error so we don't block printing forever
    });
  });

  await Promise.all(imagePromises);

  // 3. Force a browser repaint to ensure the DOM is fully updated before opening the print dialog
  await new Promise(resolve => requestAnimationFrame(resolve));

  // 4. Add a slight delay to allow slow Android tablets/Huawei devices to process the layout
  await new Promise(resolve => setTimeout(resolve, 300));

  // 5. Trigger native print spooler
  window.print();
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
  const WIDTH = 48; // 48 chars for 80mm printer
  const line = '-'.repeat(WIDTH) + '\\n';
  let text = '';
  
  text += alignCenter(order.business_name || 'KAINLOWKAL', WIDTH) + '\\n';
  text += alignCenter(order.tagline || 'SINCE 2019', WIDTH) + '\\n';
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
    if (name.length > WIDTH) name = name.substring(0, WIDTH);
    text += name + '\\n';
    
    const qtyPrice = `${item.quantity} x ${formatCurrency(item.unit_price)}`;
    const total = formatCurrency(item.total_price);
    
    const space = WIDTH - qtyPrice.length - total.length;
    text += qtyPrice + (space > 0 ? ' '.repeat(space) : ' ') + total + '\\n';
  });
  
  text += line;
  
  const subtotalStr = formatCurrency(order.subtotal);
  text += padRight('Subtotal:', WIDTH - subtotalStr.length) + subtotalStr + '\\n';
  
  if (order.delivery_fee > 0) {
    const feeStr = formatCurrency(order.delivery_fee);
    text += padRight('Delivery:', WIDTH - feeStr.length) + feeStr + '\\n';
  }
  
  const totalStr = formatCurrency(order.total);
  text += padRight('TOTAL:', WIDTH - totalStr.length) + totalStr + '\\n';
  
  text += `Payment: ${order.payment_method}\\n`;
  text += `Status: ${order.payment_status}\\n`;
  text += line;
  text += alignCenter('Thank you!', WIDTH) + '\\n';
  text += alignCenter(order.receipt_footer || 'Order slip only.', WIDTH) + '\\n';
  
  return text;
}

export function printRawBT(order: ReceiptOrder) {
  const text = buildReceiptText(order);
  // Use the rawbt: scheme directly. PrintDownloadActivity expects a URL, not raw text.
  window.location.href = "rawbt:" + encodeURIComponent(text);
}


