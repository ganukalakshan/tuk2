import { useEffect, useState } from 'react';
import { X, UserCog, Mail, Shield, Lock, Loader2 } from 'lucide-react';

const getCsrfToken = (): string => {
    const name = 'XSRF-TOKEN=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        const c = ca[i].trim();
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
};

interface Employer {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'cashier';
    created_at: string;
    updated_at: string;
}

interface EmployerFormData {
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'cashier' | '';
    password: string;
    confirmPassword: string;
}

interface EditEmployerProps {
    isOpen: boolean;
    employer: Employer | null;
    onClose: () => void;
    onSuccess: () => void;
}

const initialFormData: EmployerFormData = {
    name: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
};

export default function EditEmployer({ isOpen, employer, onClose, onSuccess }: EditEmployerProps) {
    const [formData, setFormData] = useState<EmployerFormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof EmployerFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (employer) {
            setFormData({
                name: employer.name,
                email: employer.email,
                role: employer.role,
                password: '',
                confirmPassword: '',
            });
        }
    }, [employer]);

    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof EmployerFormData, string>> = {};

        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }
        if (!formData.role) errors.role = 'Role is required';
        if (formData.password) {
            if (formData.password.length < 8) {
                errors.password = 'Minimum 8 characters';
            }
            if (formData.confirmPassword !== formData.password) {
                errors.confirmPassword = 'Passwords do not match';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employer || !validateForm()) return;
        setIsSubmitting(true);

        try {
            const payload: Record<string, unknown> = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                role: formData.role,
            };
            if (formData.password) {
                payload.password = formData.password;
            }

            const response = await fetch(`/api/employers/${employer.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                const apiErrors = data.errors as Record<string, string[]> | undefined;
                if (apiErrors) {
                    const mapped: Partial<Record<keyof EmployerFormData, string>> = {};
                    Object.entries(apiErrors).forEach(([key, messages]) => {
                        const first = Array.isArray(messages) ? messages[0] : String(messages);
                        if (key === 'role') mapped.role = first;
                        if (key === 'email') mapped.email = first;
                        if (key === 'name') mapped.name = first;
                        if (key === 'password') mapped.password = first;
                    });
                    setFormErrors(mapped);
                }
                return;
            }

            setFormErrors({});
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to update employer:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name as keyof EmployerFormData]) {
            setFormErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleClose = () => {
        setFormErrors({});
        onClose();
    };

    if (!isOpen || !employer) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                            <UserCog className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Edit Employer</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <UserCog className="w-4 h-4 text-slate-400" />
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter full name"
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                formErrors.name
                                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                    : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                            }`}
                        />
                        {formErrors.name && <p className="mt-1.5 text-sm text-red-500">{formErrors.name}</p>}
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="name@example.com"
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                formErrors.email
                                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                    : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                            }`}
                        />
                        {formErrors.email && <p className="mt-1.5 text-sm text-red-500">{formErrors.email}</p>}
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Shield className="w-4 h-4 text-slate-400" />
                            Role <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                formErrors.role
                                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                    : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                            }`}
                        >
                            <option value="">Select a role</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="cashier">Cashier</option>
                        </select>
                        {formErrors.role && <p className="mt-1.5 text-sm text-red-500">{formErrors.role}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Lock className="w-4 h-4 text-slate-400" />
                                New Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Leave blank to keep current"
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    formErrors.password
                                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                                }`}
                            />
                            {formErrors.password && <p className="mt-1.5 text-sm text-red-500">{formErrors.password}</p>}
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                                <Lock className="w-4 h-4 text-slate-400" />
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="Repeat new password"
                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                                    formErrors.confirmPassword
                                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                                }`}
                            />
                            {formErrors.confirmPassword && (
                                <p className="mt-1.5 text-sm text-red-500">{formErrors.confirmPassword}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-5 py-3 text-slate-700 font-semibold bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Update Employer'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
