import React from 'react';

interface BillReceiptProps {
  billData: {
    order_no: string;
    date: string;
    table_number: number;
    cashier?: string;
    order_type: string;
    items: Array<{
      name: string;
      quantity: number;
      unit_price: number;
      total: number;
      discount_percentage?: number;
    }>;
    subtotal: number;
    discount: number;
    service_charge: number;
    service_charge_percentage: number;
    total: number;
    total_discount: number;
    company: {
      name: string;
      phone?: string;
      address?: string;
    };
  };
}

const BillReceipt: React.FC<BillReceiptProps> = ({ billData }) => {
  return (
    <div className="bill-receipt">
      {/* Header with Logo/Name */}
      <div className="receipt-header">
        <h1 className="restaurant-name">{billData.company.name}</h1>
      </div>

      {/* Bill Details */}
      <div className="bill-info">
        <div className="info-row">
          <span className="label">Date:</span>
          <span className="value">{billData.date}</span>
          <span className="label">Order No:</span>
          <span className="value">{billData.order_no}</span>
        </div>
        
        <div className="info-row">
          <span className="label">Table:</span>
          <span className="value">{billData.table_number}</span>
          <span className="label">Cashier:</span>
          <span className="value">{billData.cashier || ''}</span>
        </div>
      </div>

      {/* Order Type */}
      <div className="order-type">
        <span>Order Type: {billData.order_type}</span>
      </div>

      {/* Items Table */}
      <table className="items-table">
        <thead>
          <tr>
            <th className="item-name">Items</th>
            <th className="item-qty">Qty</th>
            <th className="item-price">Price</th>
          </tr>
        </thead>
        <tbody>
          {billData.items.map((item, index) => (
            <React.Fragment key={index}>
              <tr className="item-row">
                <td className="item-name">
                  {item.name}
                  {item.discount_percentage && item.discount_percentage > 0 && (
                    <div className="item-discount">
                      ({item.unit_price.toFixed(2)} LKR - {item.discount_percentage}% off)
                    </div>
                  )}
                </td>
                <td className="item-qty">{item.quantity}</td>
                <td className="item-price">{item.total.toFixed(2)} LKR</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="totals-section">
        <div className="total-row">
          <span>Sub Total</span>
          <span>{billData.subtotal.toFixed(2)} LKR</span>
        </div>
        
        {billData.discount > 0 && (
          <div className="total-row">
            <span>Discount</span>
            <span>({billData.discount.toFixed(2)}) LKR</span>
          </div>
        )}
        
        {billData.service_charge > 0 && (
          <div className="total-row">
            <span>Service Charge ({billData.service_charge_percentage}%)</span>
            <span>{billData.service_charge.toFixed(2)} LKR</span>
          </div>
        )}
        
        <div className="total-row grand-total">
          <span>Total</span>
          <span>{billData.total.toFixed(2)} LKR</span>
        </div>

        {billData.total_discount > 0 && (
          <div className="total-discount-box">
            <span>TOTAL DISCOUNT</span>
            <span>{billData.total_discount.toFixed(2)} LKR</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="receipt-footer">
        <p className="thank-you">THANK YOU COME AGAIN</p>
        <p className="tagline">Let the quality define its own standards</p>
        <p className="powered-by">Powered by JAAN Network Ltd</p>
        <p className="version">10.12.06</p>
      </div>

      <style>{`
        .bill-receipt {
          width: 80mm;
          font-family: 'Courier New', monospace;
          background: white;
          padding: 10mm;
          margin: 0 auto;
          color: #000;
        }

        .receipt-header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }

        .restaurant-name {
          font-size: 32px;
          font-weight: 900;
          letter-spacing: 8px;
          margin: 0;
          font-family: Arial, sans-serif;
        }

        .bill-info {
          margin-bottom: 10px;
          font-size: 11px;
        }

        .info-row {
          display: grid;
          grid-template-columns: auto 1fr auto 1fr;
          gap: 5px;
          margin-bottom: 3px;
        }

        .label {
          font-weight: bold;
        }

        .value {
          text-align: left;
        }

        .order-type {
          text-align: center;
          border: 2px solid #000;
          padding: 5px;
          margin: 10px 0;
          font-weight: bold;
          font-size: 12px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 11px;
        }

        .items-table thead {
          border-bottom: 2px solid #000;
          border-top: 2px solid #000;
        }

        .items-table th {
          padding: 5px;
          font-weight: bold;
          text-align: left;
        }

        .items-table .item-name {
          width: 50%;
        }

        .items-table .item-qty {
          width: 20%;
          text-align: center;
        }

        .items-table .item-price {
          width: 30%;
          text-align: right;
        }

        .item-row td {
          padding: 8px 5px;
          vertical-align: top;
        }

        .item-discount {
          font-size: 9px;
          color: #666;
          font-style: italic;
          margin-top: 2px;
        }

        .totals-section {
          border-top: 2px solid #000;
          padding-top: 10px;
          font-size: 12px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding: 0 5px;
        }

        .grand-total {
          font-weight: bold;
          font-size: 14px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #000;
        }

        .total-discount-box {
          border: 3px solid #000;
          padding: 10px;
          margin: 15px 0;
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 13px;
        }

        .receipt-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #000;
          font-size: 10px;
        }

        .thank-you {
          font-weight: bold;
          font-size: 12px;
          margin: 10px 0;
        }

        .tagline {
          font-style: italic;
          margin: 5px 0;
          font-size: 9px;
        }

        .powered-by {
          font-weight: bold;
          margin: 5px 0;
        }

        .version {
          color: #666;
          font-size: 9px;
          margin-top: 5px;
        }

        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .bill-receipt {
            width: 80mm;
            padding: 5mm;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default BillReceipt;
