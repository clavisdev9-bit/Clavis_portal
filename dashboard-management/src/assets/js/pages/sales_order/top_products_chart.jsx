window.TopProductsChart = function TopProductsChart({
    topProducts, showAllProducts, onToggleShowAll,
    startDate, endDate, filterType, selectedCompany,
    statsEndpoint = "/sales/get_sales_stats",
    productsEndpoint = "/invoices/products",
}) {
    const [showSalesStatsModal, setShowSalesStatsModal] = useState(false);
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [selectedProductName, setSelectedProductName] = useState("");

    const openProductsModal = (productName) => {
        setSelectedProductName(productName);
        setShowProductsModal(true);
    };

    return (
        <div className="p-6 card h-96 flex flex-col min-h-0">
            {!topProducts.length ? (
                <div className="flex items-center justify-center flex-1 w-full">
                    <p className="text-muted text-sm">Tidak ada transaksi</p>
                </div>
            ) : (
                <>
                <div className="grid grid-cols-12">
                <h2 className="col-span-6 mb-0 text-base font-semibold capitalize text-slate-800 dark:text-slate-100 flex-none">
                    Top 10 Products
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
                            {showAllProducts ? "Show Less" : "View All"}
                        </button>
                    </div>
                </div>
                <p className="col-span-12 mb-4 text-xs text-muted">
                    {window.formatDateRangeLabel(startDate, endDate)}
                </p>
                </div>

                {/* SCROLL AREA */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 gap-3">
                    {topProducts.map((product, index) => (
                        <div key={index}>
                            {/* Baris 1: Nama produk + Amount */}
                            <div className="flex items-start justify-between gap-4 leading-tight">
                                <p
                                    className="dark:text-white truncate text-sm leading-tight mb-1 cursor-pointer hover:underline"
                                    title={product.product_name}
                                    onClick={() => openProductsModal(product.product_name)}
                                >
                                    {index + 1}. {product.product_name ? (product.product_name.length > 29 ? `${product.product_name.slice(0, 29)}...` : product.product_name) : ''}
                                </p>
                                <p
                                    className="text-purple text-[15px] leading-tight font-medium flex-none mb-1 cursor-pointer hover:underline"
                                    onClick={() => openProductsModal(product.product_name)}
                                >
                                    {window.formatCurrency(product.total_amount)}
                                </p>
                            </div>

                            {/* Baris 2: Progress bar + Qty, sejajar */}
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 h-1 bg-black/10 dark:bg-darkborder rounded-2xl">
                                    <div
                                        className="bg-purple h-full rounded-2xl"
                                        style={{ width: `${Number(product.percentage)}%` }}
                                    />
                                </div>
                                <div
                                    className="text-muted text-xs leading-tight flex-none cursor-pointer hover:underline"
                                    onClick={() => openProductsModal(product.product_name)}
                                >
                                    {product.total_qty} pcs
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
                filterBy="product"
                title="Sales Trend by Product"
                endpoint={statsEndpoint}
            />

            <window.BrandProductsModal
                show={showProductsModal}
                onClose={() => setShowProductsModal(false)}
                startDate={startDate}
                endDate={endDate}
                filterType={filterType}
                selectedCompany={selectedCompany}
                productName={selectedProductName}
                endpoint={productsEndpoint}
            />
        </div>
    );
};