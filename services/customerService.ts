import { CustomerSummary, CustomerDetail } from '@/lib/repositories/interfaces';

export const customerService = {
  async getCustomers(): Promise<CustomerSummary[]> {
    try {
      const response = await fetch('/api/admin/customers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.customers || [];
    } catch (error) {
      console.error('[customerService.getCustomers] Error:', error);
      throw error;
    }
  },

  async getCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
    try {
      const response = await fetch(`/api/admin/customers/${encodeURIComponent(customerId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.customer || null;
    } catch (error) {
      console.error('[customerService.getCustomerDetail] Error:', error);
      throw error;
    }
  },

  exportCustomersCSV(customers: CustomerSummary[]): void {
    if (!customers || customers.length === 0) return;

    const headers = [
      'Customer ID',
      'Name',
      'Email',
      'Phone',
      'Account Status',
      'Registration Date',
      'Total Orders',
      'Total Spent (INR)',
      'Last Order Date',
      'Activity Status',
    ];

    const rows = customers.map((c) => [
      `"${c.id}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${c.accountStatus}"`,
      `"${c.registrationDate}"`,
      c.totalOrders,
      c.totalSpent,
      `"${c.lastOrderDate || 'N/A'}"`,
      `"${c.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `gr_styles_customers_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
