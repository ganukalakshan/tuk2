import { useNavigate } from 'react-router-dom';
import { 
    BarChart3, 
    Warehouse, 
    TrendingUp, 
    DollarSign,
    Package,
    ShoppingCart,
    FileText,
    PieChart,
    AlertTriangle
} from 'lucide-react';

interface ReportCard {
    id: string;
    title: string;
    description: string;
    icon: any;
    route: string;
    bgColor: string;
    iconColor: string;
    available: boolean;
}

const reportCards: ReportCard[] = [
    {
        id: 'stock-transfer',
        title: 'Stock Transfer Report',
        description: 'View material quantities across all stores - Hot Kitchen, Beverage, Pastry, and Bakery',
        icon: Warehouse,
        route: '/reports/stock-transfer',
        bgColor: 'bg-gradient-to-br from-teal-50 to-teal-100',
        iconColor: 'text-teal-600',
        available: true,
    },
    {
        id: 'wastage',
        title: 'Wastage Report',
        description: 'Track wastage costs, analyze patterns by location, type, and reason',
        icon: AlertTriangle,
        route: '/reports/wastage',
        bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
        iconColor: 'text-red-600',
        available: true,
    },
    {
        id: 'sales',
        title: 'Sales Report',
        description: 'Daily, weekly, and monthly sales analysis with payment method breakdown',
        icon: DollarSign,
        route: '/reports/sales',
        bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
        iconColor: 'text-green-600',
        available: false,
    },
    {
        id: 'inventory',
        title: 'Inventory Report',
        description: 'Stock levels, low stock alerts, and inventory valuation',
        icon: Package,
        route: '/reports/inventory',
        bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
        iconColor: 'text-blue-600',
        available: true,
    },
    {
        id: 'purchase',
        title: 'Purchase Report',
        description: 'Purchase orders, supplier analysis, and procurement insights',
        icon: ShoppingCart,
        route: '/reports/purchase',
        bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
        iconColor: 'text-purple-600',
        available: true,
    },
    {
        id: 'fast-moving',
        title: 'Fast Moving Items',
        description: 'Top selling products and trending items analysis',
        icon: TrendingUp,
        route: '/reports/fast-moving',
        bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
        iconColor: 'text-orange-600',
        available: false,
    },
    {
        id: 'profit-loss',
        title: 'Profit & Loss Report',
        description: 'Revenue, expenses, and profitability analysis',
        icon: PieChart,
        route: '/reports/profit-loss',
        bgColor: 'bg-gradient-to-br from-pink-50 to-pink-100',
        iconColor: 'text-pink-600',
        available: false,
    },
];

export default function ReportsPage() {
    const navigate = useNavigate();

    const handleReportClick = (report: ReportCard) => {
        if (report.available) {
            navigate(report.route);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Back to Dashboard"
                        >
                            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                                <BarChart3 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
                                <p className="text-sm text-slate-500">Business insights and performance metrics</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-teal-100 rounded-xl">
                                <FileText className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Reports</p>
                                <p className="text-2xl font-bold text-slate-800">{reportCards.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <BarChart3 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Available Reports</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {reportCards.filter(r => r.available).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Coming Soon</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {reportCards.filter(r => !r.available).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reportCards.map((report) => {
                        const IconComponent = report.icon;
                        return (
                            <button
                                key={report.id}
                                onClick={() => handleReportClick(report)}
                                disabled={!report.available}
                                className={`${report.bgColor} rounded-2xl p-6 text-left 
                                           transform transition-all duration-300 
                                           ${report.available 
                                               ? 'hover:scale-105 hover:shadow-xl cursor-pointer' 
                                               : 'opacity-60 cursor-not-allowed'
                                           } 
                                           border-2 border-transparent hover:border-slate-200
                                           relative overflow-hidden group`}
                            >
                                {/* Coming Soon Badge */}
                                {!report.available && (
                                    <div className="absolute top-3 right-3">
                                        <span className="px-2.5 py-1 bg-slate-700 text-white text-xs font-semibold rounded-full">
                                            Coming Soon
                                        </span>
                                    </div>
                                )}

                                {/* Icon */}
                                <div className="mb-4">
                                    <div className={`w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center
                                                   transform transition-transform duration-300 
                                                   ${report.available ? 'group-hover:scale-110 group-hover:rotate-3' : ''}`}>
                                        <IconComponent className={`w-7 h-7 ${report.iconColor}`} strokeWidth={1.5} />
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                                        {report.title}
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {report.description}
                                    </p>
                                </div>

                                {/* Arrow Indicator */}
                                {report.available && (
                                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 
                                                   transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                        <div className="w-8 h-8 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
