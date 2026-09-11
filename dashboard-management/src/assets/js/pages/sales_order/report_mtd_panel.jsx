window.ReportMtdPanel = function ReportMtdPanel({ selectedCompany, endpoint, statsEndpoint }) {
    const [reportMtd, setReportMtd] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);

    useEffect(() => {
        const params = {};
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        setIsLoading(true);
        axios.get(`${__API_URL__}${endpoint}`, { params })
            .then(res => {
                setReportMtd(res.data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [selectedCompany, endpoint]);

    if (!reportMtd.length) {
        return (
            <window.LoadingOverlay loading={isLoading}>
                <div className="min-h-16" />
            </window.LoadingOverlay>
        );
    }

    const data = reportMtd[0];
    const totalBulanIni = parseFloat(data.total_bulan_ini);
    const totalBulanLalu = parseFloat(data.total_bulan_lalu);
    const persenPerubahan = parseFloat(data.persen_perubahan);
    const isNaik = persenPerubahan >= 0;

    return (
        <>
        <window.LoadingOverlay loading={isLoading}>
            <div className="grid grid-cols-12 items-stretch">
                <div className="col-span-4">
                    <div className="h-full flex flex-col items-center justify-center border border-gray-300">
                        <div className="text-md dark:text-gray-300">
                            MTD ({data.label_bulan_ini})
                        </div>
                        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            {window.formatCurrency(totalBulanIni)}
                        </h4>
                    </div>
                </div>
                <div className="col-span-4">
                    <div className="h-full flex flex-col items-center justify-center border border-gray-300">
                        <div className="text-md dark:text-gray-300">
                            Previous ({data.label_bulan_lalu})
                        </div>
                        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-0">
                            {window.formatCurrency(totalBulanLalu)}
                        </h4>
                        <button
                            className="text-white bg-blue-600 text-xs px-2 rounded-md cursor-pointer hover:bg-blue-700 my-1"
                            onClick={() => setShowStatsModal(true)}
                        >
                            see stats
                        </button>
                    </div>
                </div>
                <div className="col-span-4">
                    <div className="h-full flex flex-col items-center justify-center border border-gray-300">
                        <div className="text-md dark:text-gray-300">
                            Growth
                        </div>
                        <h4 className="flex items-center gap-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
                            {isNaN(persenPerubahan) ? (
                                <span className="p-1 leading-none rounded-md">-</span>
                            ) : (
                                <span
                                    className={`p-1 leading-none rounded-md ${
                                        isNaik ? "text-success" : "text-danger"
                                    }`}
                                >
                                    <i className={isNaik ? "ri-arrow-up-line" : "ri-arrow-down-line"}></i>{" "}
                                    {Math.abs(persenPerubahan).toFixed(1)}%
                                </span>
                            )}
                        </h4>
                    </div>
                </div>
            </div>
        </window.LoadingOverlay>

        <window.MtdStatsModal
            show={showStatsModal}
            onClose={() => setShowStatsModal(false)}
            selectedCompany={selectedCompany}
            endpoint={statsEndpoint}
        />
        </>
    );
};