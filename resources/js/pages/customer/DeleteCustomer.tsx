import { Trash2 } from 'lucide-react';

// Helper to get CSRF token from cookie
const getCsrfToken = (): string => {
    const name = 'XSRF-TOKEN=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
};

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface DeleteCustomerProps {
    customer: Customer;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function DeleteCustomer({ customer, onSuccess, onCancel }: DeleteCustomerProps) {
    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/customers/${customer.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
            });

            if (response.ok) {
                onSuccess();
            }
        } catch (error) {
            console.error('Failed to delete customer:', error);
        }
    };

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={handleDelete}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
                Confirm
            </button>
            <button
                onClick={onCancel}
                className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition-colors"
            >
                Cancel
            </button>
        </div>
    );
}
