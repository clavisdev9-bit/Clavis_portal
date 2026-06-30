const { useEffect, useState, useRef }=React;
const SalesOrderTable = () => {
    const tableRef = useRef();
    const [salesOrderData, setSalesOrderData] = useState([]);
    const columns = [
      { label: "Sales Order No", index: 2, default: true },
      { label: "Invoice No", index: 3, default: true },
      { label: "Ref No", index: 4, default: true },
      { label: "Customer Name", index: 5, default: true },
      { label: "Customer Phone", index: 6, default: true },
      { label: "Customer Email", index: 7, default: true },
      { label: "Channel Name", index: 8, default: false },
      { label: "Store Name", index: 9, default: false },
      { label: "Transaction Date", index: 10, default: false },
      { label: "Completed Date", index: 11, default: false },
      { label: "Internal Status", index: 12, default: false },
      { label: "Channel Status", index: 13, default: false },
      { label: "WMS Status", index: 14, default: false },
      { label: "Payment Method", index: 15, default: false },
      { label: "Location Name", index: 16, default: false },
      { label: "Sub Total", index: 17, default: false },
      { label: "Total Disc", index: 18, default: false },
      { label: "Total Tax", index: 19, default: false },
      { label: "Grand Total", index: 20, default: false },
      { label: "Is Paid", index: 21, default: false },
      { label: "Is Canceled", index: 22, default: false },
      { label: "Sync From Jubelio", index: 23, default: false },
      { label: "Sync From Odoo", index: 24, default: false },
    ];
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [showColumn, setShowColumn] = useState(false);
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
    const defaultColumns = [2, 3, 4, 5, 6, 7];
    const lockedColumns = [2, 3];
    const toggleColumn = (index) => {
        if (lockedColumns.includes(index)) {
            return;
        }
        const table = tableRef.current;

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
        const table = tableRef.current;

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
    useEffect(() => {
        setLoading(true);

        const params = new URLSearchParams();

        if (startDate) {
            params.append("date_from", startDate);
        }

        if (endDate) {
            params.append("date_to", endDate);
        }

        const url = `${__JUBELIO_URL__}/api/sales-orders${
            params.toString() ? `?${params.toString()}` : ""
        }`;

        axios.get(url)
            .then(res => {
                setSalesOrderData(res.data.data.data);
            })
            .catch(err => console.error(err))
            .finally(() => {
                setLoading(false);
            });
    }, [startDate, endDate]);
    const formatDate = (dateString) => {
        if (!dateString) return "-";

        return new Date(dateString).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };
    const formatCurrency = (value) => {
        if (value == null) return "-";
        return "Rp." + new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    };
    useEffect(() => {
        if (!tableRef.current) {
            tableRef.current = $('#salesOrderTable').DataTable({
                data: salesOrderData,
                columns: [
                    {
                        data: null,
                        title: "No",
                        width: "60px",
                        searchable: false,
                        render: function (data, type, row, meta) {
                            return meta.row + 1;
                        }
                    },
                    {
                        data: "salesorder_no",
                        title: "Sales Order No",
                        render: function(data) {
                            return `
                                 <a
                                    href="#"
                                    class="so-detail text-blue-600 hover:text-blue-800 font-medium"
                                    data-so="${data}">
                                    ${data}
                                </a>
                            `;
                        }
                    },
                    { data: "invoice_no", title: "Invoice No" },
                    { data: "ref_no", title: "Ref No" },
                    { data: "customer_name", title: "Customer Name" },
                    { data: "customer_phone", title: "Customer Phone" },
                    { data: "customer_email", title: "Customer Email" },
                    { data: "channel_name", title: "Channel Name" },
                    { data: "store_name", title: "Store Name",
                        render: function (data) {
                            if (!data) return "-";

                            let html = data;
                            html = html.replace(/^Shop\s*\|\s*/i, "");
                            html = html.replace(/tokopedia/i, `
                                <img
                                    src="/assets/images/tokopedia.png"
                                    alt="Tokopedia"
                                    class="inline-block h-5 w-5 align-middle mr-1"
                                />
                            `);

                            html = html.replace(/shopee/i, `
                                <img
                                    src="/assets/images/shopee.png"
                                    alt="Shopee"
                                    class="inline-block h-5 w-5 align-middle mr-1"
                                />
                            `);

                            return html;
                        }
                    },
                    {
                        data: "transaction_date",
                        title: "Transaction Date",
                        render: function(data) {
                            return formatDate(data);
                        }
                    },
                    {
                        data: "completed_date",
                        title: "Completed Date",
                        render: function(data) {
                            return formatDate(data);
                        }
                    },
                    { data: "internal_status", title: "Internal Status" },
                    { data: "channel_status", title: "Channel Status" },
                    { data: "wms_status", title: "WMS Status" },
                    { data: "payment_method", title: "Payment Method" },
                    { data: "location_name", title: "Location Name" },
                    {
                        data: "sub_total",
                        title: "Subtotal",
                        render: function(data) {
                            return formatCurrency(data);
                        }
                    },
                    {
                        data: "total_disc",
                        title: "Total Disc",
                        render: function(data) {
                            return formatCurrency(data);
                        }
                    },
                    {
                        data: "total_tax",
                        title: "Total Tax",
                        render: function(data) {
                            return formatCurrency(data);
                        }
                    },
                    {
                        data: "grand_total",
                        title: "Grand Total",
                        render: function(data) {
                            return formatCurrency(data);
                        }
                    },
                    {
                        data: "is_paid",
                        title: "Paid",
                        render: function (data) {
                            return data
                                ? `<span class="inline-block px-3 rounded-full border border-green-500 text-green-600 font-medium">Yes</span>`
                                : `<span class="inline-block px-3 rounded-full border border-red-500 text-red-600 font-medium">No</span>`;
                        }
                    },
                    {
                        data: "is_canceled",
                        title: "Canceled",
                        render: function (data) {
                            return data
                                ? `<span class="inline-block px-3 rounded-full border border-green-500 text-green-600 font-medium">Yes</span>`
                                : `<span class="inline-block px-3 rounded-full border border-red-500 text-red-600 font-medium">No</span>`;
                        }
                    },
                    {
                        data: "sync_from_jubelio",
                        title: "Sync From Jubelio",
                        render: function (data) {
                            return data
                                ? `<span class="inline-block px-3 rounded-full border border-green-500 text-green-600 font-medium">Yes</span>`
                                : `<span class="inline-block px-3 rounded-full border border-red-500 text-red-600 font-medium">No</span>`;
                        }
                    },
                    {
                        data: "sync_to_odoo",
                        title: "Sync To Odoo",
                        render: function (data) {
                            return data
                                ? `<span class="inline-block px-3 rounded-full border border-green-500 text-green-600 font-medium">Yes</span>`
                                : `<span class="inline-block px-3 rounded-full border border-red-500 text-red-600 font-medium">No</span>`;
                        }
                    },
                    {
                        data: null,
                        title: "Actions",
                        width: "120px",
                        orderable: false,
                        searchable: false,
                        render: function (data, type, row) {
                            return `
                                <div class="flex gap-2">
                                    <button class="btn-view" data-id="${row.id}">
                                        <i class="ri-eye-line"></i>
                                    </button>
                                </div>
                            `;
                        }
                    }
                ],
                columnDefs: columns.map((col, i) => ({
                    targets: i + 1,      // +1 karena kolom No ada di index 0
                    visible: col.default
                })),
                scrollX: true,
                scrollCollapse: true,
                autoWidth: false,
                fixedColumns: {
                    leftColumns: 1,
                    rightColumns: 1
                },
                createdRow: function(row, data) {
                    $(row).addClass('cursor-pointer hover:bg-slate-100');
                },
            });
            let openedRow = null;
            let openedTr = null;
            $('#salesOrderTable tbody')
            .off('click', 'tr')
            .on('click', 'tr', async function () {

                const tr = $(this);
                const row = tableRef.current.row(tr);
                const data = row.data();

                // abaikan jika bukan data row
                if (!data) return;

                const so = data.salesorder_no;

                // jika row yang sama sedang terbuka
                if (row.child.isShown()) {
                    row.child.hide();
                    tr.removeClass('shown');

                    openedRow = null;
                    openedTr = null;
                    return;
                }

                // tutup row lain
                if (openedRow) {
                    openedRow.child.hide();
                    openedTr.removeClass('shown');
                }

                row.child(`
                    <div class="p-4 text-center">
                        <i class="ri-loader-4-line animate-spin"></i>
                        Loading...
                    </div>
                `).show();

                tr.addClass('shown');

                openedRow = row;
                openedTr = tr;

                try {
                    const res = await axios.get(
                        `${__JUBELIO_URL__}/api/sales-orders/number/${so}`
                    );

                    row.child(renderDetail(res.data.data)).show();

                } catch (err) {
                    row.child(`
                        <div class="p-4 text-red-500">
                            Gagal mengambil data.
                        </div>
                    `).show();
                }
            });
        } else {
            tableRef.current.clear();
            tableRef.current.rows.add(salesOrderData);
            tableRef.current.draw();
        }
    }, [salesOrderData]);
    function renderDetail(detail) {
        const items = detail.items.map((item, index) => `
            <tr class="border-b">
                <td class="p-2">${index + 1}</td>
                <td class="p-2">
                    <img src="${item.thumbnail}" width="50" class="rounded">
                </td>
                <td class="p-2">
                    <div class="font-semibold">${item.item_name}</div>
                    <div class="text-xs text-gray-500">${item.item_code}</div>
                </td>
                <td class="p-2 text-center">${item.unit}</td>
                <td class="p-2 text-end">${item.qty}</td>
                <td class="p-2 text-end">${formatCurrency(item.price)}</td>
                <td class="p-2 text-end">${item.disc}%</td>
                <td class="p-2 text-end">${formatCurrency(item.tax_amount)}</td>
                <td class="p-2 text-end font-semibold">${formatCurrency(item.amount)}</td>
            </tr>
        `).join("");
        const channelName = detail.marketplace.channel_name || "";

        let marketplaceHtml = channelName;

        if (channelName.toLowerCase().includes("tokopedia")) {
            marketplaceHtml = `
                <div class="flex items-center gap-2">
                    <img
                        src="assets/images/tokopedia.png"
                        alt="Tokopedia"
                        class="h-5 w-5 object-contain"
                    />
                    <span>${channelName}</span>
                </div>
            `;
        } else if (channelName.toLowerCase().includes("shopee")) {
            marketplaceHtml = `
                <div class="flex items-center gap-2">
                    <img
                        src="assets/images/shopee.png"
                        alt="Shopee"
                        class="h-5 w-5 object-contain"
                    />
                    <span>${channelName}</span>
                </div>
            `;
        }
        return `
            <div class="rounded-md border border-gray-400 p-4">

                <div class="flex items-start justify-between gap-6 mb-3">
                    <div>
                        <div class="text-xs text-gray-500">Pelanggan</div>
                        <div class="font-semibold">${detail.customer.name}</div>
                    </div>
                    <div>
                        <div class="text-md text-gray-400">PO Number</div>
                        <div class="font-semibold">${detail.salesorder_no}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500">Reference</div>
                        <div class="font-semibold">${detail.ref_no}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500">Transaction Date</div>
                        <div class="font-semibold">${formatDate(detail.date.transaction_date)}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500">Marketplace</div>
                        <div class="font-semibold">${marketplaceHtml}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500">Lokasi</div>
                        <div class="font-semibold">${detail.warehouse.location_name}</div>
                    </div>
                </div>

                <table class="w-full text-sm">

                    <thead class="bg-slate-100">
                        <tr>
                            <th class="p-2">No</th>
                            <th class="p-2">Image</th>
                            <th class="p-2">Item</th>
                            <th class="p-2">Unit</th>
                            <th class="p-2 text-end">Qty</th>
                            <th class="p-2 text-end">Price</th>
                            <th class="p-2 text-end">Disc</th>
                            <th class="p-2 text-end">Tax</th>
                            <th class="p-2 text-end">Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${items}
                    </tbody>

                    <tfoot class="font-semibold">
                        <tr>
                            <td colspan="8" class="text-end">Sub Total</td>
                            <td class="text-end">
                                ${formatCurrency(detail.summary.sub_total)}
                            </td>
                        </tr>

                        <tr>
                            <td colspan="8" class="text-end">Discount</td>
                            <td class="text-end">
                                ${formatCurrency(detail.summary.total_disc)}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="8" class="text-end">Add Discount</td>
                            <td class="text-end">
                                ${formatCurrency(detail.summary.add_disc)}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="8" class="text-end">Tax</td>
                            <td class="text-end">
                                ${formatCurrency(detail.summary.total_tax)}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="8" class="text-end">Ongkos Kirim</td>
                            <td class="text-end">
                                ${formatCurrency(detail.shipping.shipping_cost)}
                            </td>
                        </tr>

                        <tr>
                            <td colspan="8" class="text-end text-lg">
                                Grand Total
                            </td>
                            <td class="text-end text-lg text-blue-600">
                                ${formatCurrency(detail.summary.grand_total)}
                            </td>
                        </tr>
                    </tfoot>

                </table>

            </div>
        `;
    }
    return (
        <div>
            <div class="card m-5 p-0">
                <div class="border border-gray-300 border-t-0 border-l-0 border-r-0 p-4 font-bold">
                    <i class="ri-filter-line"></i> Filter Panel
                </div>
                <div class="grid grid-cols-4 p-4 gap-4">
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Date From</label>
                        <input type="date" value={startDate} onChange={(e) => {
                            const value = e.target.value;
                            if (endDate && value > endDate) {
                                alert("Start Date tidak boleh melebihi End Date");
                                return;
                            }else{
                                setStartDate(value);
                            }
                        }} class="border border-gray-300 rounded-md dark:bg-dark date-input"/>
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Date To</label>
                        <input type="date" value={endDate}
                        onChange={(e) => {
                            const value = e.target.value;

                            if (startDate && value < startDate) {
                                alert("End Date tidak boleh kurang dari Start Date");
                                return;
                            }else{
                                setEndDate(value);
                            }
                        }} class="border border-gray-300 rounded-md dark:bg-dark date-input"/>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-4 m-5 mt-0 min-h-[calc(100vh-212px)]">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 2xl:col-span-12 order-[17] card">
                        <div class="grid grid-cols-2 content-between mb-2">
                            <h4 class="font-semibold pt-1">Sales Orders</h4>
                            <div class="flex justify-end gap-1" ref={filterRef}>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-excel-line text-md"></i> XLSX</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-pdf-2-line text-md"></i> PDF</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-hwp-line text-md"></i> CSV</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-printer-line text-md"></i> PRINT</button>
                                
                                <div className="relative">
                                    <button onClick={() => setShowColumn(!showColumn)} class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-layout-vertical-line text-md"></i> Columns</button>
                                    {showColumn && (
                                        <div className="absolute min-w-96 mt-2 right-0 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-xl p-4 z-50 whitespace-nowrap dark:text-black">
                                            <div className="flex flex-col gap-3">
    
                                                {/* CHECK ALL */}
                                                <label className="flex items-center border-b pb-2 font-semibold cursor-pointer">
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
                                                            <label key={col.index} className="flex items-center cursor-pointer">
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
                                                            <label key={col.index} className="flex items-center cursor-pointer">
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
                                                            <label key={col.index} className="flex items-center cursor-pointer">
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
                            {loading && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <i className="ri-loader-4-line animate-spin text-3xl"></i>
                                        <span className="text-sm font-medium">Loading...</span>
                                    </div>
                                </div>
                            )}

                            {/* TABLE */}
                            <div className={`${loading ? "blur-sm pointer-events-none" : ""}`}>
                                <table id="salesOrderTable" className="min-w-full table-auto">
                                    <thead className="text-left">
                                        <tr>
                                            <th>No</th>
                                            {columns.map(col => (
                                                <th key={col.index}>{col.label}</th>
                                            ))}
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(
    document.getElementById("sales_order")
);
root.render(<SalesOrderTable />);