window.TopCustomersChart = function TopCustomersChart({
    topCustomers, showAllCustomers, onToggleShowAll,
    startDate, endDate, filterType, selectedCompany,
    OrderDataModalComponent = window.OrderDataModal,
    statsEndpoint = "/sales/get_sales_stats",
}) {
    const [showSalesStatsModal, setShowSalesStatsModal] = useState(false);

    const [showOrderDataModal, setShowOrderDataModal] = useState(false);
    const [orderDataPreset, setOrderDataPreset] = useState({ toInvoice: "", selectedCustomer: "" });

    const openOrderDataModal = (customerId) => {
        setOrderDataPreset({ toInvoice: "", selectedCustomer: customerId });
        setShowOrderDataModal(true);
    };

    return (
        <div className="p-6 card h-96 flex flex-col min-h-0">
            {!topCustomers.length ? (
                <div className="flex items-center justify-center flex-1 w-full">
                    <p className="text-muted text-sm">Tidak ada transaksi</p>
                </div>
            ) : (
                <>
                <div className="grid grid-cols-12">
                <h2 className="col-span-6 mb-0 text-base font-semibold capitalize text-slate-800 dark:text-slate-100 flex-none">
                    Top 10 Customers
                </h2>
                <div className="col-span-6 text-right">
                    <div className="flex justify-end gap-1">
                        <button
                            className="my-1 px-2 text-sm bg-blue-500 hover:bg-blue-600 rounded-md text-white"
                            onClick={() => setShowSalesStatsModal(true)}
                        >
                            See Stats
                        </button>
                        <button
                            className="my-1 px-2 text-sm bg-blue-500 hover:bg-blue-600 rounded-md text-white"
                            onClick={onToggleShowAll}
                        >
                            {showAllCustomers ? "Show Less" : "View All"}
                        </button>
                    </div>
                </div>
                </div>
                <p className="mb-2 text-xs text-muted">
                    {window.formatDateRangeLabel(startDate, endDate)}
                </p>
                <div class="flex items-center text-muted font-semibold">
                <div class="flex-1 border-b-2 border-gray-200">Customer Name</div>
                <div class="flex-shrink-0 pr-3 border-b-2 border-gray-200 whitespace-nowrap">
                    Amount
                </div>
                <div class="flex-shrink-0 mr-2 border-b-2 border-gray-200 whitespace-nowrap">
                    Orders
                </div>
                </div>
                {/* SCROLL AREA */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 gap-3">
                    {topCustomers.map((customer, index) => (
                        <div key={customer.partner_id} className="space-y-0">
                            <div className="flex items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4 leading-tight py-2">
                                        <div className="dark:text-white truncate text-sm hover:underline cursor-pointer" title={customer.customer_name}
                                        onClick={() => openOrderDataModal(customer.partner_id)}>
                                            {index + 1}. {customer.customer_name}
                                        </div>
                                        <div className="flex items-center gap-3 flex-none">
                                            <div className="text-[15px] leading-tight font-medium w-12 whitespace-nowrap hover:underline cursor-pointer"
                                                onClick={() => openOrderDataModal(customer.partner_id)}>
                                                {window.formatCurrency(customer.total_amount)}
                                            </div>
                                            <div
                                                className="text-[15px] font-medium text-purple hover:underline cursor-pointer w-16 text-right"
                                                onClick={() => openOrderDataModal(customer.partner_id)}
                                            >
                                                {customer.total_order}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="relative w-full h-1 bg-black/10 dark:bg-darkborder rounded-2xl">
                                        <div
                                            className="bg-purple h-full rounded-2xl"
                                            style={{ width: `${Number(customer.percentage)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                </div>
                </>
            )}

            <window.SalesStatsModal
                show={showSalesStatsModal}
                onClose={() => setShowSalesStatsModal(false)}
                startDate={startDate}
                endDate={endDate}
                filterType={filterType}
                selectedCompany={selectedCompany}
                filterBy="customer"
                title="Sales Trend by Customer"
                endpoint={statsEndpoint}
            />

            <OrderDataModalComponent
                show={showOrderDataModal}
                onClose={() => setShowOrderDataModal(false)}
                startDate={startDate}
                endDate={endDate}
                filterType={filterType}
                selectedCompany={selectedCompany}
                initialToInvoice={orderDataPreset.toInvoice}
                initialSelectedCustomer={orderDataPreset.selectedCustomer}
            />
        </div>
    );
};