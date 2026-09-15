const { useEffect, useState, useRef } = React;

window.InvoiceCard = function InvoiceCard() {
    const dash = window.useDashboardCore({
        companies: '/invoices/companies',
        stats: '/invoices/invoice_stats',
        companyRevenue: '/invoices/company_revenue',
        topCategory: '/invoices/top_category',
        topProducts: '/invoices/top_products',
        topCustomers: '/invoices/top_customers',
        topBrands: '/invoices/top_brands',
    });
    const {
        isOpen, setIsOpen, filterLabel, selectedRadio, setSelectedRadio,
        startDate, endDate, defaultDates, filterType, monthDates, yearDates,
        handleRadioChange, onRangeChange, onMonthRangeChange, onYearRangeChange,
        companies, contentRef, selectedCompany, handleCompanyClick, handleContentScroll,
        selectedFilterBy, setSelectedFilterBy, salesStats, isLoadingSalesStats,
        showAllLabels, setShowAllLabels,
        companyRevenue, isLoadingCompanyRevenue,
        topCategory, isLoadingTopCategory,
        topProducts, isLoadingTopProducts, showAllProducts, setShowAllProducts,
        topCustomers, isLoadingTopCustomers, showAllCustomers, setShowAllCustomers,
        topBrands, isLoadingTopBrands,
        companyGroups, customers, hiddenCustomers, expandedCompanies, customerColors,
        visibleCustomers, isSingleDate,
        legendListRef, selectedDatasets, handleDatasetClick,
        totalSales,
    } = dash;

    //Aging Analysis Variable — khusus halaman ini
    const [agingAnalysis, setAgingAnalysis] = useState([]);
    const [showAllLabelsAging, setShowAllLabelsAging] = useState(true);
    const [isLoadingAgingAnalysis, setIsLoadingAgingAnalysis] = useState(false);

    //KPI Cards Variable — khusus halaman ini
    // catatan: activeCustomer & invoicePercentage TIDAK di-fetch di halaman ini
    // (card-nya dimatikan lewat prop showActiveCustomer/showInvoiceProgress={false}
    // di KpiCards — bukan dihapus dari file kpi_cards.jsx, karena file itu SHARED
    // dengan halaman Sales Order yang masih butuh kedua card tsb)
    const [reportYtd, setReportYtd] = useState([]);
    const [reportMtd, setReportMtd] = useState([]);
    const [totalOrder, setTotalOrder] = useState("");
    const [companyResidual, setCompanyResidual] = useState([]);
    const [companyPaid, setCompanyPaid] = useState([]);
    const [isLoadingTotalOrder, setIsLoadingTotalOrder] = useState(false);
    const [isLoadingReportYtd, setIsLoadingReportYtd] = useState(false);
    const [isLoadingReportMtd, setIsLoadingReportMtd] = useState(false);
    const [isLoadingCompanyResidual, setIsLoadingCompanyResidual] = useState(false);
    const [isLoadingCompanyPaid, setIsLoadingCompanyPaid] = useState(false);

    // =========================================================
    // FETCH AGING ANALYSIS
    // catatan: hanya bergantung selectedCompany (bukan startDate/endDate/
    // filterType) — dipertahankan persis seperti kode sumbernya, karena
    // aging analysis adalah snapshot outstanding balance saat ini, bukan
    // data yang difilter berdasarkan periode
    // =========================================================
    useEffect(() => {
        const params = {};
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        setIsLoadingAgingAnalysis(true);
        axios.get(`${__API_URL__}/invoices/aging_analys`, { params })
            .then(res => {
                setAgingAnalysis(res.data);
            })
            .catch(console.error)
            .finally(() => setIsLoadingAgingAnalysis(false));
    }, [selectedCompany]);

    // =========================================================
    // FETCH KPI CARDS (total order, report ytd)
    // =========================================================
    useEffect(() => {
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        params.filter_by = selectedFilterBy;

        setIsLoadingTotalOrder(true);
        axios.get(`${__API_URL__}/invoices/total_orders_by_company`, { params })
            .then(res => {
                setTotalOrder(res.data[0].total_order);
            })
            .catch(console.error)
            .finally(() => setIsLoadingTotalOrder(false));
    }, [startDate, endDate, filterType, selectedCompany]);

    useEffect(() => {
        const params = {};
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        setIsLoadingReportYtd(true);
        axios.get(`${__API_URL__}/invoices/report_ytd`, { params })
            .then(res => {
                setReportYtd(res.data);
            })
            .catch(console.error)
            .finally(() => setIsLoadingReportYtd(false));
    }, [selectedCompany]);
    
    useEffect(() => {
        const params = {};
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        setIsLoadingReportMtd(true);
        axios.get(`${__API_URL__}/invoices/report_mtd`, { params })
            .then(res => {
                setReportMtd(res.data);
            })
            .catch(console.error)
            .finally(() => setIsLoadingReportMtd(false));
    }, [selectedCompany]);

    // =========================================================
    // FETCH COMPANY RESIDUAL (Outstanding Balance)
    // dipakai kalau showActiveCustomer === false
    // =========================================================
    useEffect(() => {
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        setIsLoadingCompanyResidual(true);
        axios.get(`${__API_URL__}/invoices/company_residual`, { params })
            .then(res => {
                setCompanyResidual(res.data[0]);
            })
            .catch(console.error)
            .finally(() => setIsLoadingCompanyResidual(false));
    }, [startDate, endDate, filterType, selectedCompany]);

    // =========================================================
    // FETCH COMPANY PAID (Total Amount Paid)
    // dipakai kalau showInvoiceProgress === false
    // =========================================================
    useEffect(() => {
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        setIsLoadingCompanyPaid(true);
        axios.get(`${__API_URL__}/invoices/company_paid`, { params })
            .then(res => {
                setCompanyPaid(res.data[0]);
            })
            .catch(console.error)
            .finally(() => setIsLoadingCompanyPaid(false));
    }, [startDate, endDate, filterType, selectedCompany]);

    // =========================================================
    // RENDER
    // =========================================================
    return (
        <div>
            <window.DateFilterWidget
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                filterLabel={filterLabel}
                selectedRadio={selectedRadio}
                onRadioChange={(value) => {
                    setSelectedRadio(value);
                    handleRadioChange(value);
                }}
                defaultDates={defaultDates}
                onRangeChange={onRangeChange}
                monthDates={monthDates}
                onMonthRangeChange={onMonthRangeChange}
                yearDates={yearDates}
                onYearRangeChange={onYearRangeChange}
            />

            <window.CompanyTabs
                companies={companies}
                selectedCompany={selectedCompany}
                onCompanyClick={handleCompanyClick}
                onContentScroll={handleContentScroll}
                contentRef={contentRef}
            >
                {companies.map((company, index) => (
                    <div className="min-w-full snap-start" key={company.id}>
                        <window.LoadingOverlay loading={
                            isLoadingReportYtd || isLoadingReportMtd || isLoadingTotalOrder || isLoadingCompanyResidual || isLoadingCompanyPaid
                        }>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6 mt-2">
                                <window.KpiCards
                                    reportYtd={reportYtd}
                                    reportMtd={reportMtd}
                                    totalSales={totalSales}
                                    totalOrder={totalOrder}
                                    filterLabel={filterLabel}
                                    selectedCompany={selectedCompany}
                                    startDate={startDate}
                                    endDate={endDate}
                                    filterType={filterType}
                                    showActiveCustomer={false}
                                    showInvoiceProgress={false}
                                    companyResidual={companyResidual}
                                    companyPaid={companyPaid}
                                    OrderDataModalComponent={window.InvoiceDataModal}
                                    totalOrdersLabel="Total Invoices"
                                    statsEndpoint="/invoices/stats_mtd"
                                    ytdStatsEndpoint="/invoices/stats_ytd"
                                />
                            </div>
                        </window.LoadingOverlay>
                        <div className="grid grid-cols-12 gap-4 mt-2">
                            <div class="col-span-12 xl:col-span-5 min-h-0 card px-6 pt-6 h-96 flex flex-col overflow-y-auto">
                                <div className="flex-1">
                                    <window.LoadingOverlay loading={isLoadingSalesStats}>
                                        {salesStats.length > 0 ? (
                                            <div className="grid grid-cols-12">
                                                <div className={
                                                    selectedCompany === '' && selectedFilterBy !== 'company'
                                                        ? 'col-span-8'
                                                        : 'col-span-12'
                                                }>
                                                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                                                        Sales Trend&nbsp;&nbsp;
                                                        <span className="normal-case font-normal text-muted">
                                                            ({window.formatDateRangeLabel(startDate, endDate)})
                                                        </span>
                                                    </h2>
                                                    <div className="grid grid-cols-12">
                                                        <div className="col-span-7 flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={showAllLabels}
                                                                onChange={(e) => setShowAllLabels(e.target.checked)}
                                                            />
                                                            <span>Show All Values</span>
                                                        </div>
                                                        <div className="col-span-5 text-right flex items-center justify-end gap-2">
                                                            {selectedCompany === '' && (
                                                                <button
                                                                    type="button"
                                                                    role="switch"
                                                                    aria-checked={selectedFilterBy === 'company_list'}
                                                                    onClick={() => setSelectedFilterBy(
                                                                        selectedFilterBy === 'company_list' ? 'company' : 'company_list'
                                                                    )}
                                                                    className={`flex items-center gap-2 cursor-pointer px-3 py-0 rounded-lg border transition-colors hover:border-blue-400 hover:text-blue-400 ${
                                                                        selectedFilterBy === 'company_list'
                                                                            ? 'border-blue-600 text-blue-600'
                                                                            : 'border-gray-300 dark:border-gray-500 text-gray-300 dark:text-gray-500'
                                                                    }`}
                                                                >
                                                                    <span className="font-semibold">Group By Company</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <window.SalesTrendChart
                                                        companyId={company.id}
                                                        salesStats={salesStats}
                                                        filterType={filterType}
                                                        selectedFilterBy={selectedFilterBy}
                                                        showAllLabels={showAllLabels}
                                                        visibleCustomers={visibleCustomers}
                                                        customers={customers}
                                                        customerColors={customerColors}
                                                        selectedDatasets={selectedDatasets}
                                                        companyListEndpoint="/invoices/company_list"
                                                    />
                                                </div>

                                                {selectedFilterBy !== 'company' && selectedCompany === '' && (
                                                    <div className="col-span-4">
                                                        <window.CustomerLegend
                                                            companyGroups={companyGroups}
                                                            customers={customers}
                                                            hiddenCustomers={hiddenCustomers}
                                                            expandedCompanies={expandedCompanies}
                                                            customerColors={customerColors}
                                                            isSingleDate={isSingleDate}
                                                            selectedDatasets={selectedDatasets}
                                                            onCustomerClick={handleDatasetClick}
                                                            listRef={legendListRef}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center min-h-[210px] w-full">
                                                <p className="text-muted text-sm">Tidak ada transaksi</p>
                                            </div>
                                        )}
                                    </window.LoadingOverlay>
                                </div>

                                {/* <window.ReportMtdPanel
                                    selectedCompany={selectedCompany}
                                    endpoint="/invoices/report_mtd"
                                    statsEndpoint="/invoices/stats_mtd"
                                /> */}
                            </div>
                            <div className="col-span-12 xl:col-span-4 min-h-0 card p-6 h-96 flex flex-col">
                                {index === 0 ? (
                                    <window.CompanyRevenueChart companyRevenue={companyRevenue} loading={isLoadingCompanyRevenue} startDate={startDate} endDate={endDate} />
                                ) : company.id !== selectedCompany ? (
                                    <div className="flex items-center justify-center min-h-[300px] w-full">
                                        <p className="text-muted text-sm">Geser ke tab ini untuk melihat data</p>
                                    </div>
                                ) : (
                                    <window.LoadingOverlay loading={isLoadingTopCategory}>
                                        <window.TopCategoryChart
                                            topCategory={topCategory}
                                            startDate={startDate}
                                            endDate={endDate}
                                            filterType={filterType}
                                            selectedCompany={selectedCompany}
                                        />
                                    </window.LoadingOverlay>
                                )}
                            </div>
                            <div className="col-span-12 xl:col-span-3 min-h-0">
                                <window.LoadingOverlay loading={isLoadingTopProducts}>
                                <window.TopProductsChart
                                    topProducts={topProducts}
                                    showAllProducts={showAllProducts}
                                    onToggleShowAll={() => setShowAllProducts(prev => !prev)}
                                    startDate={startDate}
                                    endDate={endDate}
                                    filterType={filterType}
                                    selectedCompany={selectedCompany}
                                    statsEndpoint="/invoices/invoice_stats"
                                />
                                </window.LoadingOverlay>
                            </div>
                        </div>
                        {/* Row kedua: TopCustomers, panel tengah (TopCategory saat
                            tab ALL COMPANY / Aging Analysis saat tab company
                            individual), TopBrands */}
                        <div className="grid grid-cols-12 gap-4 mt-2">
                            <div className="col-span-12 xl:col-span-4 min-h-0">
                                <window.LoadingOverlay loading={isLoadingTopCustomers}>
                                <window.TopCustomersChart
                                    topCustomers={topCustomers}
                                    showAllCustomers={showAllCustomers}
                                    onToggleShowAll={() => setShowAllCustomers(prev => !prev)}
                                    startDate={startDate}
                                    endDate={endDate}
                                    filterType={filterType}
                                    selectedCompany={selectedCompany}
                                    OrderDataModalComponent={window.InvoiceDataModal}
                                    statsEndpoint="/invoices/invoice_stats"
                                />
                                </window.LoadingOverlay>
                            </div>
                            <div className="col-span-12 xl:col-span-5 min-h-0">
                                <div className="p-6 card h-full flex flex-col min-h-0">
                                    <window.LoadingOverlay loading={index === 0 ? isLoadingTopCategory : isLoadingAgingAnalysis}>
                                        {index === 0 ? (
                                            company.id !== selectedCompany ? (
                                                <div className="flex items-center justify-center min-h-[300px] w-full">
                                                    <p className="text-muted text-sm">Geser ke tab ini untuk melihat data</p>
                                                </div>
                                            ) : (
                                                <window.TopCategoryChart
                                                    topCategory={topCategory}
                                                    startDate={startDate}
                                                    endDate={endDate}
                                                    filterType={filterType}
                                                    selectedCompany={selectedCompany}
                                                />
                                            )
                                        ) : (
                                            <window.AgingAnalysisChart
                                                agingAnalysis={agingAnalysis}
                                                showAllLabels={showAllLabelsAging}
                                                onShowAllChange={(checked) => setShowAllLabelsAging(checked)}
                                                startDate={startDate}
                                                endDate={endDate}
                                                filterType={filterType}
                                                selectedCompany={selectedCompany}
                                            />
                                        )}
                                    </window.LoadingOverlay>
                                </div>
                            </div>
                            <div className="col-span-12 xl:col-span-3 min-h-0">
                                <window.LoadingOverlay loading={isLoadingTopBrands}>
                                <window.TopBrandsChart
                                    topBrands={topBrands}
                                    startDate={startDate}
                                    endDate={endDate}
                                    filterType={filterType}
                                    selectedCompany={selectedCompany}
                                    statsEndpoint="/invoices/invoice_stats"
                                />
                                </window.LoadingOverlay>
                            </div>
                        </div>
                    </div>
                ))}
            </window.CompanyTabs>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('invoices'));
root.render(<window.InvoiceCard />);