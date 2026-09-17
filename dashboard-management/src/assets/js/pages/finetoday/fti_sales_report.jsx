const { useEffect, useState, useRef } = React;

const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatDateID(dateStr) {
    if (!dateStr) {
        return '-';
    }
    const d = dayjs(dateStr);
    if (!d.isValid()) {
        return '-';
    }
    return d.date() + ' ' + MONTHS_ID[d.month()] + ' ' + d.year();
}

function formatRupiah(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return '-';
    }
    const parts = Number(value).toFixed(2).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return 'Rp. ' + intPart + ',' + parts[1];
}

function formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return '-';
    }
    return Number(value).toLocaleString('id-ID');
}

function SalesReportCard() {
    const [ftiSales, setFtiSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const tableRef = useRef(null);
    const dtInstance = useRef(null);
    const [showColumn, setShowColumn] = useState(false);
    const columns = [
      { label: "Customer Name", index: 2, default: true },
      { label: "Customer PO Number", index: 3, default: true },
      { label: "MYE SO Number", index: 4, default: true },
      { label: "Delivery Address", index: 5, default: true },
      { label: "Request Delivery Date", index: 6, default: true },
      { label: "SO Qty", index: 7, default: true },
      { label: "Delivered Qty", index: 8, default: true },
      { label: "Brand", index: 9, default: true },
      { label: "Product Name", index: 10, default: true },
      { label: "Uom", index: 11, default: true },
      { label: "Unit Price", index: 12, default: true },
      { label: "SO Sub Total", index: 13, default: true },
      { label: "SO VAT", index: 14, default: true },
      { label: "SO VAT Amount", index: 15, default: true },
      { label: "SO Grand Total", index: 16, default: true },
      { label: "DO Sub Total", index: 17, default: true },
      { label: "DO VAT", index: 18, default: true },
      { label: "DO VAT Amount", index: 19, default: true },
      { label: "DO Grand Total", index: 20, default: true },
    ];
    const chunkSize = Math.ceil(columns.length / 3);
    const col1 = columns.slice(0, chunkSize);
    const col2 = columns.slice(chunkSize, chunkSize * 2);
    const col3 = columns.slice(chunkSize * 2);
    const [visibleColumns, setVisibleColumns] = useState(
        columns.filter(col => col.default).map(col => col.index)
    );
    const allColumnIndexes = columns.map(col => col.index);
    const isAllChecked = visibleColumns.length === columns.length;
    const filterRef = useRef(null);
    const defaultColumns = [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const lockedColumns = [2, 4];

    useEffect(() => {
        setIsLoading(true);
        axios.get(`${__API_URL__}/sales/fti_sales`)
            .then(res => {
                setFtiSales(res.data);
            })
            .catch(console.error)
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (dtInstance.current) {
            dtInstance.current.destroy();
            dtInstance.current = null;
        }

        if (tableRef.current && ftiSales.length > 0) {
            dtInstance.current = $(tableRef.current).DataTable({
                data: ftiSales,
                columns: [
                    {
                        title: 'No',
                        data: null,
                        defaultContent: '',
                        orderable: false,
                        searchable: false,
                        className: 'text-center',
                        width: '15px'
                    },
                    { title: 'Customer Name', data: 'customer_name', defaultContent: '-' },
                    { title: 'Customer PO Number', data: 'client_order_ref', defaultContent: '-' },
                    { title: 'MYE SO Number', data: 'name', defaultContent: '-' },
                    {
                        title: 'Delivery Address',
                        data: 'partner_shipping_id',
                        defaultContent: '-',
                        render: function (data) {
                            if (Array.isArray(data) && data.length > 1) {
                                return data[1];
                            }
                            return '-';
                        }
                    },
                    {
                        title: 'Request Delivery Date',
                        data: 'delivery_date',
                        defaultContent: '-',
                        render: function (data, type) {
                            if (type === 'sort' || type === 'type') {
                                return data ? data : '';
                            }
                            return formatDateID(data);
                        }
                    },
                    {
                        title: 'SO Qty',
                        data: 'so_qty',
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data) {
                            return formatNumber(data);
                        }
                    },
                    {
                        title: 'Delivered Qty',
                        data: 'delivered_qty',
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data) {
                            return formatNumber(data);
                        }
                    },
                    { title: 'Brand', data: 'brand', defaultContent: '-' },
                    {
                        title: 'Product Name',
                        data: 'product_name',
                        defaultContent: '-',
                    },
                    { title: 'Uom', data: 'uom', defaultContent: '-' },
                    {
                        title: 'Unit Price',
                        data: 'price_unit',
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data) {
                            return formatRupiah(data);
                        }
                    },
                    {
                        title: 'SO Sub Total',
                        data: 'price_subtotal',
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data) {
                            return formatRupiah(data);
                        }
                    },
                    {
                        title: 'SO VAT',
                        render: function () {
                            return '11%';
                        }
                    },
                    {
                        title: 'SO VAT Amount',
                        data: 'price_subtotal',
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data) {
                            return formatRupiah((data*11)/100);
                        }
                    },
                    {
                        title: 'SO Grand Total',
                        data: 'price_subtotal',
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data) {
                            return formatRupiah(data+((data*11)/100));
                        }
                    },
                    {
                        title: 'DO Sub Total',
                        data: null,
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data, type, row) {
                            const doQty = row.delivered_qty;
                            const unitPrice = row.price_unit;
                            if (doQty === null || doQty === undefined || unitPrice === null || unitPrice === undefined) {
                                return '-';
                            }
                            return formatRupiah(doQty * unitPrice);
                        }
                    },
                    {
                        title: 'DO VAT',
                        render: function () {
                            return '11%';
                        }
                    },
                    {
                        title: 'DO VAT Amount',
                        data: null,
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data, type, row) {
                            const doQty = row.delivered_qty;
                            const unitPrice = row.price_unit;
                            if (doQty === null || doQty === undefined || unitPrice === null || unitPrice === undefined) {
                                return '-';
                            }
                            return formatRupiah(((doQty * unitPrice)*11)/100);
                        }
                    },
                    {
                        title: 'DO Grand Total',
                        data: null,
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data, type, row) {
                            const doQty = row.delivered_qty;
                            const unitPrice = row.price_unit;
                            if (doQty === null || doQty === undefined || unitPrice === null || unitPrice === undefined) {
                                return '-';
                            }
                            return formatRupiah((doQty * unitPrice)+(((doQty * unitPrice)*11)/100));
                        }
                    },
                ],
                columnDefs: columns.map((col, i) => (
                    { targets: i + 1, visible: col.default }
                )),
                order: [[5, 'desc']],
                autoWidth: false,
                scrollX: true,
                scrollCollapse: true,
                drawCallback: function () {
                    const api = this.api();
                    const startIndex = api.page.info().start;
                    api.column(0, { order: 'current', search: 'applied' })
                        .nodes()
                        .each(function (cell, i) {
                            cell.innerHTML = startIndex + i + 1;
                        });
                }
            });
        }

        return () => {
            if (dtInstance.current) {
                dtInstance.current.destroy();
                dtInstance.current = null;
            }
        };
    }, [ftiSales]);
    const toggleColumn = (index) => {
        if (lockedColumns.includes(index)) {
            return;
        }
        const table = dtInstance.current;

        if (!table) return;

        const columnIndex = index - 1;
        const isVisible = table.column(columnIndex).visible();

        table.column(columnIndex).visible(!isVisible);

        setVisibleColumns(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                return [...prev, index];
            }
        });
    };
    const toggleAllColumns = () => {
        const table = dtInstance.current;

        if (!table) return;

        if (isAllChecked) {
            // reset ke default (DC & Area)
            columns.forEach((col) => {
                const shouldShow = defaultColumns.includes(col.index);

                table.column(col.index - 1).visible(shouldShow);
            });

            setVisibleColumns(defaultColumns);
        } else {
            // tampilkan semua
            columns.forEach((col) => {
                table.column(col.index - 1).visible(true);
            });

            setVisibleColumns(allColumnIndexes);
        }
    };
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setShowColumn(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div class="col-span-12 2xl:col-span-12 order-[17] card" style={{ minWidth: 0 }}>
            <div class="grid grid-cols-2 content-between mb-2">
                <h4 class="font-semibold pt-1 dark:text-white">Finetoday Sales Report</h4>
                <div class="flex justify-end gap-1" ref={filterRef}>
                    <div className="relative">
                        <button onClick={() => setShowColumn(!showColumn)} class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-layout-vertical-line text-md"></i> Columns</button>
                        {showColumn && (
                            <div className="absolute min-w-96 mt-2 right-0 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-xl p-4 z-50 whitespace-nowrap dark:text-black">
                                <div className="flex flex-col gap-3">

                                    {/* CHECK ALL */}
                                    <label className="flex items-center border-b pb-2 font-semibold cursor-pointer dark:text-white">
                                        <input
                                            type="checkbox"
                                            checked={isAllChecked}
                                            onChange={toggleAllColumns}
                                            className="mr-2 cursor-pointer"
                                        />
                                        <span>Check All Columns</span>
                                    </label>

                                    <div className="flex gap-3">
                                        <div className="flex-1 flex flex-col">
                                            {col1.map(col => (
                                                <label key={col.index} className="flex items-center cursor-pointer dark:text-white">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns.includes(col.index)}
                                                        onChange={() => toggleColumn(col.index)}
                                                        disabled={lockedColumns.includes(col.index)}
                                                        className="mr-2 cursor-pointer"
                                                    />
                                                    <span>{col.label}</span>
                                                </label>
                                            ))}
                                        </div>

                                        {/* COL 2 */}
                                        <div className="flex-1 flex flex-col">
                                            {col2.map(col => (
                                                <label key={col.index} className="flex items-center cursor-pointer dark:text-white">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns.includes(col.index)}
                                                        onChange={() => toggleColumn(col.index)}
                                                        className="mr-2 cursor-pointer"
                                                    />
                                                    <span>{col.label}</span>
                                                </label>
                                            ))}
                                        </div>

                                        {/* COL 3 */}
                                        <div className="flex-1 flex flex-col">
                                            {col3.map(col => (
                                                <label key={col.index} className="flex items-center cursor-pointer dark:text-white">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns.includes(col.index)}
                                                        onChange={() => toggleColumn(col.index)}
                                                        className="mr-2 cursor-pointer"
                                                    />
                                                    <span>{col.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="relative w-full">
                {isLoading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 dark:bg-slate-900/40">
                        <div className="flex flex-col items-center gap-2">
                            <i className="ri-loader-4-line animate-spin text-3xl text-primary-500"></i>
                            <span className="text-sm font-medium dark:text-white">Loading data...</span>
                        </div>
                    </div>
                )}
                <div className="card-body" style={isLoading ? { minWidth: 0, filter: 'blur(2px)', pointerEvents: 'none', userSelect: 'none' } : { minWidth: 0 }}>
                    <div style={{ width: 0, minWidth: '100%' }}>
                        <table ref={tableRef} className="w-full display" style={{ width: '100%' }}>
                            <thead className="text-left">
                                <tr>
                                    <th>No</th>
                                    {columns.map(col => (
                                        <th key={col.index}>{col.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('sales_report'));
root.render(
    <SalesReportCard />
);