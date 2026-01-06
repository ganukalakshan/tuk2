import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Mail, Phone, MapPin, Save, RefreshCw, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CompanyInfo {
    name: string;
    phone: string;
    phone_secondary: string;
    address: string;
    email: string;
    updated_at?: string;
}

const emptyCompany: CompanyInfo = {
    name: '',
    phone: '',
    phone_secondary: '',
    address: '',
    email: '',
};

export default function CompanyInfoPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [company, setCompany] = useState<CompanyInfo>(emptyCompany);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadCompany();
    }, []);

    const loadCompany = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/company', {
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                const message = `Failed to load company info (${response.status})`;
                setError(message);
                return;
            }

            const data = await response.json();
            if (data.success && data.data) {
                setCompany({ ...emptyCompany, ...data.data });
            }
        } catch (err) {
            setError('Unable to load company information.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof CompanyInfo, value: string) => {
        setCompany((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/company', {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(company),
            });

            if (!response.ok) {
                const body = await response.text();
                setError(body || 'Failed to save company information.');
                return;
            }

            const data = await response.json();
            if (data.success && data.data) {
                setCompany({ ...emptyCompany, ...data.data });
                setSuccess('Company information saved');
            } else {
                setError('Failed to save company information.');
            }
        } catch (err) {
            setError('Unable to save company information.');
        } finally {
            setSaving(false);
        }
    };

    const lastUpdated = company.updated_at ? new Date(company.updated_at).toLocaleString() : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/admin')}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-lg shadow-slate-600/25">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin</p>
                                <h1 className="text-xl font-bold text-slate-900">Company Info</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span>{user?.name}</span>
                            <span className="text-slate-400">•</span>
                            <span className="uppercase tracking-wide text-xs font-semibold text-slate-500">{user?.role}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                <section>
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Profile</p>
                                <h2 className="text-2xl font-bold text-slate-900">Business identity</h2>
                                <p className="text-slate-500 mt-1">Keep your legal and contact details accurate.</p>
                            </div>
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                <Info className="w-4 h-4" />
                                Single record
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Company name</label>
                                    <input
                                        type="text"
                                        value={company.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                        placeholder="JPoS Cafe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Email</label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="email"
                                            value={company.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                            placeholder="hello@JPoS.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Phone</label>
                                    <div className="relative">
                                        <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={company.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                            placeholder="+1 555 010 2025"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Alternate phone</label>
                                    <div className="relative">
                                        <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={company.phone_secondary}
                                            onChange={(e) => handleChange('phone_secondary', e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                            placeholder="Optional backup number"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Address</label>
                                <div className="relative">
                                    <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                                    <textarea
                                        value={company.address}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 shadow-sm focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                        placeholder="Street, city, country"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    <div className="flex flex-col">
                                        <span>{lastUpdated ? `Last updated ${lastUpdated}` : 'Not saved yet'}</span>
                                        {error && <span className="text-red-500 font-semibold">{error}</span>}
                                        {success && <span className="text-emerald-600 font-semibold">{success}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={loadCompany}
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white shadow-sm hover:bg-slate-50 disabled:opacity-60"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Reload
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving || loading}
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 text-white font-semibold shadow-lg shadow-slate-400/30 hover:shadow-xl disabled:opacity-60"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? 'Saving...' : 'Save changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );
}
