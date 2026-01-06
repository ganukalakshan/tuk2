import { useState } from 'react';
import { Trash2, Loader2, X } from 'lucide-react';

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

interface Supplier {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface DeleteSupplierProps {
    supplier: Supplier;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function DeleteSupplier({ supplier, onSuccess, onCancel }: DeleteSupplierProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`/api/suppliers/${supplier.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.message || 'Failed to delete supplier');
                setIsDeleting(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                onSuccess();
            }
        } catch (error) {
            console.error('Failed to delete supplier:', error);
            setError('An error occurred while deleting');
            setIsDeleting(false);
        }
    };

    return (
         <>
            {error ? (
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 px-3 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="px-3 py-2 text-slate-600 font-medium rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </>
    );
}
