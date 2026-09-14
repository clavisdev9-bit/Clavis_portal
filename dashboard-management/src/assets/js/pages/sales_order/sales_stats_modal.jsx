window.SalesStatsModal = function SalesStatsModal({
    show, onClose, startDate, endDate, filterType, selectedCompany, filterBy, title,
    endpoint = "/sales/get_sales_stats",
}) {
    const [stats, setStats] = useState([]);
    const [showAllLabels, setShowAllLabels] = useState(false);
    const [hiddenLabels, setHiddenLabels] = useState([]);

    const chartColors = [
        '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0',
        '#546E7A', '#26A69A', '#D10CE8', '#FF9800', '#4CAF50'
    ];

    // fetch sales stats sesuai filterBy yang diminta (product/customer/dst)
    // independen dari salesStats yang dipakai chart utama
    useEffect(() => {
        if (!show || !filterBy) return;

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
        params.filter_by = filterBy;

        axios.get(`${__API_URL__}${endpoint}`, {
            params,
            signal: controller.signal
        })
            .then(res => {
                setStats(res.data);
            })
            .catch(error => {
                if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return;
                console.error(error);
            });

        return () => controller.abort();
    }, [show, filterBy, startDate, endDate, filterType, selectedCompany, endpoint]);

    // =========================================================
    // Untuk CustomerLegend di sebelah kanan chart — butuh data
    // dikelompokkan per company (pola sama seperti companyGroups
    // di use_dashboard_core.jsx, sumbernya "stats" milik modal ini)
    // =========================================================
    const [expandedCompanies, setExpandedCompanies] = useState({});

    const companyGroups = React.useMemo(() => {
        const groups = {};
        stats.forEach(item => {
            const company = item.company;
            const label = item.label;
            const amount = Number(item.total_amount);
            if (!groups[company]) {
                groups[company] = {};
            }
            groups[company][label] = (groups[company][label] || 0) + amount;
        });

        return Object.entries(groups)
            .map(([company, labelTotals]) => ({
                company,
                customers: Object.entries(labelTotals)
                    .sort((a, b) => b[1] - a[1])
                    // "key" = identitas unik per (company, label) — label
                    // yang sama (mis. "No Brand") bisa muncul di lebih
                    // dari satu company, jadi tidak cukup diandalkan
                    // sendirian sebagai identitas (lihat window.buildCustomerKey)
                    .map(([customer, total]) => ({
                        customer,
                        total,
                        key: window.buildCustomerKey(company, customer),
                    }))
            }))
            .sort((a, b) => {
                const totalA = a.customers.reduce((s, x) => s + x.total, 0);
                const totalB = b.customers.reduce((s, x) => s + x.total, 0);
                return totalB - totalA;
            });
    }, [stats]);

    useEffect(() => {
        const expanded = {};
        companyGroups.forEach(group => {
            expanded[group.company] = true;
        });
        setExpandedCompanies(expanded);
    }, [companyGroups]);

    // "labels" di sini berisi KEY (company+label), bukan label polos —
    // diturunkan dari companyGroups (yang sudah company-aware) supaya
    // konsisten dengan pola di use_dashboard_core.jsx
    const labels = React.useMemo(() => {
        return companyGroups.flatMap(group => group.customers.map(c => c.key));
    }, [companyGroups]);

    useEffect(() => {
        setHiddenLabels([]);
    }, [labels]);

    const visibleLabels = React.useMemo(() => {
        return labels.filter(l => !hiddenLabels.includes(l));
    }, [labels, hiddenLabels]);

    const isSingleDate = [...new Set(stats.map(item => item.write_date))].length === 1;

    // highlight garis chart saat item CustomerLegend diklik
    const legendListRef = React.useRef(null);
    const { selectedDatasets, handleDatasetClick } = window.useDatasetHighlight(legendListRef);

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-7xl mx-4 p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {title}
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

                {stats.length > 0 ? (
                    <div className="grid grid-cols-12">
                        <div className="col-span-8">
                            <window.SalesTrendChart
                                companyId={selectedCompany}
                                salesStats={stats}
                                filterType={filterType}
                                selectedFilterBy={filterBy}
                                showAllLabels={showAllLabels}
                                visibleCustomers={visibleLabels}
                                customers={labels}
                                customerColors={chartColors}
                                selectedDatasets={selectedDatasets}
                                height={420}
                                gradientFill={false}
                            />
                        </div>
                        <div className="col-span-4">
                            <window.CustomerLegend
                                companyGroups={companyGroups}
                                customers={labels}
                                hiddenCustomers={hiddenLabels}
                                expandedCompanies={expandedCompanies}
                                customerColors={chartColors}
                                isSingleDate={isSingleDate}
                                selectedDatasets={selectedDatasets}
                                onCustomerClick={handleDatasetClick}
                                listRef={legendListRef}
                            />
                        </div>
                    </div>
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