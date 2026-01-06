import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import FoodMenu from './FoodMenu';
import { 
  ArrowLeft, 
  Search, 
  ShoppingCart,
  CreditCard,
  Banknote,
  Minus,
  Plus,
  Trash2,
  Printer
} from 'lucide-react';

interface TableData {
  id: number;
  status: 'available' | 'occupied';
}

interface OrderItem {
  id: number;
  name: string;
  price: string | number;
  quantity: number;
  is_kot: boolean;
  is_bot: boolean;
  item_status: 'pending' | 'kot' | 'bot' | 'both';
  already_sent?: boolean;
  sent_quantity?: number;
  kot_sent?: boolean;
  bot_sent?: boolean;
  kot_sent_quantity?: number;
  bot_sent_quantity?: number;
}

interface MenuItem {
  id: number;
  name: string;
  price: string | number;
  category: string;
  sale_type: 'kot' | 'bot' | 'both';
}

interface Customer {
  id?: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  is_active?: boolean;
}

interface ServiceCharge {
  id: number;
  name: string;
  percentage: number;
  description: string | null;
  is_active: boolean;
}

const POSBilling: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showFoodMenu, setShowFoodMenu] = useState<boolean>(false);
  const [showBillModal, setShowBillModal] = useState<boolean>(false);
  const [generatedBill, setGeneratedBill] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'pickme' | 'uber' | 'partial'>('cash');
  const [discount, setDiscount] = useState<number>(0);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [additionalPayment, setAdditionalPayment] = useState<number>(0);
  const [payments, setPayments] = useState<Array<{ method: 'cash' | 'card' | 'pickme' | 'uber'; amount: number; reference?: string }>>([]);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'pickme' | 'uber'>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [cardReference, setCardReference] = useState<string>('');
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [customerFound, setCustomerFound] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [kitchenNote, setKitchenNote] = useState<string>('');
  const [serviceCharge, setServiceCharge] = useState<string>('');
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([]);
  const [orderId, setOrderId] = useState<string>('');
  const [isLiveBill, setIsLiveBill] = useState<boolean>(false);

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
  }>({ message: '', type: 'info', show: false });

  // Success modal state
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    orderId: string;
    message: string;
  }>({ show: false, orderId: '', message: '' });

  // Customer success modal state
  const [customerModal, setCustomerModal] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Success modal function
  const showSuccessModal = (orderId: string, message: string) => {
    setSuccessModal({ show: true, orderId, message });
  };

  const closeSuccessModal = () => {
    setSuccessModal({ show: false, orderId: '', message: '' });
  };

  // Customer modal functions
  const showCustomerModal = (message: string, type: 'success' | 'error' = 'success') => {
    setCustomerModal({ show: true, type, message });
  };

  const closeCustomerModal = () => {
    setCustomerModal({ show: false, type: 'success', message: '' });
  };

  // Debug effect to log orderItems changes
  useEffect(() => {
    console.log('Order items state updated:', orderItems);
  }, [orderItems]);

  // Load tables from backend on mount
  useEffect(() => {
    loadTablesStatus();
    loadServiceCharges();
  }, []);

  const loadTablesStatus = async () => {
    try {
      const response = await fetch('/api/tables');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTables(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadServiceCharges = async () => {
    try {
      const response = await fetch('/api/service-charges');
      if (response.ok) {
        const data = await response.json();
        // Filter only active service charges
        const activeCharges = data.filter((charge: ServiceCharge) => charge.is_active);
        setServiceCharges(activeCharges);
      }
    } catch (error) {
      console.error('Error loading service charges:', error);
    }
  };

  // Generate table data as state
  const [tables, setTables] = useState<TableData[]>(() => 
    Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      status: 'available'
    }))
  );

  const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const serviceChargeAmount = serviceCharge ? (Number(serviceCharge) * subtotal / 100) : 0;
  const total = subtotal + serviceChargeAmount + additionalPayment;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = total - totalPaid;

  const handleTableSelect = async (tableId: number) => {
    setSelectedTable(tableId);
    
    // Check if table has existing orders
    const table = tables.find(t => t.id === tableId);
    if (table && table.status === 'occupied') {
      await loadTableOrders(tableId);
    } else {
      // Clear order items for new table
      setOrderItems([]);
    }
  };

  const loadTableOrders = async (tableId: number) => {
    try {
      const response = await fetch(`/api/tables/${tableId}/orders`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.orders && data.orders.length > 0) {
          // Mark all loaded items with their sent quantities
          const loadedItems = data.orders.map((item: OrderItem) => ({
            ...item,
            already_sent: true,
            sent_quantity: item.quantity,
            kot_sent: item.is_kot,
            bot_sent: item.is_bot,
            kot_sent_quantity: item.is_kot ? item.quantity : 0,
            bot_sent_quantity: item.is_bot ? item.quantity : 0
          }));
          setOrderItems(loadedItems);
          showToast('Table orders loaded', 'info');
        }
      }
    } catch (error) {
      console.error('Error loading table orders:', error);
      showToast('Error loading table orders', 'error');
    }
  };

  const handleGoBack = () => {
    navigate('/cashier');
  };

  const handleLiveBill = () => {
    setIsLiveBill(!isLiveBill);
    // When entering Live Bill mode, clear selected table
    if (!isLiveBill) {
      setSelectedTable(0); // 0 means no table selected
      showToast('Live Bill mode activated - order will be processed as takeaway', 'info');
    } else {
      setSelectedTable(1); // Reset to default table when exiting
      showToast('Live Bill mode deactivated', 'info');
    }
  };

  // Payment handler functions
  const handleAddPayment = () => {
    if (paymentAmount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) + paymentAmount;
    // Only prevent exceeding for partial payments (not single cash payments)
    if (payments.length > 0 && totalPaid > total) {
      showToast('Total payment exceeds order amount', 'error');
      return;
    }

    // If there's already a payment, only allow Card and Cash for partial payments
    if (payments.length > 0 && selectedPaymentMethod !== 'cash' && selectedPaymentMethod !== 'card') {
      showToast('Only Card and Cash are allowed for partial payments', 'error');
      return;
    }

    // If adding a second payment method, validate that existing payment is Card or Cash
    if (payments.length > 0) {
      const hasNonCardCash = payments.some(p => p.method !== 'cash' && p.method !== 'card');
      if (hasNonCardCash) {
        showToast('Partial payments can only include Card and Cash', 'error');
        return;
      }
    }

    const newPayment = {
      method: selectedPaymentMethod,
      amount: paymentAmount,
      reference: cardReference || undefined,
    };

    setPayments([...payments, newPayment]);
    setPaymentAmount(0);
    setCardReference('');
    showToast(`${selectedPaymentMethod.toUpperCase()} payment added: ${paymentAmount.toFixed(2)} LKR`, 'success');
  };

  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
    showToast('Payment method removed', 'info');
  };

  const getTotalPaymentAmount = () => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  };

  const getPaymentMethodDisplay = () => {
    if (payments.length === 0) return 'No payment method selected';
    if (payments.length === 1) return payments[0].method;
    
    // Multiple payment methods - return 'partial'
    return 'partial';
  };

  const handlePaymentModal = () => {
    setShowPaymentModal(!showPaymentModal);
  };

  const handlePrintKOT = async () => {
    // Calculate new KOT items
    const newKOTItems: OrderItem[] = [];
    
    orderItems.forEach(item => {
      if (!item.is_kot) return;
      const kotSentQty = item.kot_sent_quantity || 0;
      const newQty = item.quantity - kotSentQty;
      
      if (newQty > 0) {
        newKOTItems.push({
          ...item,
          quantity: newQty
        });
      }
    });
    
    if (newKOTItems.length === 0) {
      showToast('No new items to send to KOT', 'error');
      return;
    }

    // Check stock availability before proceeding
    try {
      const stockCheckResponse = await fetch('/api/stock/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          items: newKOTItems.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity
          }))
        }),
      });

      const stockData = await stockCheckResponse.json();

      if (!stockData.has_stock) {
        // Build error message with better formatting
        let errorMsg = '🚫 Insufficient Stock for KOT!\n\nThe following items cannot be sent to kitchen:\n\n';
        stockData.insufficient_items.forEach((insufficientItem: any, index: number) => {
          errorMsg += `${index + 1}. ${insufficientItem.menu_item}\n`;
          errorMsg += `   Material: ${insufficientItem.material}\n`;
          errorMsg += `   Required: ${insufficientItem.needed} ${insufficientItem.unit}\n`;
          errorMsg += `   Available: ${insufficientItem.available} ${insufficientItem.unit}\n`;
          if (index < stockData.insufficient_items.length - 1) {
            errorMsg += '\n';
          }
        });
        
        errorMsg += '\n\n⚠️ Please adjust quantities before sending to kitchen.';
        showToast(errorMsg, 'error');
        return;
      }
    } catch (error) {
      console.error('Error checking stock:', error);
      showToast('Error checking stock availability', 'error');
      return;
    }

    try {
      const tableOrderData = {
        table_number: selectedTable,
        customer_id: customer.id || null,
        items: orderItems.map(item => ({
          menu_item_id: item.id,
          product_name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
          total_price: Number(item.price) * item.quantity,
          is_kot: item.is_kot,
          is_bot: item.is_bot,
          item_status: item.item_status
        })),
        subtotal: subtotal,
        service_charge_amount: serviceChargeAmount,
        service_charge: serviceCharge,
        total_amount: total,
        kitchen_note: kitchenNote
      };

      const response = await fetch('/api/table-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(tableOrderData),
      });

      const data = await response.json();

      if (data.success) {
        // Update KOT sent status
        setOrderItems(prev => prev.map(item => {
          if (item.is_kot) {
            return {
              ...item,
              kot_sent: true,
              kot_sent_quantity: item.quantity
            };
          }
          return item;
        }));
        
        showToast(`KOT saved to table: ${data.data.order_id}`, 'success');
        
        // Print KOT immediately with the new items we calculated
        printKOTDirect(newKOTItems, data.data.order_id);
        
        // Mark table as occupied
        setTables(prev => prev.map(table => 
          table.id === selectedTable 
            ? { ...table, status: 'occupied' }
            : table
        ));
      } else {
        showToast(data.message || 'Error saving order', 'error');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      showToast('Error saving order. Please try again.', 'error');
    }
  };

  const handlePrintBOT = async () => {
    // Calculate new BOT items
    const newBOTItems: OrderItem[] = [];
    
    orderItems.forEach(item => {
      if (!item.is_bot) return;
      const botSentQty = item.bot_sent_quantity || 0;
      const newQty = item.quantity - botSentQty;
      
      if (newQty > 0) {
        newBOTItems.push({
          ...item,
          quantity: newQty
        });
      }
    });
    
    if (newBOTItems.length === 0) {
      showToast('No new items to send to BOT', 'error');
      return;
    }

    // Check stock availability before proceeding
    try {
      const stockCheckResponse = await fetch('/api/stock/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          items: newBOTItems.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity
          }))
        }),
      });

      const stockData = await stockCheckResponse.json();

      if (!stockData.has_stock) {
        // Build error message with better formatting
        let errorMsg = '🚫 Insufficient Stock for BOT!\n\nThe following items cannot be sent to bar:\n\n';
        stockData.insufficient_items.forEach((insufficientItem: any, index: number) => {
          errorMsg += `${index + 1}. ${insufficientItem.menu_item}\n`;
          errorMsg += `   Material: ${insufficientItem.material}\n`;
          errorMsg += `   Required: ${insufficientItem.needed} ${insufficientItem.unit}\n`;
          errorMsg += `   Available: ${insufficientItem.available} ${insufficientItem.unit}\n`;
          if (index < stockData.insufficient_items.length - 1) {
            errorMsg += '\n';
          }
        });
        
        errorMsg += '\n\n⚠️ Please adjust quantities before sending to bar.';
        showToast(errorMsg, 'error');
        return;
      }
    } catch (error) {
      console.error('Error checking stock:', error);
      showToast('Error checking stock availability', 'error');
      return;
    }

    try {
      const tableOrderData = {
        table_number: selectedTable,
        customer_id: customer.id || null,
        items: orderItems.map(item => ({
          menu_item_id: item.id,
          product_name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
          total_price: Number(item.price) * item.quantity,
          is_kot: item.is_kot,
          is_bot: item.is_bot,
          item_status: item.item_status
        })),
        subtotal: subtotal,
        service_charge_amount: serviceChargeAmount,
        service_charge: serviceCharge,
        total_amount: total,
        kitchen_note: kitchenNote
      };

      const response = await fetch('/api/table-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(tableOrderData),
      });

      const data = await response.json();

      if (data.success) {
        // Update BOT sent status
        setOrderItems(prev => prev.map(item => {
          if (item.is_bot) {
            return {
              ...item,
              bot_sent: true,
              bot_sent_quantity: item.quantity
            };
          }
          return item;
        }));
        
        showToast(`BOT saved to table: ${data.data.order_id}`, 'success');
        
        // Print BOT immediately
        printBOTDirect(newBOTItems, data.data.order_id);
        
        // Mark table as occupied
        setTables(prev => prev.map(table => 
          table.id === selectedTable 
            ? { ...table, status: 'occupied' }
            : table
        ));
      } else {
        showToast(data.message || 'Error saving order', 'error');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      showToast('Error saving order. Please try again.', 'error');
    }
  };

  // Legacy functions for bill modal (kept for backward compatibility)
  const printKOTBill = () => {
    if (generatedBill && generatedBill.kot_items) {
      printKOTDirect(generatedBill.kot_items, generatedBill.order_id);
    }
  };

  const printBOTBill = () => {
    if (generatedBill && generatedBill.bot_items) {
      printBOTDirect(generatedBill.bot_items, generatedBill.order_id);
    }
  };

  const printKOTDirect = (kotItems: OrderItem[], orderId: string) => {
    if (kotItems.length === 0) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      
      printWindow.document.write(`
        <html>
          <head>
            <title>KOT Note</title>
            <style>
              @media print {
                @page { margin: 0; size: 80mm auto; }
                body { margin: 0; padding: 10mm; }
              }
              body { 
                font-family: Arial, sans-serif; 
                width: 80mm; 
                margin: 0 auto;
                padding: 5mm;
                font-size: 16px;
              }
              h2 { 
                text-align: center; 
                margin: 8px 0; 
                font-size: 22px;
                font-weight: bold;
              }
              .header-row { 
                display: flex; 
                justify-content: space-between; 
                margin: 5px 0;
                font-size: 14px;
              }
              .header-row strong {
                font-weight: bold;
              }
              .items { 
                margin-top: 15px; 
                border-top: 2px solid #000; 
                padding-top: 8px; 
              }
              .item-header { 
                display: flex; 
                justify-content: space-between; 
                font-weight: bold;
                padding: 8px 0;
                border-bottom: 2px solid #000;
                font-size: 16px;
              }
              .item { 
                display: flex; 
                justify-content: space-between; 
                padding: 8px 0; 
                border-bottom: 1px dotted #000;
                font-size: 15px;
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <h2>KOT Note - (${orderId.split('/')[1]})</h2>
            <div class="header-row">
              <span><strong>Date:</strong> ${currentDate}</span>
              <span><strong>Time:</strong> ${currentTime}</span>
            </div>
            <div class="header-row">
              <span><strong>Order:</strong> ${orderId}</span>
              <span><strong>Table:</strong> ${selectedTable}</span>
            </div>
            <div class="header-row">
              <span><strong>Type:</strong> Dine In</span>
            </div>
            <div class="items">
              <div class="item-header">
                <span>Product</span>
                <span>Qty</span>
              </div>
              ${kotItems.map(item => `
                <div class="item">
                  <span>${item.name}</span>
                  <span>${item.quantity}</span>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const printBOTDirect = (botItems: OrderItem[], orderId: string) => {
    if (botItems.length === 0) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      
      printWindow.document.write(`
        <html>
          <head>
            <title>BOT Note</title>
            <style>
              @media print {
                @page { margin: 0; size: 80mm auto; }
                body { margin: 0; padding: 10mm; }
              }
              body { 
                font-family: Arial, sans-serif; 
                width: 80mm; 
                margin: 0 auto;
                padding: 5mm;
                font-size: 16px;
              }
              h2 { 
                text-align: center; 
                margin: 8px 0; 
                font-size: 22px;
                font-weight: bold;
              }
              .header-row { 
                display: flex; 
                justify-content: space-between; 
                margin: 5px 0;
                font-size: 14px;
              }
              .header-row strong {
                font-weight: bold;
              }
              .items { 
                margin-top: 15px; 
                border-top: 2px solid #000; 
                padding-top: 8px; 
              }
              .item-header { 
                display: flex; 
                justify-content: space-between; 
                font-weight: bold;
                padding: 8px 0;
                border-bottom: 2px solid #000;
                font-size: 16px;
              }
              .item { 
                display: flex; 
                justify-content: space-between; 
                padding: 8px 0; 
                border-bottom: 1px dotted #000;
                font-size: 15px;
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <h2>BOT Note - (${orderId.split('/')[1]})</h2>
            <div class="header-row">
              <span><strong>Date:</strong> ${currentDate}</span>
              <span><strong>Time:</strong> ${currentTime}</span>
            </div>
            <div class="header-row">
              <span><strong>Order:</strong> ${orderId}</span>
              <span><strong>Table:</strong> ${selectedTable}</span>
            </div>
            <div class="header-row">
              <span><strong>Type:</strong> Dine In</span>
            </div>
            <div class="items">
              <div class="item-header">
                <span>Product</span>
                <span>Qty</span>
              </div>
              ${botItems.map(item => `
                <div class="item">
                  <span>${item.name}</span>
                  <span>${item.quantity}</span>
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const closeBillModal = () => {
    setShowBillModal(false);
    setGeneratedBill(null);
    // Refresh page to reset state
    window.location.reload();
  };

  const handleSearchCustomer = async () => {
    if (!customer.phone || customer.phone.length < 7) {
      alert('Please enter a valid phone number (7-15 digits)');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/customers/search-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ phone: customer.phone }),
      });

      const data = await response.json();
      
      if (data.success && data.found) {
        setCustomer({
          id: data.data.id,
          name: data.data.name,
          phone: data.data.phone,
          email: data.data.email || '',
          address: data.data.address || '',
          notes: data.data.notes || ''
        });
        setCustomerFound(true);
      } else {
        setCustomerFound(false);
        // Clear other fields but keep phone number
        setCustomer(prev => ({
          name: '',
          phone: prev.phone,
          email: '',
          address: '',
          notes: ''
        }));
        alert('Customer not found. You can enter new customer details.');
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      alert('Error searching customer. Please try again.');
    }
    setIsSearching(false);
  };

  const handleSaveCustomer = async () => {
    if (!customer.name || !customer.phone) {
      alert('Please fill in customer name and phone number.');
      return;
    }

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          notes: customer.notes
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCustomer({
          id: data.data.id,
          name: data.data.name,
          phone: data.data.phone,
          email: data.data.email || '',
          address: data.data.address || '',
          notes: data.data.notes || ''
        });
        setCustomerFound(true);
        showCustomerModal('Customer saved successfully!');
      } else {
        showCustomerModal(data.message || 'Error saving customer.', 'error');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      showCustomerModal('Error saving customer. Please try again.', 'error');
    }
  };

  const handleAddItem = (menuItem: MenuItem) => {
    console.log('Adding item to order:', menuItem);
    
    const existingItem = orderItems.find(item => item.id === menuItem.id);
    
    if (existingItem) {
      setOrderItems(prev => {
        const updatedItems = prev.map(item => 
          item.id === menuItem.id 
            ? {...item, quantity: item.quantity + 1}
            : item
        );
        console.log('Updated order items (existing):', updatedItems);
        return updatedItems;
      });
    } else {
      // Automatically set KOT/BOT based on menu item's sale_type
      const is_kot = menuItem.sale_type === 'kot' || menuItem.sale_type === 'both';
      const is_bot = menuItem.sale_type === 'bot' || menuItem.sale_type === 'both';
      const item_status = menuItem.sale_type === 'both' ? 'both' : menuItem.sale_type;
      
      setOrderItems(prev => {
        const newOrderItems = [...prev, {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          is_kot: is_kot,
          is_bot: is_bot,
          item_status: item_status as 'pending' | 'kot' | 'bot' | 'both',
          already_sent: false,
          sent_quantity: 0,
          kot_sent: false,
          bot_sent: false,
          kot_sent_quantity: 0,
          bot_sent_quantity: 0
        }];
        console.log('Updated order items (new):', newOrderItems);
        return newOrderItems;
      });
    }
    
    // Close the food menu modal after adding item
    setShowFoodMenu(false);
  };

  // KOT/BOT status is now automatically set based on menu item's sale_type

  const isCustomerDetailsValid = () => {
    return customer.name.trim() !== '' && customer.phone.trim() !== '';
  };

  const handleCreateSale = async (status: 'pending' | 'kot' | 'bot' | 'completed') => {
    if (orderItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    // Validate customer details
    if (!isCustomerDetailsValid()) {
      alert('Please enter customer name and phone number before confirming the order.');
      return;
    }

    // KOT/BOT is now automatically set based on menu item's sale_type

    try {
      const saleData = {
        customer_id: customer.id || null,
        table_number: selectedTable,
        items: orderItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          is_kot: item.is_kot,
          is_bot: item.is_bot,
          item_status: item.item_status
        })),
        subtotal: subtotal,
        service_charge: serviceChargeAmount,
        total_amount: total,
        cash_amount: cashAmount,
        additional_payment: additionalPayment,
        payment_method: paymentMethod,
        kitchen_note: kitchenNote,
        status: 'completed',
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(saleData),
      });

      const data = await response.json();

      if (data.success) {
        setOrderId(data.data.order_id);
        showSuccessModal(data.data.order_id, `Order ${data.data.order_id} confirmed successfully!`);
        
        // Clear the order after successful creation and reset table status
        setOrderItems([]);
        setCashAmount(0);
        setTables(prev => prev.map(table => 
          table.id === selectedTable 
            ? { ...table, status: 'available' }
            : table
        ));
        setAdditionalPayment(0);
        setKitchenNote('');
        setCustomer({
          name: '',
          phone: '',
          email: '',
          address: '',
          notes: ''
        });
        setCustomerFound(false);
      } else {
        alert(data.message || 'Error creating order');
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error creating order. Please try again.');
    }
  };

  const handleConfirmOrder = async () => {
    if (orderItems.length === 0) {
      showToast('Please add items before confirming order', 'error');
      return;
    }

    if (payments.length === 0) {
      showToast('Please add at least one payment method', 'error');
      return;
    }

    const totalPaid = getTotalPaymentAmount();
    if (totalPaid < total) {
      showToast(`Insufficient payment. Total: ${total.toFixed(2)} LKR, Paid: ${totalPaid.toFixed(2)} LKR`, 'error');
      return;
    }

    // Check stock availability before confirming order
    try {
      const stockCheckResponse = await fetch('/api/stock/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          items: orderItems.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity
          }))
        }),
      });

      const stockData = await stockCheckResponse.json();

      if (!stockData.has_stock) {
        // Build detailed error message with better formatting
        let errorMsg = '🚫 Insufficient Stock!\n\nThe following items do not have enough stock:\n\n';
        if (stockData.insufficient_items && stockData.insufficient_items.length > 0) {
          stockData.insufficient_items.forEach((insufficientItem: any, index: number) => {
            errorMsg += `${index + 1}. ${insufficientItem.menu_item}\n`;
            errorMsg += `   Material: ${insufficientItem.material}\n`;
            errorMsg += `   Required: ${insufficientItem.needed} ${insufficientItem.unit}\n`;
            errorMsg += `   Available: ${insufficientItem.available} ${insufficientItem.unit}\n`;
            if (index < stockData.insufficient_items.length - 1) {
              errorMsg += '\n';
            }
          });
        } else {
          errorMsg += 'Some items in your order do not have sufficient stock.';
        }
        
        errorMsg += '\n\n⚠️ Please adjust quantities or remove items to proceed with the order.';
        showToast(errorMsg, 'error');
        return;
      }
    } catch (error) {
      console.error('Error checking stock:', error);
      showToast('Error checking stock availability. Please try again.', 'error');
      return;
    }

    try {
      // Create sale from current order (not from table_orders)
      const saleData = {
        table_id: isLiveBill ? null : selectedTable,
        table_number: isLiveBill ? null : selectedTable,
        order_type: isLiveBill ? 'live_bill' : 'table',
        customer_id: customer.id || null,
        items: orderItems.map(item => ({
          menu_item_id: item.id,
          product_name: item.name,
          unit_price: item.price,
          quantity: item.quantity,
          total_price: Number(item.price) * item.quantity,
          is_kot: item.is_kot,
          is_bot: item.is_bot,
          item_status: item.item_status
        })),
        subtotal: subtotal,
        service_charge_amount: serviceChargeAmount,
        service_charge: serviceCharge,
        total_amount: total,
        status: 'completed',
        payment_method: getPaymentMethodDisplay(),
        cash_amount: payments.find(p => p.method === 'cash')?.amount || 0,
        card_amount: payments.find(p => p.method === 'card')?.amount || 0,
        pickme_amount: payments.find(p => p.method === 'pickme')?.amount || 0,
        uber_amount: payments.find(p => p.method === 'uber')?.amount || 0,
        additional_payment: additionalPayment,
        kitchen_note: kitchenNote
      };

      const createResponse = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(saleData),
      });

      const createData = await createResponse.json();

      if (!createData.success) {
        showToast(createData.message || 'Error confirming order', 'error');
        return;
      }

      const saleId = createData.data.id;

      // Print the bill with cash and balance details
      try {
        const billResponse = await fetch(`/api/sales/${saleId}/bill`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        const billResult = await billResponse.json();

        if (billResult.success && billResult.data) {
          // Add payment amounts and balance to bill data
          const confirmBillData = {
            ...billResult.data,
            cash_amount: payments.find(p => p.method === 'cash')?.amount || 0,
            card_amount: payments.find(p => p.method === 'card')?.amount || 0,
            pickme_amount: payments.find(p => p.method === 'pickme')?.amount || 0,
            uber_amount: payments.find(p => p.method === 'uber')?.amount || 0,
            balance: balance
          };
          printConfirmOrderBill(confirmBillData);
        }
      } catch (error) {
        console.error('Error printing bill:', error);
      }

      // Close the table order (only for table orders, not live bills)
      if (!isLiveBill && selectedTable > 0) {
        try {
          const closeResponse = await fetch(`/api/table-orders/${selectedTable}/close`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
          });

          if (closeResponse.ok) {
            // Reload tables status from API to ensure correct status
            await loadTablesStatus();
          }
        } catch (error) {
          console.error('Error closing table:', error);
        }
      }

      // Show success message
      const successMsg = isLiveBill 
        ? 'Live Bill order confirmed and bill printed successfully!' 
        : 'Order confirmed and bill printed successfully! Table closed.';
      showToast(successMsg, 'success');

      // Clear the order and reset table selection
      setOrderItems([]);
      setCashAmount(0);
      setAdditionalPayment(0);
      setKitchenNote('');
      setServiceCharge('');
      setPayments([]);
      setPaymentMethod('cash');
      setPaymentAmount(0);
      setCardReference('');
      setCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
      setCustomerFound(false);
      setGeneratedBill(null);
      setSelectedTable(1); // Reset to default table or no selection
      setIsLiveBill(false); // Reset Live Bill mode

    } catch (error) {
      console.error('Error confirming order:', error);
      showToast('Error confirming order. Please try again.', 'error');
    }
  };

  const handlePrintBill = async () => {
    // Check if there are items to print
    if (orderItems.length === 0) {
      showToast('Please add items before printing bill', 'error');
      return;
    }

    try {
      // Fetch company information
      const companyResponse = await fetch('/api/company', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      const companyData = await companyResponse.json();
      const companyInfo = companyData.success ? companyData.data : null;

      // Build bill data from current order items for printing (no DB updates)
      const currentDate = new Date();
      const billData = {
        company: {
          name: companyInfo?.name || 'Coffee Shop',
          address: companyInfo?.address || '',
          phone: companyInfo?.phone || '',
          email: companyInfo?.email || ''
        },
        order_no: generatedBill?.order_id || 'TEMP-' + Date.now(),
        date: currentDate.toLocaleDateString(),
        time: currentDate.toLocaleTimeString(),
        table_number: selectedTable,
        cashier: '',
        order_type: 'Dine In',
        items: orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          price: item.price,
          total: Number(item.price) * item.quantity,
          discount_percentage: 0
        })),
        subtotal: subtotal,
        discount: 0,
        total_discount: 0,
        service_charge: serviceChargeAmount,
        service_charge_percentage: parseFloat(serviceCharge || '0'),
        additional_payment: additionalPayment,
        total: total,
        payment_method: 'Pending',
        customer: customer.name ? {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address
        } : null
      };

      printBillReceipt(billData);
      showToast('Bill printed successfully', 'success');
    } catch (error) {
      console.error('Error printing bill:', error);
      showToast('Error printing bill. Please try again.', 'error');
    }
  };

  const printBillReceipt = (billData: any) => {
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bill - ${billData.order_no}</title>
            <meta charset="utf-8">
            <style>
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

              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }

              .bill-receipt {
                width: 80mm;
                font-family: Arial, sans-serif;
                background: white;
                padding: 10mm;
                margin: 0 auto;
                color: #000;
              }

              .receipt-header {
                text-align: center;
                margin-bottom: 15px;
                border-bottom: 3px solid #000;
                padding-bottom: 10px;
              }

              .restaurant-name {
                font-size: 42px;
                font-weight: 900;
                letter-spacing: 10px;
                margin: 0;
                font-family: Arial, sans-serif;
                color: #000;
              }

              .bill-info {
                margin-bottom: 10px;
                font-size: 14px;
                color: #000;
                font-weight: 600;
              }

              .info-row {
                display: grid;
                grid-template-columns: auto 1fr auto 1fr;
                gap: 5px;
                margin-bottom: 5px;
              }

              .label {
                font-weight: bold;
                color: #000;
              }

              .value {
                text-align: left;
                color: #000;
              }

              .order-type {
                text-align: center;
                border: 3px solid #000;
                padding: 8px;
                margin: 10px 0;
                font-weight: bold;
                font-size: 16px;
                color: #000;
              }

              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
                font-size: 15px;
                color: #000;
              }

              .items-table thead {
                border-bottom: 3px solid #000;
                border-top: 3px solid #000;
              }

              .items-table th {
                padding: 8px 5px;
                font-weight: bold;
                text-align: left;
                color: #000;
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
                border-top: 3px solid #000;
                padding-top: 10px;
                font-size: 16px;
                color: #000;
                font-weight: 600;
              }

              .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 0 5px;
                color: #000;
              }

              .grand-total {
                font-weight: bold;
                font-size: 20px;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 3px solid #000;
                color: #000;
              }

              .total-discount-box {
                border: 3px solid #000;
                padding: 10px;
                margin: 15px 0;
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                font-size: 16px;
                color: #000;
              }

              .receipt-footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 3px solid #000;
                font-size: 13px;
                color: #000;
              }

              .thank-you {
                font-weight: bold;
                font-size: 16px;
                margin: 10px 0;
                color: #000;
              }

              .tagline {
                font-style: italic;
                margin: 5px 0;
                font-size: 12px;
                color: #000;
              }

              .powered-by {
                font-weight: bold;
                margin: 5px 0;
                font-size: 13px;
                color: #000;
              }

              .version {
                color: #000;
                font-size: 12px;
                margin-top: 5px;
              }
            </style>
          </head>
          <body onload="window.print();">
            <div class="bill-receipt">
              <!-- Header with Logo/Name -->
              <div class="receipt-header">
                <h1 class="restaurant-name">${billData.company.name}</h1>
              </div>

              <!-- Bill Details -->
              <div class="bill-info">
                <div class="info-row">
                  <span class="label">Date:</span>
                  <span class="value">${billData.date}</span>
                  <span class="label">Order No:</span>
                  <span class="value">${billData.order_no}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Table:</span>
                  <span class="value">${billData.table_number}</span>
                  <span class="label">Cashier:</span>
                  <span class="value">${billData.cashier || ''}</span>
                </div>
              </div>

              <!-- Order Type -->
              <div class="order-type">
                <span>Order Type: ${billData.order_type}</span>
              </div>

              <!-- Items Table -->
              <table class="items-table">
                <thead>
                  <tr>
                    <th class="item-name">Items</th>
                    <th class="item-qty">Qty</th>
                    <th class="item-price">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${billData.items.map((item: any) => `
                    <tr class="item-row">
                      <td class="item-name">
                        ${item.name}
                        ${item.discount_percentage && item.discount_percentage > 0 ? `
                          <div class="item-discount">
                            (${item.unit_price.toFixed(2)} LKR - ${item.discount_percentage}% off)
                          </div>
                        ` : ''}
                      </td>
                      <td class="item-qty">${item.quantity}</td>
                      <td class="item-price">${item.total.toFixed(2)} LKR</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- Totals Section -->
              <div class="totals-section">
                <div class="total-row">
                  <span>Sub Total</span>
                  <span>${billData.subtotal.toFixed(2)} LKR</span>
                </div>
                
                ${billData.discount > 0 ? `
                  <div class="total-row">
                    <span>Discount</span>
                    <span>(${billData.discount.toFixed(2)}) LKR</span>
                  </div>
                ` : ''}
                
                ${billData.service_charge > 0 ? `
                  <div class="total-row">
                    <span>Service Charge (${billData.service_charge_percentage.toFixed(2)}%)</span>
                    <span>${billData.service_charge.toFixed(2)} LKR</span>
                  </div>
                ` : ''}
                
                ${billData.additional_payment > 0 ? `
                  <div class="total-row">
                    <span>Additional Payment</span>
                    <span>${billData.additional_payment.toFixed(2)} LKR</span>
                  </div>
                ` : ''}
                
                <div class="total-row grand-total">
                  <span>Total</span>
                  <span>${billData.total.toFixed(2)} LKR</span>
                </div>

                ${billData.total_discount > 0 ? `
                  <div class="total-discount-box">
                    <span>TOTAL DISCOUNT</span>
                    <span>${billData.total_discount.toFixed(2)} LKR</span>
                  </div>
                ` : ''}
              </div>

              <!-- Footer -->
              <div class="receipt-footer">
                <p class="thank-you">THANK YOU COME AGAIN</p>
                <p class="tagline">Let the quality define its own standards</p>
                <p class="powered-by">Powered by JAAN Network Ltd</p>
                <p class="version">10.12.06</p>
              </div>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    }
  };

  const printConfirmOrderBill = (billData: any) => {
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Bill - ${billData.order_no}</title>
            <meta charset="utf-8">
            <style>
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

              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }

              .bill-receipt {
                width: 80mm;
                font-family: Arial, sans-serif;
                background: white;
                padding: 10mm;
                margin: 0 auto;
                color: #000;
              }

              .receipt-header {
                text-align: center;
                margin-bottom: 15px;
                border-bottom: 3px solid #000;
                padding-bottom: 10px;
              }

              .restaurant-name {
                font-size: 42px;
                font-weight: 900;
                letter-spacing: 10px;
                margin: 0;
                font-family: Arial, sans-serif;
                color: #000;
              }

              .bill-info {
                margin-bottom: 10px;
                font-size: 14px;
                color: #000;
                font-weight: 600;
              }

              .info-row {
                display: grid;
                grid-template-columns: auto 1fr auto 1fr;
                gap: 5px;
                margin-bottom: 5px;
              }

              .label {
                font-weight: bold;
                color: #000;
              }

              .value {
                text-align: left;
                color: #000;
              }

              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
                font-size: 15px;
                color: #000;
              }

              .items-table thead {
                border-bottom: 3px solid #000;
                border-top: 3px solid #000;
              }

              .items-table th {
                padding: 8px 5px;
                font-weight: bold;
                text-align: left;
                color: #000;
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
                border-top: 3px solid #000;
                padding-top: 10px;
                font-size: 16px;
                color: #000;
                font-weight: 600;
              }

              .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 0 5px;
                color: #000;
              }

              .grand-total {
                font-weight: bold;
                font-size: 20px;
                margin-top: 10px;
                padding-top: 10px;
                border-top: 3px solid #000;
                color: #000;
              }

              .payment-info {
                border: 3px solid #000;
                padding: 10px;
                margin: 15px 0;
                font-size: 16px;
                color: #000;
                font-weight: 600;
              }

              .total-discount-box {
                border: 3px solid #000;
                padding: 10px;
                margin: 15px 0;
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                font-size: 16px;
                color: #000;
              }

              .receipt-footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 3px solid #000;
                font-size: 13px;
                color: #000;
              }

              .thank-you {
                font-weight: bold;
                font-size: 16px;
                margin: 10px 0;
                color: #000;
              }

              .tagline {
                font-style: italic;
                margin: 5px 0;
                font-size: 12px;
                color: #000;
              }

              .powered-by {
                font-weight: bold;
                margin: 5px 0;
                font-size: 13px;
                color: #000;
              }

              .version {
                color: #000;
                font-size: 12px;
                margin-top: 5px;
              }
            </style>
          </head>
          <body onload="window.print();">
            <div class="bill-receipt">
              <!-- Header with Logo/Name -->
              <div class="receipt-header">
                <h1 class="restaurant-name">${billData.company.name}</h1>
              </div>

              <!-- Bill Details -->
              <div class="bill-info">
                <div class="info-row">
                  <span class="label">Date:</span>
                  <span class="value">${billData.date}</span>
                  <span class="label">Order No:</span>
                  <span class="value">${billData.order_no}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Table:</span>
                  <span class="value">${billData.table_number}</span>
                  <span class="label">Cashier:</span>
                  <span class="value">${billData.cashier || ''}</span>
                </div>
              </div>

              <!-- Items Table -->
              <table class="items-table">
                <thead>
                  <tr>
                    <th class="item-name">Items</th>
                    <th class="item-qty">Qty</th>
                    <th class="item-price">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${billData.items.map((item: any) => `
                    <tr class="item-row">
                      <td class="item-name">
                        ${item.name}
                        ${item.discount_percentage && item.discount_percentage > 0 ? `
                          <div class="item-discount">
                            (${item.unit_price.toFixed(2)} LKR - ${item.discount_percentage}% off)
                          </div>
                        ` : ''}
                      </td>
                      <td class="item-qty">${item.quantity}</td>
                      <td class="item-price">${item.total.toFixed(2)} LKR</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- Totals Section -->
              <div class="totals-section">
                <div class="total-row">
                  <span>Sub Total</span>
                  <span>${billData.subtotal.toFixed(2)} LKR</span>
                </div>
                
                ${billData.discount > 0 ? `
                  <div class="total-row">
                    <span>Discount</span>
                    <span>(${billData.discount.toFixed(2)}) LKR</span>
                  </div>
                ` : ''}
                
                ${billData.service_charge > 0 ? `
                  <div class="total-row">
                    <span>Service Charge (${billData.service_charge_percentage.toFixed(2)}%)</span>
                    <span>${billData.service_charge.toFixed(2)} LKR</span>
                  </div>
                ` : ''}
                
                ${billData.additional_payment > 0 ? `
                  <div class="total-row">
                    <span>Additional Payment</span>
                    <span>${billData.additional_payment.toFixed(2)} LKR</span>
                  </div>
                ` : ''}
                
                <div class="total-row grand-total">
                  <span>Total</span>
                  <span>${billData.total.toFixed(2)} LKR</span>
                </div>

                ${billData.total_discount > 0 ? `
                  <div class="total-discount-box">
                    <span>TOTAL DISCOUNT</span>
                    <span>${billData.total_discount.toFixed(2)} LKR</span>
                  </div>
                ` : ''}
              </div>

              <!-- Payment Info -->
              <div class="payment-info">
                ${billData.cash_amount && billData.cash_amount > 0 ? `
                  <div class="total-row">
                    <span>Cash</span>
                    <span>${(billData.cash_amount || 0).toFixed(2)} LKR</span>
                  </div>
                ` : ''}
                ${billData.card_amount && billData.card_amount > 0 ? `
                  <div class="total-row">
                    <span>Card</span>
                    <span>${(billData.card_amount || 0).toFixed(2)} LKR</span>
                  </div>
                ` : ''}
                ${billData.pickme_amount && billData.pickme_amount > 0 ? `
                  <div class="total-row">
                    <span>PickMe</span>
                    <span>${(billData.pickme_amount || 0).toFixed(2)} LKR</span>
                  </div>
                ` : ''}
                ${billData.uber_amount && billData.uber_amount > 0 ? `
                  <div class="total-row">
                    <span>Uber</span>
                    <span>${(billData.uber_amount || 0).toFixed(2)} LKR</span>
                  </div>
                ` : ''}
                <div class="total-row" style="font-weight: bold; font-size: 18px;">
                  <span>Balance</span>
                  <span>${(billData.balance || 0).toFixed(2)} LKR</span>
                </div>
              </div>

              <!-- Footer -->
              <div class="receipt-footer">
                <p class="thank-you">THANK YOU COME AGAIN</p>
                <p class="tagline">Let the quality define its own standards</p>
                <p class="powered-by">Powered by JAAN Network Ltd</p>
                <p class="version">10.12.06</p>
              </div>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    }
  };

  return (
    <DashboardLayout title="POS Billing">
      <div className="min-h-screen bg-white p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-black hover:text-amber-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
              <span className="text-xl font-bold">POS</span>
            </button>
          </div>
          <div className="text-black">
            <span className="text-lg">Order ID: {orderId || '#CS/XXXX'}</span>
          
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left Side - Tables */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-black mb-4">Tables</h2>
              
              {/* Live Bill Button */}
              <button 
                onClick={handleLiveBill}
                className={`w-full font-semibold py-3 px-4 rounded-lg mb-6 transition-colors ${
                  isLiveBill 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isLiveBill ? '✓ Live Bill Mode Active' : 'Live Bill'}
              </button>

              {/* Live Bill Mode Message */}
              {isLiveBill && (
                <div className="mb-6 bg-green-50 border border-green-300 rounded-lg p-4">
                  <p className="text-green-800 font-semibold text-center">📋 Live Bill / Takeaway Mode</p>
                  <p className="text-green-700 text-sm text-center mt-1">No table selection needed. Add items and confirm order directly.</p>
                </div>
              )}

              {/* Tables Grid */}
              {!isLiveBill && (
              <div className="grid grid-cols-5 gap-3 mb-8">
                {tables.map((table) => (
                  <div key={table.id} className="relative">
                    <div
                      className={`
                        w-full rounded-lg border-2 transition-all duration-200 relative p-3
                        ${selectedTable === table.id 
                          ? 'border-orange-500 bg-orange-100' 
                          : table.status === 'occupied'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 bg-white hover:border-gray-400 shadow-sm'
                        }
                      `}
                    >
                      {/* Table Header */}
                      <button
                        onClick={() => handleTableSelect(table.id)}
                        className="w-full flex flex-col items-center justify-center py-2"
                      >
                        <span className="text-black font-bold text-sm">Table</span>
                        <span className="text-black font-bold text-xl">{table.id}</span>
                      </button>
                      
                      {/* Generate Bill Button - Show inside card for selected table with items */}
                      {selectedTable === table.id && orderItems.length > 0 && (
                        <div className="w-full mt-2 flex flex-col gap-1">
                          {/* KOT Button - Show if there are KOT items that haven't been sent */}
                          {(() => {
                            const hasKOTItems = orderItems.some(item => item.is_kot);
                            const hasNewKOTItems = orderItems.some(item => 
                              item.is_kot && (item.quantity > (item.kot_sent_quantity || 0))
                            );
                            const allKOTSent = orderItems.every(item => 
                              !item.is_kot || item.kot_sent
                            );
                            
                            if (hasKOTItems && hasNewKOTItems) {
                              return (
                                <button
                                  onClick={handlePrintKOT}
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 px-2 rounded-md transition-colors shadow-md"
                                >
                                  KOT
                                </button>
                              );
                            }
                            return null;
                          })()}
                          
                          {/* BOT Button - Show if there are BOT items that haven't been sent */}
                          {(() => {
                            const hasBOTItems = orderItems.some(item => item.is_bot);
                            const hasNewBOTItems = orderItems.some(item => 
                              item.is_bot && (item.quantity > (item.bot_sent_quantity || 0))
                            );
                            const allBOTSent = orderItems.every(item => 
                              !item.is_bot || item.bot_sent
                            );
                            
                            if (hasBOTItems && hasNewBOTItems) {
                              return (
                                <button
                                  onClick={handlePrintBOT}
                                  className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 px-2 rounded-md transition-colors shadow-md"
                                >
                                  BOT
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>

            {/* Customer Details Section */}
            <div className="bg-gray-100 rounded-xl p-6 mt-6 border border-gray-200">
              <h3 className="text-black text-xl font-bold mb-4">Customer Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-black text-sm font-medium mb-2 block">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Enter Customer Name"
                    value={customer.name}
                    onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    className="w-full bg-white border border-gray-300 text-black placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-black text-sm font-medium mb-2 block">Contact Number</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter Customer Contact Number"
                      value={customer.phone}
                      onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                      className="flex-1 bg-white border border-gray-300 text-black placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={handleSearchCustomer}
                      disabled={isSearching}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-3 rounded-lg transition-colors"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs mt-1">Enter 7-15 digits (no spaces)</p>
                  {customerFound && (
                    <p className="text-green-600 text-xs mt-1">✓ Customer found in database</p>
                  )}
                </div>

                <div>
                  <label className="text-black text-sm font-medium mb-2 block">Email</label>
                  <input
                    type="email"
                    placeholder="Enter Customer Email"
                    value={customer.email}
                    onChange={(e) => setCustomer({...customer, email: e.target.value})}
                    className="w-full bg-white border border-gray-300 text-black placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-black text-sm font-medium mb-2 block">Address</label>
                  <textarea
                    placeholder="Enter Customer Address"
                    value={customer.address}
                    onChange={(e) => setCustomer({...customer, address: e.target.value})}
                    className="w-full bg-white border border-gray-300 text-black placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="text-black text-sm font-medium mb-2 block">Notes</label>
                  <textarea
                    placeholder="Enter Customer Notes"
                    value={customer.notes}
                    onChange={(e) => setCustomer({...customer, notes: e.target.value})}
                    className="w-full bg-white border border-gray-300 text-black placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 h-20 resize-none"
                  />
                </div>

                {!customerFound && customer.phone && customer.name && (
                  <div>
                    <button 
                      onClick={handleSaveCustomer}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                      Save New Customer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Order Details */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg">
            {/* Table Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-black">Table {selectedTable}</h2>
               
              </div>
              <button 
                onClick={() => setShowFoodMenu(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <span>Food Menu</span>
                <div className="flex flex-col">
                  <div className="w-3 h-0.5 bg-white mb-0.5"></div>
                  <div className="w-3 h-0.5 bg-white mb-0.5"></div>
                  <div className="w-3 h-0.5 bg-white"></div>
                </div>
              </button>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              {orderItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-red-400 text-lg">No Products to show</p>
                  <p className="text-gray-500 text-sm mt-2">Click "Food Menu" to add items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-semibold text-black">Order Items - Table {selectedTable}</h4>
                    <div className="text-xs text-gray-600">
                      Station automatically assigned
                    </div>
                  </div>
                  {orderItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                      {/* Item Details Row */}
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h5 className="text-black font-medium">{item.name}</h5>
                          <p className="text-gray-600 text-sm">{Number(item.price).toFixed(2)} LKR each</p>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                setOrderItems(prev => prev.map(i => 
                                  i.id === item.id ? {...i, quantity: i.quantity - 1} : i
                                ));
                              } else {
                                setOrderItems(prev => prev.filter(i => i.id !== item.id));
                              }
                            }}
                            className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-black font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => {
                              setOrderItems(prev => prev.map(i => {
                                if (i.id === item.id) {
                                  const newQty = i.quantity + 1;
                                  return {
                                    ...i,
                                    quantity: newQty,
                                    // Reset sent status if quantity increased beyond sent quantity
                                    kot_sent: i.is_kot && newQty > (i.kot_sent_quantity || 0) ? false : i.kot_sent,
                                    bot_sent: i.is_bot && newQty > (i.bot_sent_quantity || 0) ? false : i.bot_sent
                                  };
                                }
                                return i;
                              }));
                            }}
                            className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Total Price */}
                        <div className="text-right ml-4">
                          <p className="text-black font-semibold">{(Number(item.price) * item.quantity).toFixed(2)} LKR</p>
                          <button
                            onClick={() => {
                              setOrderItems(prev => prev.filter(i => i.id !== item.id));
                            }}
                            className="text-red-500 hover:text-red-700 text-xs mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      
                      {/* Station Display Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 font-medium">Station:</span>
                          
                          {/* KOT Badge */}
                          {item.is_kot && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500 text-white">
                              ✓ KOT
                            </span>
                          )}
                          
                          {/* BOT Badge */}
                          {item.is_bot && (
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-500 text-white">
                              ✓ BOT
                            </span>
                          )}
                        </div>
                        
                        {/* Status Badge */}
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.item_status === 'both' ? 'bg-purple-100 text-purple-700' :
                            item.item_status === 'kot' ? 'bg-green-100 text-green-700' :
                            item.item_status === 'bot' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {item.item_status === 'both' ? 'KOT + BOT' : 
                             item.item_status === 'kot' ? 'Kitchen' :
                             item.item_status === 'bot' ? 'Bar' :
                             'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Sub Total</span>
                <span className="text-black">{subtotal.toFixed(2)} LKR</span>
              </div>

              <div className="border-t border-gray-300 pt-4">
                <select
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 mb-4"
                >
                  <option value="">Select Service Charge</option>
                  {serviceCharges.map((charge) => (
                    <option key={charge.id} value={charge.percentage.toString()}>
                      {charge.name} - {charge.percentage}%
                    </option>
                  ))}
                </select>

                {serviceChargeAmount > 0 && (
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-700">Service Charge ({serviceCharge}%)</span>
                    <span className="text-black">{serviceChargeAmount.toFixed(2)} LKR</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-gray-700">Additional Payment</span>
                  <input
                    type="number"
                    value={additionalPayment}
                    onChange={(e) => setAdditionalPayment(Number(e.target.value))}
                    className="flex-1 bg-white border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-center"
                    placeholder="0.00"
                  />
                  <span className="text-black">LKR</span>
                </div>

                {/* Payment Methods Section */}
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-black font-bold text-lg">Payment Methods</h3>
                    <button
                      onClick={handlePaymentModal}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      + Add Payment
                    </button>
                  </div>

                  {/* Payment Modal */}
                  {showPaymentModal && (
                    <div className="mb-4 bg-white border border-blue-300 rounded-lg p-4">
                      <h4 className="text-black font-semibold mb-3">Add Payment Method</h4>
                      
                      <div className="mb-4">
                        <label className="text-black text-sm font-medium mb-2 block">Payment Method</label>
                        <select
                          value={selectedPaymentMethod}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value as 'cash' | 'card' | 'pickme' | 'uber')}
                          className="w-full bg-white border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          {payments.length === 0 && (
                            <>
                              <option value="pickme">PickMe</option>
                              <option value="uber">Uber Eats</option>
                            </>
                          )}
                        </select>
                        {payments.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">Only Card and Cash are allowed for partial payments</p>
                        )}
                      </div>

                      <div className="mb-4">
                        <label className="text-black text-sm font-medium mb-2 block">Amount</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                            className="flex-1 bg-white border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-center"
                            placeholder="0.00"
                            step="0.01"
                          />
                          <span className="text-black font-semibold">LKR</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddPayment}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={handlePaymentModal}
                          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment List */}
                  {payments.length > 0 && (
                    <div className="space-y-2">
                      {payments.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between bg-white border border-blue-200 rounded-lg p-3">
                          <div className="flex-1">
                            <p className="text-black font-semibold capitalize">{payment.method}</p>
                            <p className="text-gray-600 text-sm">{payment.amount.toFixed(2)} LKR</p>
                            {payment.reference && <p className="text-gray-500 text-xs">{payment.reference}</p>}
                          </div>
                          <button
                            onClick={() => handleRemovePayment(index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <div className="flex justify-between items-center bg-blue-100 border border-blue-300 rounded-lg p-3 mt-3">
                        <span className="text-black font-bold">Total Paid:</span>
                        <span className="text-black font-bold text-lg">{getTotalPaymentAmount().toFixed(2)} LKR</span>
                      </div>
                    </div>
                  )}

                  {payments.length === 0 && (
                    <p className="text-center text-gray-600 text-sm">No payment method added yet</p>
                  )}
                </div>

                

                <div className="flex justify-between items-center text-xl font-bold mb-4 border-t border-gray-300 pt-4">
                  <span className="text-black">Total</span>
                  <span className="text-black">{total.toFixed(2)} LKR</span>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-700">Balance</span>
                  <span className={`text-lg font-bold ${
                    balance === 0 ? 'text-green-600' : balance < 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {balance < 0 ? `Change: ${Math.abs(balance).toFixed(2)} LKR` : `${balance.toFixed(2)} LKR`}
                  </span>
                </div>
              </div>
            </div>

            {/* Kitchen Note */}
            <div className="mb-6">
              <textarea
                placeholder="Kitchen Note"
                value={kitchenNote}
                onChange={(e) => setKitchenNote(e.target.value)}
                className="w-full bg-white border border-gray-300 text-black placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 h-20 resize-none"
              />
            </div>

            {/* Print Bill Button */}
            <button 
              onClick={handlePrintBill}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg mb-4 flex items-center justify-center space-x-2 transition-colors"
            >
              <Printer className="w-5 h-5" />
              <span>Print Bill</span>
            </button>

            {/* Workflow Status */}
            {orderItems.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Table {selectedTable} - Order Summary</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Items for Kitchen (KOT):</span>
                    <span className="text-sm font-medium text-green-700">
                      {orderItems.filter(item => item.is_kot).length} of {orderItems.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Items for Bar (BOT):</span>
                    <span className="text-sm font-medium text-orange-700">
                      {orderItems.filter(item => item.is_bot).length} of {orderItems.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Station Assignment:</span>
                    <span className="text-sm font-medium text-green-700">
                      Automatic
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Stations are automatically assigned based on menu item type
                  </p>
                </div>

                {/* Confirm Order Button */}
                <button 
                  onClick={handleConfirmOrder}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Confirm Order</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Food Menu Modal */}
        {showFoodMenu && (
          <FoodMenu 
            onAddItem={handleAddItem}
            onClose={() => setShowFoodMenu(false)}
          />
        )}

        {/* Bill Display Modal */}
        {showBillModal && generatedBill && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 transform transition-all max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Bill Generated Successfully!</h3>
                    <p className="text-green-100 mt-1">Table ID: {generatedBill.order_id} - Table {generatedBill.table_number}</p>
                  </div>
                  <button
                    onClick={closeBillModal}
                    className="text-white hover:text-green-200 text-2xl font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Bill Content */}
              <div className="p-6 space-y-6">
                {/* KOT Items */}
                {generatedBill.kot_items.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold mr-3">
                          KOT - Kitchen Orders
                        </div>
                        <span className="text-sm text-gray-600">{generatedBill.kot_items.length} items</span>
                      </div>
                      <button
                        onClick={printKOTBill}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print KOT</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {generatedBill.kot_items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-orange-200 last:border-b-0">
                          <div className="flex-1">
                            <span className="font-medium text-gray-800">{item.name}</span>
                            <span className="text-gray-600 ml-2">x{item.quantity}</span>
                          </div>
                          <div className="font-semibold text-gray-900">
                            LKR {(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BOT Items */}
                {generatedBill.bot_items.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold mr-3">
                          BOT - Bar Orders
                        </div>
                        <span className="text-sm text-gray-600">{generatedBill.bot_items.length} items</span>
                      </div>
                      <button
                        onClick={printBOTBill}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print BOT</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {generatedBill.bot_items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-blue-200 last:border-b-0">
                          <div className="flex-1">
                            <span className="font-medium text-gray-800">{item.name}</span>
                            <span className="text-gray-600 ml-2">x{item.quantity}</span>
                          </div>
                          <div className="font-semibold text-gray-900">
                            LKR {(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bill Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-lg mb-3 text-gray-800">Bill Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">LKR {generatedBill.subtotal.toFixed(2)}</span>
                    </div>
                    {generatedBill.service_charge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Charge:</span>
                        <span className="font-medium">LKR {generatedBill.service_charge.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Total:</span>
                        <span className="text-xl font-bold text-green-600">
                          LKR {generatedBill.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <span className="font-medium">✓ Bills sent to kitchen and bar.</span> Table {generatedBill.table_number} is now marked as occupied.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex space-x-3">
                <button
                  onClick={closeBillModal}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all transform ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                toast.type === 'success' 
                  ? 'bg-green-200' 
                  : toast.type === 'error'
                  ? 'bg-red-200'
                  : 'bg-blue-200'
              }`}></div>
              <span className="font-medium">{toast.message}</span>
              <button 
                onClick={() => setToast(prev => ({ ...prev, show: false }))}
                className="ml-auto text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Customer Success/Error Modal */}
        {customerModal.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
              {/* Header */}
              <div className={`${customerModal.type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white p-6 rounded-t-2xl`}>
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    {customerModal.type === 'success' ? (
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center">
                  {customerModal.type === 'success' ? 'Customer Saved!' : 'Error'}
                </h3>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="text-center space-y-4">
                  <p className="text-gray-700">{customerModal.message}</p>
                  
                  {customerModal.type === 'success' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-800 text-sm">
                        <span className="font-medium">Great!</span> Customer details have been saved to the database.
                      </p>
                    </div>
                  )}
                  
                  {customerModal.type === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">
                        <span className="font-medium">Please try again</span> or contact support if the problem persists.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0">
                <button
                  onClick={closeCustomerModal}
                  className={`w-full font-semibold py-3 px-4 rounded-xl transition-colors ${
                    customerModal.type === 'success' 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  {customerModal.type === 'success' ? 'Continue' : 'Try Again'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {successModal.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center">Order Confirmed!</h3>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="text-center space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">Order ID</p>
                    <p className="text-2xl font-bold text-gray-900">{successModal.orderId}</p>
                  </div>
                  
                  <p className="text-gray-700">{successModal.message}</p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm">
                      <span className="font-medium">Next Steps:</span> Your order has been sent to the kitchen/bar for preparation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex space-x-3">
                <button
                  onClick={closeSuccessModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeSuccessModal();
                    // Could add print functionality here
                    console.log('Print receipt for order:', successModal.orderId);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default POSBilling;