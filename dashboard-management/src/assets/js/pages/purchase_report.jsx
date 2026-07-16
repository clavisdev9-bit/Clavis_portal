const { useEffect, useState, useRef }=React;
const PurchaseReportTable = () => {
    const tableRef = useRef();
    const [purchaseReportData, setPurchaseReportData] = useState([]);
    const columns = [
      { label: "Number", index: 2, default: true },
      { label: "Creation Date", index: 3, default: true },
      { label: "Vendor", index: 4, default: true },
      { label: "Company", index: 5, default: true },
      { label: "Salesperson", index: 6, default: true },
      { label: "Total", index: 7, default: true },
      { label: "Amount Tax", index: 8, default: false },
      { label: "Amount Untaxed", index: 9, default: false },
      { label: "Status", index: 10, default: true },
      { label: "Product", index: 11, default: false },
      { label: "Currency", index: 12, default: false },
      { label: "Date Approve", index: 13, default: false },
      { label: "Date Calendar Start", index: 14, default: false },
      { label: "Date Order", index: 15, default: false },
      { label: "Date Planned", index: 16, default: false },
      { label: "Partner Ref", index: 17, default: false },
      { label: "Payment Term", index: 18, default: false },
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
    const defaultColumns = [2, 3, 4, 5, 6, 7, 10];
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

        const url = `${__API_URL__}/purchase/master${
            params.toString() ? `?${params.toString()}` : ""
        }`;

        axios.get(url)
            .then(res => {
                setPurchaseReportData(res.data);
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
    useEffect(() => {
        if (!tableRef.current) {
            tableRef.current = $('#purchaseOrderTable').DataTable({
                data: purchaseReportData,
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
                    { data: "display_name", title: "Number" },
                    {
                        data: "write_date",
                        title: "Creation Date",
                        render: function(data) {
                            return formatDate(data);
                        }
                    },
                    {
                        data: "partner_id",
                        title: "Vendor",
                        render: function(data) {
                            return Array.isArray(data) && data.length > 1 ? data[1] : "-";
                        }
                    },
                    {
                        data: "company_id",
                        title: "Company",
                        render: function(data) {
                            return Array.isArray(data) && data.length > 1 ? data[1] : "-";
                        }
                    },
                    {
                        data: "write_uid",
                        title: "Salesperson",
                        render: function(data) {
                            return Array.isArray(data) && data.length > 1 ? data[1] : "-";
                        }
                    },
                    {
                        data: "amount_total",
                        title: "Total",
                        render: function (data, type, row) {
                            const currency = currencyMap[row.currency_id[1]];
                            return formatCurrency(data, currency);
                        }
                    },
                    {
                        data: "amount_tax",
                        title: "Amount Tax",
                        render: function (data, type, row) {
                            const currency = currencyMap[row.currency_id[1]];
                            return formatCurrency(data, currency);
                        }
                    },
                    {
                        data: "amount_untaxed",
                        title: "Amount Untaxed",
                        render: function (data, type, row) {
                            const currency = currencyMap[row.currency_id[1]];
                            return formatCurrency(data, currency);
                        }
                    },
                    { data: "invoice_status", title: "Status" },
                    {
                        data: "product_id",
                        title: "Product",
                        render: function(data) {
                            return Array.isArray(data) && data.length > 1 ? data[1] : "-";
                        }
                    },
                    {
                        data: "currency_id",
                        title: "Currency",
                        render: function(data) {
                            return Array.isArray(data) && data.length > 1 ? data[1] : "-";
                        }
                    },
                    {
                        data: "date_approve",
                        title: "Date Approve",
                        render: function(data) {
                            return formatDate(data);
                        }
                    },
                    {
                        data: "date_calendar_start",
                        title: "Date Calendar Start",
                        render: function(data) {
                            return formatDate(data);
                        }
                    },
                    {
                        data: "date_order",
                        title: "Date Order",
                        render: function(data) {
                            return formatDate(data);
                        }
                    },
                    {
                        data: "date_planned",
                        title: "Date Planned",
                        render: function(data) {
                            return formatDate(data);
                        }
                    },
                    {
                        data: "partner_ref",
                        title: "Partner Ref",
                        render: function(data) {
                            return data === 'false' ? "-" : data;
                        }
                    },
                    {
                        data: "payment_term_id",
                        title: "Payment Term",
                        render: function(data) {
                            return Array.isArray(data) && data.length > 1 ? data[1] : "-";
                        }
                    },
                ],
                columnDefs: columns.map((col, i) => ({
                    targets: i + 1,      // +1 karena kolom No ada di index 0
                    visible: col.default
                })),
                scrollX: true,
                scrollCollapse: true,
                autoWidth: false,
                fixedColumns: {
                    leftColumns: 1
                },
                footerCallback: function () {
                    const api = this.api();

                    const grandTotal = api
                        .rows({ search: 'applied' })
                        .data()
                        .toArray()
                        .reduce((sum, row) => sum + Number(row.amount_total || 0), 0);
                    const grandTotalTax = api
                        .rows({ search: 'applied' })
                        .data()
                        .toArray()
                        .reduce((sum, row) => sum + Number(row.amount_tax || 0), 0);
                    const grandTotalUntaxed = api
                        .rows({ search: 'applied' })
                        .data()
                        .toArray()
                        .reduce((sum, row) => sum + Number(row.amount_untaxed || 0), 0);

                    const firstRow = api.rows().data()[0];
                    const currency = firstRow
                        ? currencyMap[firstRow.currency_id[1]]
                        : "IDR";

                    // kolom Salesperson (index 5)
                    $(api.column(5).footer()).html("<h6>Grand Total</h6>");

                    // kolom Total (index 6)
                    $(api.column(6).footer()).html(
                        `${formatCurrency(grandTotal, currency)}`
                    );
                    $(api.column(7).footer()).html(
                        `${formatCurrency(grandTotalTax, currency)}`
                    );
                    $(api.column(8).footer()).html(
                        `${formatCurrency(grandTotalUntaxed, currency)}`
                    );
                },
                createdRow: function(row, data) {
                    $(row).addClass('cursor-pointer hover:bg-slate-100');
                },
            });
        } else {
            tableRef.current.clear();
            tableRef.current.rows.add(purchaseReportData);
            tableRef.current.draw();
        }
    }, [purchaseReportData]);
    
    const currencyMap = {
        "Rp": "IDR",
        "Rupiah": "IDR",
        "USD": "USD",
        "US Dollar": "USD",
        "EUR": "EUR",
    };
    const formatCurrency = (value) => {
        if (value == null) return "-";
        return "Rp." + new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    };
    // const exportExcel = () => {
    //     if (!purchaseOrderData.length) {
    //         alert("Tidak ada data untuk diexport");
    //         return;
    //     }

    //     const data = purchaseOrderData.map((row) => ({
    //         "Purchase Order No": row.purchaseorder_no,
    //         "Ref No": row.ref_no,
    //         "Supplier Name": row.supplier_name,
    //         "Supplier Email": row.supplier_email,
    //         "Transaction Date": formatDate(row.transaction_date),
    //         "Status": row.status,
    //         "Payment Method": row.payment_method,
    //         "Payment Term": row.payment_term,
    //         "Location Name": row.location_name,
    //         "Sub Total": row.sub_total,
    //         "Total Discount": row.total_disc,
    //         "Total Tax": row.total_tax,
    //         "Grand Total": row.grand_total,
    //         "Detail Fetched": row.detail_fetched===true ? "Yes" : "No",
    //         "Sync From Jubelio": row.sync_from_jubelio===true ? "Yes" : "No",
    //         "Sync To Odoo": row.sync_to_odoo===true ? "Yes" : "No",
    //     }));

    //     const worksheet = XLSX.utils.json_to_sheet(data);

    //     // Auto fit column width (sama seperti Sales Order)
    //     const columnWidths = Object.keys(data[0]).map((key) => {
    //         const headerLength = key.length;

    //         const maxCellLength = data.reduce((max, row) => {
    //             const value = row[key] == null ? "" : String(row[key]);
    //             return Math.max(max, value.length);
    //         }, headerLength);

    //         return {
    //             wch: Math.min(Math.max(maxCellLength + 2, 12), 50)
    //         };
    //     });

    //     worksheet["!cols"] = columnWidths;

    //     const workbook = XLSX.utils.book_new();
    //     XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Orders");

    //     XLSX.writeFile(
    //         workbook,
    //         `PurchaseOrders_${new Date().toISOString().slice(0, 10)}.xlsx`
    //     );
    // };
    return (
        <div>
            <div class="card m-5 p-0">
                <div class="p-4 font-bold">
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
                            <h4 class="font-semibold pt-1">Purchase Report</h4>
                            <div class="flex justify-end gap-1" ref={filterRef}>
                                {/* <button onClick={exportExcel} class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-excel-line text-md"></i> XLSX</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-pdf-2-line text-md"></i> PDF</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-hwp-line text-md"></i> CSV</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-printer-line text-md"></i> PRINT</button> */}
                                
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
                                <table id="purchaseOrderTable" className="min-w-full table-auto">
                                    <thead className="text-left">
                                        <tr>
                                            <th>No</th>
                                            {columns.map(col => (
                                                <th key={col.index}>{col.label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colSpan={6} style={{ textAlign: "right" }}>
                                                Grand Total :
                                            </th>

                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                            <th></th>
                                        </tr>
                                    </tfoot>
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
    document.getElementById("purchase_report")
);
root.render(<PurchaseReportTable />);