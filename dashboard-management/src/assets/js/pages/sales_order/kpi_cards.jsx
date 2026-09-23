window.KpiCards = function KpiCards({
    reportYtd, reportMtd, totalSales, totalOrder, activeCustomer, invoicePercentage, filterLabel,
    selectedCompany, startDate, endDate, filterType,
    showActiveCustomer = true, showInvoiceProgress = true,
    companyResidual, companyPaid,
    OrderDataModalComponent = window.OrderDataModal,
    totalOrdersLabel = "Total Orders", statsEndpoint,
    ytdStatsEndpoint = "/sales/stats_ytd",
}) {
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showStatsMtdModal, setShowStatsMtdModal] = useState(false);
    const [showOrderDataModal, setShowOrderDataModal] = useState(false);
    const [orderDataPreset, setOrderDataPreset] = useState({ toInvoice: "", selectedCustomer: "" });
    const [orderModalDateOverride, setOrderModalDateOverride] = useState(null);

    const [showStatsOutstandingModal, setShowStatsOutstandingModal] = useState(false);
    const [activeTrendSeries, setActiveTrendSeries] = useState("Outstanding Amount");
    const [showInvoiceDataModal, setShowInvoiceDataModal] = useState(false);
    const [invoiceDataPreset, setInvoiceDataPreset] = useState({ outstandingBalance: false, amountPaidPositive: false });
    const [invoiceModalDateOverride, setInvoiceModalDateOverride] = useState(null);

    const openStatsOutstandingModal = (series) => {
        setActiveTrendSeries(series);
        setShowStatsOutstandingModal(true);
    };

    const openOrderDataModal = (toInvoiceValue, dateOverride = null) => {
        setOrderDataPreset({ toInvoice: toInvoiceValue, selectedCustomer: "" });
        setOrderModalDateOverride(dateOverride);
        setShowOrderDataModal(true);
    };

    const openInvoiceDataModal = (preset, dateOverride = null) => {
        setInvoiceDataPreset({ outstandingBalance: false, amountPaidPositive: false, ...preset });
        setInvoiceModalDateOverride(dateOverride);
        setShowInvoiceDataModal(true);
    };
    const openYtdMtdDataModal = (dateOverride) => {
        if (window.InvoiceDataModal) {
            openInvoiceDataModal({}, dateOverride);
        } else {
            openOrderDataModal("", dateOverride);
        }
    };
    return (
        <>
            {/* Current Year Sales */}
            {reportYtd && reportYtd.length > 0 && (() => {
                const data = reportYtd[0];
                const totalTahunIni = parseFloat(data.total_tahun_ini);
                const totalTahunLalu = parseFloat(data.total_tahun_lalu);
                const persenPerubahan = parseFloat(data.persen_perubahan);
                const selisih = totalTahunIni - totalTahunLalu;
                const isNaik = persenPerubahan >= 0;

                return (
                    <div className="card col-span-1 pr-2">
                        <div className="flex flex-col">
                            <div className="text-base text-dark dark:text-white">
                                <span><i className="fa-solid fa-money-bill-1-wave"></i> &nbsp;Current Year Sales</span>
                            </div>
                            <p className="text-dark dark:text-white text-xs mb-0">({data.label_tahun_ini})</p>
                            <div className="flex items-center">
                                <div className="font-semibold text-dark dark:text-white text-xl">{window.formatCurrency(totalTahunIni)}</div>
                                <div className="font-semibold text-rak dark:text-white ml-1">
                                    <span
                                        className={`text-sm leading-none rounded-md ${
                                            isNaik
                                                ? "bg-success/20 text-success"
                                                : "bg-danger/20 text-danger"
                                        }`}
                                    >
                                        <i className={isNaik ? "ri-arrow-up-line" : "ri-arrow-down-line"}></i>{" "}
                                        {Math.abs(persenPerubahan).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <p className="mb-1">
                                <span
                                    className={`font-semibold ${
                                        isNaik ? "text-success" : "text-danger"
                                    }`}
                                >
                                    {isNaik ? "+" : "-"}
                                    {formatCurrency(Math.abs(selisih))}
                                </span>{" "}
                                than ({data.label_tahun_lalu})
                            </p>
                            <div class="flex justify-end gap-1">
                                <button
                                    className="text-white bg-yellow-500 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-yellow-600"
                                    onClick={() => {
                                        const currentYear = dayjs().year();
                                        const previousYear = currentYear - 1;

                                        openYtdMtdDataModal({
                                            tabs: [
                                                {
                                                    label: String(currentYear),
                                                    startDate: dayjs().startOf("year").format("YYYY-MM-DD"),
                                                    endDate: dayjs().format("YYYY-MM-DD"),
                                                    filterType: "day",
                                                },
                                                {
                                                    label: String(previousYear),
                                                    startDate: dayjs().subtract(1, "year").startOf("year").format("YYYY-MM-DD"),
                                                    endDate: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
                                                    filterType: "day",
                                                },
                                            ],
                                        });
                                    }}
                                >
                                    see data
                                </button>
                                <button className="text-white bg-blue-600 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-blue-700"
                                    onClick={() => setShowStatsModal(true)}
                                >
                                    see stats
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
            {/* {reportYtd && reportYtd.length > 0 && (() => {
                const data = reportYtd[0];
                const totalTahunIni = parseFloat(data.total_tahun_ini);

                return (
                    <div className="card col-span-1 p-2 pt-6">
                        <div class="flex">
                            <div className="px-2 pt-2">
                                <img
                                    src="/assets/images/barchart white.png"
                                    alt="Sales Chart Icon"
                                    className="w-16 h-16 img-light"
                                />
                                <img
                                    src="/assets/images/barchart dark.png"
                                    alt="Sales Chart Icon"
                                    className="w-16 h-16 img-dark"
                                />
                            </div>
                            <div>
                                <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                                    <span>&nbsp;Current Year Sales</span>
                                </div>
                                <h4 className="flex mb-2 items-center gap-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                    {window.formatCurrency(totalTahunIni)}
                                </h4>
                                <p className="text-muted text-sm mb-1">({data.label_tahun_ini})</p>
                                <div class="text-right">
                                    <button
                                        className="text-white bg-blue-600 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-blue-700"
                                        onClick={() => setShowStatsModal(true)}
                                    >
                                        see stats
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()} */}

            {reportMtd && reportMtd.length > 0 && (() => {
                const data = reportMtd[0];
                const totalBulanIni = parseFloat(data.total_bulan_ini);
                const totalBulanLalu = parseFloat(data.total_bulan_lalu);
                const persenPerubahan = parseFloat(data.persen_perubahan);
                const selisih = totalBulanIni - totalBulanLalu;
                const isNaik = persenPerubahan >= 0;

                return (
                    <div className="card col-span-1">
                        <div className="flex flex-col">
                            <div className="text-base text-dark dark:text-white">
                                <span><i className="fa-solid fa-money-bill-1-wave"></i> &nbsp;Current Month Sales</span>
                            </div>
                            <p className="text-dark dark:text-white text-xs mb-0">({data.label_bulan_ini})</p>
                            <div className="flex items-center">
                                <div className="font-semibold text-dark dark:text-white text-xl">{window.formatCurrency(totalBulanIni)}</div>
                                <div className="font-semibold text-rak dark:text-white ml-1">
                                    <span
                                        className={`text-sm leading-none rounded-md ${
                                            isNaik
                                                ? "bg-success/20 text-success"
                                                : "bg-danger/20 text-danger"
                                        }`}
                                    >
                                        <i className={isNaik ? "ri-arrow-up-line" : "ri-arrow-down-line"}></i>{" "}
                                        {Math.abs(persenPerubahan).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <p className="mb-1">
                                <span
                                    className={`font-semibold ${
                                        isNaik ? "text-success" : "text-danger"
                                    }`}
                                >
                                    {isNaik ? "+" : "-"}
                                    {formatCurrency(Math.abs(selisih))}
                                </span>{" "}
                                than ({data.label_bulan_lalu})
                            </p>
                            <div className="flex justify-end gap-1">
                                <button
                                    className="text-white bg-yellow-500 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-yellow-600"
                                    onClick={() => {
                                        const currentMonthLabel = dayjs().format("MMMM YYYY");
                                        const lastYearSameMonthLabel = dayjs().subtract(1, "year").format("MMMM YYYY");

                                        openYtdMtdDataModal({
                                            tabs: [
                                                {
                                                    label: currentMonthLabel,
                                                    startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
                                                    endDate: dayjs().format("YYYY-MM-DD"),
                                                    filterType: "day",
                                                },
                                                {
                                                    label: lastYearSameMonthLabel,
                                                    startDate: dayjs().subtract(1, "year").startOf("month").format("YYYY-MM-DD"),
                                                    endDate: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
                                                    filterType: "day",
                                                },
                                            ],
                                        });
                                    }}
                                >
                                    see data
                                </button>
                                <button className="text-white bg-blue-600 text-sm px-2 rounded-md cursor-pointer hover:bg-blue-700"
                                    onClick={() => setShowStatsMtdModal(true)}
                                >
                                    see stats
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
            {/* {reportYtd && reportYtd.length > 0 && (() => {
                const data = reportYtd[0];
                const persenPerubahan = parseFloat(data.persen_perubahan);
                const isNaik = persenPerubahan >= 0;

                return (
                    <div className="card col-span-1 p-2 pt-6">
                        <div class="flex">
                            <div className="px-2 pt-2">
                                <img
                                    src="/assets/images/arrow chart white.png"
                                    alt="Sales Chart Icon"
                                    className="w-16 h-16 img-light"
                                />
                                <img
                                    src="/assets/images/arrow chart dark.png"
                                    alt="Sales Chart Icon"
                                    className="w-16 h-16 img-dark"
                                />
                            </div>
                            <div>
                                <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                                    <span>&nbsp;Sales Growth</span>
                                </div>
                                <h4
                                    className={`flex mb-2 items-center text-2xl font-semibold ${
                                        isNaik ? "text-success" : "text-danger"
                                    }`}
                                >
                                    <i className={isNaik ? "ri-arrow-up-line" : "ri-arrow-down-line"}></i>{" "}
                                    {Math.abs(persenPerubahan).toFixed(1)}%
                                </h4>
                                <p className="text-muted text-sm mb-1">VS {data.label_tahun_lalu}</p>
                            </div>
                        </div>
                    </div>
                );
            })()} */}

            {/* Revenue */}
            <div className="card col-span-1 p-2 pt-6">
                <div class="flex">
                    <div className="px-2 pt-2">
                        <img
                            src="/assets/images/revenue white.png"
                            alt="Sales Chart Icon"
                            className="w-16 h-16 img-light"
                        />
                        <img
                            src="/assets/images/revenue dark.png"
                            alt="Sales Chart Icon"
                            className="w-16 h-16 img-dark"
                        />
                    </div>
                    <div>
                        <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                            <span>&nbsp;Revenue</span>
                        </div>
                        <h4 className="flex mb-2 items-center gap-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {window.formatCurrency(totalSales)}
                        </h4>
                        <p className="text-muted text-sm mb-1">({filterLabel})</p>
                    </div>
                </div>
            </div>

            {/* Total Orders */}
            <div className="card col-span-1 p-2 pt-6">
                <div className="flex flex-col">
                    <div class="flex">
                        <div className="px-2 pt-2">
                            <img
                                src="/assets/images/order white.png"
                                alt="Sales Chart Icon"
                                className="w-16 h-16 img-light"
                            />
                            <img
                                src="/assets/images/order dark.png"
                                alt="Sales Chart Icon"
                                className="w-16 h-16 img-dark"
                            />
                        </div>
                        <div>
                            <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                                <span>&nbsp;{totalOrdersLabel}</span>
                            </div>
                            <h4 className="flex mb-2 items-center gap-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                {totalOrder}
                            </h4>
                            <p className="text-muted text-sm mb-1">Orders</p>
                        </div>
                    </div>
                
                    <div class="text-right">
                        <button
                            className="text-white bg-yellow-500 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-yellow-600"
                            onClick={() => openOrderDataModal("")}
                        >
                            see data
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Customer, atau Outstanding Balance (Company Residual) kalau dimatikan */}
            {showActiveCustomer ? (
                <div className="card col-span-1 p-2 pt-6">
                    <div class="flex">
                        <div className="px-2 pt-2">
                            <img
                                src="/assets/images/customer white.png"
                                alt="Sales Chart Icon"
                                className="w-18 h-16 img-light"
                            />
                            <img
                                src="/assets/images/customer dark.png"
                                alt="Sales Chart Icon"
                                className="w-18 h-16 img-dark"
                            />
                        </div>
                        <div>
                            <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                                <span>&nbsp;Active Customer</span>
                            </div>
                            <h4 className="flex mb-2 items-center gap-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                {activeCustomer && activeCustomer.active_customer ? activeCustomer.active_customer : 0}
                                /
                                {activeCustomer && activeCustomer.total_customer ? activeCustomer.total_customer : 0}
                            </h4>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card col-span-1 p-2 pt-5">
                    <div class="flex">
                        <div className="px-2 pt-2">
                            <img
                                src="/assets/images/outstanding white.png"
                                alt="Sales Chart Icon"
                                className="w-16 h-16 img-light"
                            />
                            <img
                                src="/assets/images/outstanding dark.png"
                                alt="Sales Chart Icon"
                                className="w-16 h-16 img-dark"
                            />
                        </div>
                        <div>
                            <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                                <span>&nbsp;Outstanding Balance</span>
                            </div>
                            <h4 className="flex mb-2 items-center gap-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                {window.formatCurrency(companyResidual && companyResidual.residual_amount)}
                            </h4>
                            <p className="text-muted text-sm mb-1">({filterLabel})</p>
                            <div class="text-right">
                                <button
                                    className="text-white bg-yellow-500 mr-1 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-yellow-600"
                                    onClick={() => openInvoiceDataModal({ outstandingBalance: true })}
                                >
                                    see data
                                </button>
                                <button
                                    className="text-white bg-blue-600 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-blue-700"
                                    onClick={() => openStatsOutstandingModal("Outstanding Amount")}
                                >
                                    see stats
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Progress, atau Total Amount Paid (Company Paid) kalau dimatikan */}
            {showInvoiceProgress ? (
                <div className="card col-span-1 p-2 pt-6">
                    <div class="flex">
                        <div className="px-2 pt-2">
                            <img
                                src="/assets/images/invoice white.png"
                                alt="Sales Chart Icon"
                                className="w-18 h-16 img-light"
                            />
                            <img
                                src="/assets/images/invoice dark.png"
                                alt="Sales Chart Icon"
                                className="w-18 h-16 img-dark"
                            />
                        </div>
                        <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                            <span>&nbsp;Invoice Progress</span>
                            <h4 className="text-2xl font-semibold text-dark dark:text-white">
                                {invoicePercentage && invoicePercentage.percentage_invoiced ? invoicePercentage.percentage_invoiced : 0}%
                            </h4>
                            <div className="flex">
                                <button
                                    className="bg-yellow-500 hover:bg-yellow-600 text-sm text-white px-1"
                                    onClick={() => openOrderDataModal("to invoice")}
                                >
                                    {invoicePercentage.to_invoice} To Invoice
                                </button>{" "}
                                <button
                                    className="bg-green-500 hover:bg-green-600 text-sm text-white px-1"
                                    onClick={() => openOrderDataModal("invoiced")}
                                >
                                    {invoicePercentage.invoiced} Invoiced
                                </button>{" "}
                            </div>  
                            <button
                                className="bg-gray-500 w-28 hover:bg-gray-600 text-sm text-white px-1"
                                onClick={() => openOrderDataModal("no")}
                            >
                                {invoicePercentage.no} Unprocessed
                            </button>
                        </div>
                    </div>
                    
                </div>
            ) : (
                <div className="card col-span-1 p-2 pt-5">
                    <div class="flex">
                        <div className="px-2 pt-2">
                            <img
                                src="/assets/images/amount paid white.png"
                                alt="Sales Chart Icon"
                                className="w-16 h-16 img-light rounded-full"
                            />
                            <img
                                src="/assets/images/amount paid dark.png"
                                alt="Sales Chart Icon"
                                className="w-16 h-16 img-dark rounded-full"
                            />
                        </div>
                        <div>
                            <div className="flex flex-col text-base dark:text-gray-300 mb-1">
                                <span>&nbsp;Total Amount Paid</span>
                            </div>
                            <h4 className="flex mb-2 items-center gap-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                {window.formatCurrency(companyPaid && companyPaid.amount_paid)}
                            </h4>
                            <p className="text-muted text-sm mb-1">({filterLabel})</p>
                            <div class="text-right">
                                <button
                                    className="text-white bg-yellow-500 mr-1 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-yellow-600"
                                    onClick={() => openInvoiceDataModal({ amountPaidPositive: true })}
                                >
                                    see data
                                </button>
                                <button
                                    className="text-white bg-blue-600 text-sm text-right px-2 rounded-md cursor-pointer hover:bg-blue-700"
                                    onClick={() => openStatsOutstandingModal("Amount Paid")}
                                >
                                    see stats
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <window.YtdStatsModal
                show={showStatsModal}
                onClose={() => setShowStatsModal(false)}
                selectedCompany={selectedCompany}
                endpoint={ytdStatsEndpoint}
            />
            <window.MtdStatsModal
                show={showStatsMtdModal}
                onClose={() => setShowStatsMtdModal(false)}
                selectedCompany={selectedCompany}
                endpoint={statsEndpoint}
            />
            <OrderDataModalComponent
                show={showOrderDataModal}
                onClose={() => setShowOrderDataModal(false)}
                startDate={orderModalDateOverride && orderModalDateOverride.startDate ? orderModalDateOverride.startDate : startDate}
                endDate={orderModalDateOverride && orderModalDateOverride.endDate ? orderModalDateOverride.endDate : endDate}
                filterType={orderModalDateOverride && orderModalDateOverride.filterType ? orderModalDateOverride.filterType : filterType}
                dateTabs={orderModalDateOverride && orderModalDateOverride.tabs ? orderModalDateOverride.tabs : null}
                selectedCompany={selectedCompany}
                initialToInvoice={orderDataPreset.toInvoice}
                initialSelectedCustomer={orderDataPreset.selectedCustomer}
            />

            <window.PaymentCollectionTrendModal
                show={showStatsOutstandingModal}
                onClose={() => setShowStatsOutstandingModal(false)}
                startDate={startDate}
                endDate={endDate}
                filterType={filterType}
                selectedCompany={selectedCompany}
                activeSeries={activeTrendSeries}
            />

            {/* Hardcode window.InvoiceDataModal (bukan lewat prop
                OrderDataModalComponent yang bisa diganti-ganti) — supaya
                tombol "see data" di card Outstanding Balance SELALU
                menampilkan modal invoice, terlepas dari komponen apa yang
                dipakai untuk modal Order Data di halaman ini.
                DIBUNGKUS GUARD `window.InvoiceDataModal &&` karena
                KpiCards dipakai juga di halaman Sales Orders, yang TIDAK
                memuat file invoice_data_modal.jsx — tanpa guard ini,
                window.InvoiceDataModal bernilai undefined di halaman itu
                dan bikin React error "Element type is invalid". */}
            {window.InvoiceDataModal && (
                <window.InvoiceDataModal
                    show={showInvoiceDataModal}
                    onClose={() => setShowInvoiceDataModal(false)}
                    startDate={invoiceModalDateOverride && invoiceModalDateOverride.startDate ? invoiceModalDateOverride.startDate : startDate}
                    endDate={invoiceModalDateOverride && invoiceModalDateOverride.endDate ? invoiceModalDateOverride.endDate : endDate}
                    filterType={invoiceModalDateOverride && invoiceModalDateOverride.filterType ? invoiceModalDateOverride.filterType : filterType}
                    dateTabs={invoiceModalDateOverride && invoiceModalDateOverride.tabs ? invoiceModalDateOverride.tabs : null}
                    selectedCompany={selectedCompany}
                    initialOutstandingBalance={invoiceDataPreset.outstandingBalance}
                    initialAmountPaidPositive={invoiceDataPreset.amountPaidPositive}
                />
            )}
        </>
    );
};