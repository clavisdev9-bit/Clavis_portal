const { useEffect, useState, useRef }=React;
const SoSummaryTable = () => {
    const tableRef = useRef();
    const [soSummaryData, setSoSummaryData] = useState([]);
    const columns = [
        { label: "SO No", index: 2, default:true },
        { label: "SO Date", index: 3, default:true },
        { label: "Cust PO No", index: 4, default:true },
        { label: "No PO Pengganti", index: 5, default:true },
        { label: "No PO Original", index: 6, default:true },
        { label: "Cancel Status", index: 7, default:true },
        { label: "Cancel Remark", index: 8, default:false },
        { label: "DO No", index: 9, default:false },
        { label: "DO Date", index: 10, default:false },
        { label: "DO DOc Received By", index: 11, default:false },
        { label: "Do Doc Received At", index: 12, default:false },
        { label: "SI No", index: 13, default:false },
        { label: "SI Date", index: 14, default:false },
        { label: "Cust BPB No", index: 15, default:false },
        { label: "Customer Code", index: 16, default:false },
        { label: "Customer Name", index: 17, default:false },
        { label: "Bill To Address", index: 18, default:false },
        { label: "DC Code", index: 19, default:false },
        { label: "Ship To", index: 20, default:false },
        { label: "City", index: 21, default:false },
        { label: "Area", index: 22, default:false },
        { label: "Ship To Address", index: 23, default:false },
        { label: "Requested Delivery Date", index: 24, default:false },
        { label: "Credit Terms", index: 25, default:false },
        { label: "Shipped By", index: 26, default:false },
        { label: "Total Product", index: 27, default:false },
        { label: "SO Qty PCS", index: 28, default:false },
        { label: "DO Qty PCS", index: 29, default:false },
        { label: "SI Qty PCS", index: 30, default:false },
        { label: "SO Qty CTN", index: 31, default:false },
        { label: "DO Qty CTN", index: 32, default:false },
        { label: "SI Qty CTN", index: 33, default:false },
        { label: "SO Amt Bef. Tax", index: 34, default:false },
        { label: "DO Amt Bef. Tax", index: 35, default:false },
        { label: "SI Amt Bef. Tax", index: 36, default:false },
        { label: "SO Total CBM", index: 37, default:false },
        { label: "SO Total KGS", index: 38, default:false },
        { label: "DO Total CBM", index: 39, default:false },
        { label: "DO Total KGS", index: 40, default:false },
        { label: "Created By", index: 41, default:false },
        { label: "Created At", index: 42, default:false },
        { label: "Updated By", index: 43, default:false },
        { label: "Updated At", index: 44, default:false },
    ];
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

    const isAllChecked =
    columns.every(col => visibleColumns.includes(col.index));
    const filterRef = useRef(null);
    const lockedColumns = [2, 3];
    const defaultColumns = [2, 3, 4, 5, 6, 7];
    const toggleColumn = (index) => {

        // cegah uncheck kolom wajib
        if (lockedColumns.includes(index)) {
            return;
        }

        const table = tableRef.current;

        if (!table) return;

        const columnPosition = columns.findIndex(col => col.index === index);

        if (columnPosition === -1) return;

        const dtColumn = table.column(columnPosition + 1);

        const isVisible = dtColumn.visible();

        dtColumn.visible(!isVisible);

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

        try {

            if (isAllChecked) {

                // kembali ke default + locked columns tetap aktif
                columns.forEach((col, i) => {

                    const shouldShow =
                        defaultColumns.includes(col.index) ||
                        lockedColumns.includes(col.index);

                    table.column(i + 1).visible(shouldShow, false);
                });

                setVisibleColumns([
                    ...new Set([
                        ...defaultColumns,
                        ...lockedColumns
                    ])
                ]);

            } else {

                // show all
                columns.forEach((col, i) => {
                    table.column(i + 1).visible(true, false);
                });

                setVisibleColumns(allColumnIndexes);
            }

            table.columns.adjust().draw(false);

        } catch (err) {
            console.error(err);
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
    useEffect(()=>{
        setLoading(true);
        axios.get(`${__API_URL__}/so_summary/master`)
        .then(res=>{
            setSoSummaryData(res.data);
        })
        .catch(err=>console.error(err))
        .finally(() => {
            setLoading(false);
        });
    },[]);
    useEffect(() => {
        if (soSummaryData.length) {
            soSummaryData.map(item => {
                return [
                    item.so_no,
                    item.so_date,
                    item.cust_po_no,
                    item.no_po_pengganti,
                    item.no_po_original,
                    item.cancel_status,
                    item.cancel_remark,
                    item.do_no,
                    item.do_date,
                    item.do_doc_received_by,
                    item.do_doc_received_at,
                    item.si_no,
                    item.si_date,
                    item.cust_bpb_no,
                    item.customer_code,
                    item.customer_name,
                    item.bill_to_address,
                    item.dc_code,
                    item.ship_to,
                    item.city,
                    item.area,
                    item.ship_to_address,
                    item.requested_delivery_date,
                    item.credit_terms,
                    item.shipped_by,
                    item.total_product,
                    item.so_qty_pcs,
                    item.do_qty_pcs,
                    item.si_qty_pcs,
                    item.so_qty_ctn,
                    item.do_qty_ctn,
                    item.si_qty_ctn,
                    item.so_amt_bef_tax,
                    item.do_amt_bef_tax,
                    item.si_amt_bef_tax,
                    item.so_total_cbm,
                    item.so_total_kgs,
                    item.do_total_cbm,
                    item.do_total_kgs,
                    item.created_by,
                    item.created_at,
                    item.updated_by,
                    item.updated_at,
                ];
            });

            if (!tableRef.current) {
                tableRef.current = $('#soSummaryTable').DataTable({
                    data: soSummaryData,
                    columns: [
                        {
                            data: null,
                            title: "No",
                            orderable: false,
                            searchable: false,
                            render: function (data, type, row, meta) {
                                return meta.row + 1;
                            }
                        },
                        { data: "so_no", title: "SO No" },
                        {
                            data: "so_date",
                            title: "SO Date",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        { data: "cust_po_no", title: "Cust PO No" },
                        { data: "no_po_pengganti", title: "No PO Pengganti" },
                        { data: "no_po_original", title: "No PO Original" },
                        { data: "cancel_status", title: "Cancel Status" },
                        { data: "cancel_remark", title: "Cancel Remark" },
                        { data: "do_no", title: "DO No" },
                        {
                            data: "do_date",
                            title: "DO Date",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        { data: "do_doc_received_by", title: "DO DOc Received By" },
                        {
                            data: "do_doc_received_at",
                            title: "DO Doc Received At",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        { data: "si_no", title: "SI No" },
                        {
                            data: "si_date",
                            title: "SI Date",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        { data: "cust_bpb_no", title: "Cust BPB No" },
                        { data: "customer_code", title: "Customer Code" },
                        { data: "customer_name", title: "Customer Name" },
                        { data: "bill_to_address", title: "Bill To Address" },
                        { data: "dc_code", title: "DC Code" },
                        { data: "ship_to", title: "Ship To" },
                        { data: "city", title: "City" },
                        { data: "area", title: "Area" },
                        { data: "ship_to_address", title: "Ship To Address" },
                        {
                            data: "requested_delivery_date",
                            title: "Requested Delivery Date",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        { data: "credit_terms", title: "Credit Terms" },
                        { data: "shipped_by", title: "Shipped By" },
                        { data: "total_product", title: "Total Product" },
                        { data: "so_qty_pcs", title: "SO Qty PCS" },
                        { data: "do_qty_pcs", title: "DO Qty PCS" },
                        { data: "si_qty_pcs", title: "SI Qty PCS" },
                        { data: "so_qty_ctn", title: "SO Qty CTN" },
                        { data: "do_qty_ctn", title: "DO Qty CTN" },
                        { data: "si_qty_ctn", title: "SI Qty CTN" },
                        {
                            data: "so_amt_bef_tax",
                            title: "SO Amt Bef. Tax",
                            render: function(data) {
                                return formatRupiah(data);
                            }
                        },
                        {
                            data: "do_amt_bef_tax",
                            title: "DO Amt Bef. Tax",
                            render: function(data) {
                                return formatRupiah(data);
                            }
                        },
                        {
                            data: "si_amt_bef_tax",
                            title: "SI Amt Bef. Tax",
                            render: function(data) {
                                return formatRupiah(data);
                            }
                        },
                        { data: "so_total_cbm", title: "SO Total CBM" },
                        { data: "so_total_kgs", title: "SO Total KGS" },
                        { data: "do_total_cbm", title: "DO Total CBM" },
                        { data: "do_total_kgs", title: "DO Total KGS" },
                        { data: "created_by", title: "Created By" },
                        { data: "created_at", title: "Created At" },
                        { data: "updated_by", title: "Updated By" },
                        { data: "updated_at", title: "Updated At" },
                    ],
                    scrollX: true,
                    autoWidth: true,
                    columnDefs: [
                        ...columns.map((col, i) => ({
                            targets: i + 1,
                            visible: visibleColumns.includes(col.index)
                        })),
                    ]
                });
            } else {
                tableRef.current.clear().rows.add(soSummaryData).draw();
            }
            tableRef.current.off('order.dt search.dt draw.dt');

            tableRef.current.on('order.dt search.dt draw.dt', function () {
                tableRef.current
                    .column(0, { search: 'applied', order: 'applied' })
                    .nodes()
                    .each(function (cell, i) {
                        cell.innerHTML = i + 1;
                    });
            });
        }
    }, [soSummaryData]);
    const formatDate = (dateString) => {
        if (!dateString) return "-";

        return new Date(dateString).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };
    const formatRupiah = (value, options = {}) => {
        const {
            minimumFractionDigits = 2,
            maximumFractionDigits = 2,
            rounding = 'round', // 'round' | 'ceil' | 'floor'
        } = options;

        let number = Number(value) || 0;

        // Handle rounding
        if (rounding === 'ceil') {
            number = Math.ceil(number * 100) / 100;
        } else if (rounding === 'floor') {
            number = Math.floor(number * 100) / 100;
        } else {
            number = Math.round(number * 100) / 100;
        }

        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits,
            maximumFractionDigits,
        }).format(number);
    };
    return (
        <div>
            <div class="card m-5 p-0">
                <div class="border border-gray-300 border-t-0 border-l-0 border-r-0 p-4 font-bold">
                    <i class="ri-filter-line"></i> Filter Panel
                </div>
                <div class="grid grid-cols-4 p-4 gap-4">
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Date From</label>
                        <input type="date" class="border border-gray-300 rounded-md dark:bg-dark date-input"/>
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Date To</label>
                        <input type="date" class="border border-gray-300 rounded-md dark:bg-dark date-input"/>
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Distribution Center</label>
                        <select class="border border-gray-300 rounded-md dark:bg-dark">
                            <option value="All DCs">All DCs</option>
                            <option value="DC Jakarta Barat">DC Jakarta Barat</option>
                            <option value="DC Surabaya">DC Surabaya</option>
                            <option value="DC Medan">DC Medan</option>
                            <option value="DC Bandung">DC Bandung</option>
                        </select>
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Status</label>
                        <select class="border border-gray-300 rounded-md dark:bg-dark">
                            <option value="">All Status</option>
                            <option value="fulfilled">Fulfilled</option>
                            <option value="pending">Pending</option>
                            <option value="canceled">Cancelled</option>
                            <option value="partial">Partial</option>
                            <option value="in_transit">In Transit</option>
                        </select>
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Courier / Vendor</label>
                        <select class="border border-gray-300 rounded-md dark:bg-dark">
                            <option value="all_couriers">All Couriers</option>
                            <option value="jne">JNE</option>
                            <option value="JT Express">J&amp;T Express</option>
                            <option value="sicepat">SiCepat</option>
                            <option value="anteraja">Anteraja</option>
                        </select>
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Saved Filter</label>
                        <select class="border border-gray-300 rounded-md dark:bg-dark">
                            <option value="">— Load Preset —</option>
                            <option value="Q1 2026 Default">Q1 2026 Default</option>
                            <option value="jakarta_only">Jakarta Only</option>
                            <option value="Fulfilled Orders">Fulfilled Orders</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-4 m-5 mt-0 min-h-[calc(100vh-212px)]">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 2xl:col-span-12 order-[17] card">
                        <div class="grid grid-cols-2 content-between mb-2">
                            <h4 class="font-semibold pt-1">Data Result</h4>
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
                                                                    className="mr-2 cursor-pointer disabled:opacity-50"
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
                        <div className="relative overflow-x-auto w-full">
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
                                <table id="soSummaryTable" className="min-w-full table-auto">
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
    document.getElementById("so_summary")
);
root.render(<SoSummaryTable />);