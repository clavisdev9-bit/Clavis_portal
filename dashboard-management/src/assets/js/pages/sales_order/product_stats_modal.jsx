window.ProductStatsModal = function ProductStatsModal({ show, onClose, startDate, endDate, filterType, selectedCompany }) {
    const [productStats, setProductStats] = useState([]);
    const [showAllLabels, setShowAllLabels] = useState(false);
    const [hiddenProducts, setHiddenProducts] = useState([]);

    const productColors = [
        '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0',
        '#546E7A', '#26A69A', '#D10CE8', '#FF9800', '#4CAF50'
    ];

    // fetch sales stats khusus mode product — independen dari salesStats
    // yang dipakai chart utama (yang filter_by-nya company/company_list)
    useEffect(() => {
        if (!show) return;

        const controller = new AbortController();
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        params.filter_by = 'product';

        axios.get(`${__API_URL__}/sales/get_sales_stats`, {
            params,
            signal: controller.signal
        })
            .then(res => {
                setProductStats(res.data);
            })
            .catch(error => {
                if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
                console.error(error);
            });

        return () => controller.abort();
    }, [show, startDate, endDate, filterType, selectedCompany]);

    const products = React.useMemo(() => {
        const totals = {};
        productStats.forEach(item => {
            totals[item.label] = (totals[item.label] || 0) + Number(item.total_amount);
        });
        return Object.entries(totals)
            .sort((a, b) => b[1] - a[1])
            .map(([label]) => label);
    }, [productStats]);

    useEffect(() => {
        setHiddenProducts([]);
    }, [products]);

    const visibleProducts = React.useMemo(() => {
        return products.filter(p => !hiddenProducts.includes(p));
    }, [products, hiddenProducts]);

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-3xl mx-4 p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Sales Trend by Product
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                    <input
                        type="checkbox"
                        checked={showAllLabels}
                        onChange={(e) => setShowAllLabels(e.target.checked)}
                    />
                    <span className="text-sm">Show All Values</span>
                </div>

                {productStats.length > 0 ? (
                    <window.SalesTrendChart
                        companyId={selectedCompany}
                        salesStats={productStats}
                        filterType={filterType}
                        selectedFilterBy="product"
                        showAllLabels={showAllLabels}
                        visibleCustomers={visibleProducts}
                        customers={products}
                        customerColors={productColors}
                    />
                ) : (
                    <div className="flex items-center justify-center min-h-[300px] w-full">
                        <p className="text-muted text-sm">Tidak ada transaksi</p>
                    </div>
                )}

                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};
