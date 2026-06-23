const { useEffect, useState, useRef }=React;
const SellOutCustomerTable = () => {
    const tableRef = useRef();
    const [sellOutCustomerData, setSellOutCustomerData] = useState([]);
    const columns = [
        { label: "Cust PO No", index: 2, default:true },
        { label: "PO Date", index: 3, default:true },
        { label: "SO No", index: 4, default:true },
        { label: "GRN No", index: 5, default:true },
        { label: "GRN Date", index: 6, default:true },
        { label: "DO No", index: 7, default:true },
        { label: "DO Date", index: 8, default:false },
        { label: "Shipment Date", index: 9, default:false },
        { label: "POD Date", index: 10, default:false },
        { label: "Cust GR No", index: 11, default:false },
        { label: "Exp Date", index: 12, default:false },
        { label: "SI No", index: 13, default:false },
        { label: "SI Date", index: 14, default:false },
        { label: "eFaktur NO", index: 15, default:false },
        { label: "Tgl. Kirim Faktur", index: 16, default:false },
        { label: "Jatuh Tempo Bayar", index: 17, default:false },
        { label: "No. Kwitansi", index: 18, default:false },
        { label: "No. TTF", index: 19, default:false },
        { label: "Customer", index: 20, default:false },
        { label: "Customer Alias", index: 21, default:false },
        { label: "DC Name", index: 22, default:false },
        { label: "Area", index: 23, default:false },
        { label: "Total SKU", index: 24, default:false },
        { label: "Qty SO", index: 25, default:false },
        { label: "Qty SO CTN", index: 26, default:false },
        { label: "Qty GR", index: 27, default:false },
        { label: "Qty GRN CTN", index: 28, default:false },
        { label: "Qty DO", index: 29, default:false },
        { label: "Qty DO CTN", index: 30, default:false },
        { label: "DO M3", index: 31, default:false },
        { label: "DO KGS", index: 32, default:false },
        { label: "Qty SI", index: 33, default:false },
        { label: "Qty SI CTN", index: 34, default:false },
        { label: "DO Amt Bef. Tax", index: 35, default:false },
        { label: "SI Amt Bef. Tax", index: 36, default:false },
        { label: "Last Status", index: 37, default:false },
        { label: "last Update", index: 38, default:false },
        { label: "Messages", index: 39, default:false },
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
    useEffect(()=>{
        setLoading(true);
        axios.get(`${__API_URL__}/sell_out_customer/master`)
        .then(res=>{
            setSellOutCustomerData(res.data);
        })
        .catch(err=>console.error(err))
        .finally(() => {
            setLoading(false);
        });
    },[]);
    useEffect(() => {
        if (sellOutCustomerData.length) {
            sellOutCustomerData.map(item => {
                return [
                    item.cust_po_no,
                    item.po_date,
                    item.so_no,
                    item.grn_no,
                    item.grn_date,
                    item.do_no,
                    item.do_date,
                    item.shipment_date,
                    item.pod_date,
                    item.cust_gr_no,
                    item.exp_date,
                    item.si_no,
                    item.si_date,
                    item.efaktur_no,
                    item.tgl_kirim_faktur,
                    item.jatuh_tempo_bayar,
                    item.no_kwitansi,
                    item.no_ttf,
                    item.customer,
                    item.customer_alias,
                    item.dc_name,
                    item.area,
                    item.total_sku,
                    item.qty_so,
                    item.qty_so_ctn,
                    item.qty_gr,
                    item.qty_grn_ctn,
                    item.qty_do,
                    item.qty_do_ctn,
                    item.do_m3,
                    item.do_kgs,
                    item.qty_si,
                    item.qty_si_ctn,
                    item.do_amt_bef_tax,
                    item.si_amt_bef_tax,
                    item.last_status,
                    item.last_update,
                    item.messages,
                ];
            });

            if (!tableRef.current) {
                tableRef.current = $('#sellOutCustomerTable').DataTable({
                    data: sellOutCustomerData,
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
                        { data: "cust_po_no", title: "Cust PO No" },
                        {
                            data: "po_date",
                            title: "PO Date",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        { data: "so_no", title: "SO No" },
                        { data: "grn_no", title: "GRN No" },
                        {
                            data: "grn_date",
                            title: "GRN Date",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        { data: "do_no", title: "DO No" },
                        {
                            data: "do_date",
                            title: "DO Date",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        {
                            data: "shipment_date",
                            title: "Shipment Date",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        {
                            data: "pod_date",
                            title: "POD Date",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        { data: "cust_gr_no", title: "Cust GR No" },
                        {
                            data: "exp_date",
                            title: "Exp Date",
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
                        { data: "efaktur_no", title: "eFaktur NO" },
                        {
                            data: "tgl_kirim_faktur",
                            title: "Tgl. Kirim Faktur",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        {
                            data: "jatuh_tempo_bayar",
                            title: "Jatuh Tempo Bayar",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        { data: "no_kwitansi", title: "No. Kwitansi" },
                        { data: "no_ttf", title: "No. TTF" },
                        { data: "customer", title: "Customer" },
                        { data: "customer_alias", title: "Customer Alias" },
                        { data: "dc_name", title: "DC Name" },
                        { data: "area", title: "Area" },
                        { data: "total_sku", title: "Total SKU" },
                        { data: "qty_so", title: "Qty SO" },
                        { data: "qty_so_ctn", title: "Qty SO CTN" },
                        { data: "qty_gr", title: "Qty GR" },
                        { data: "qty_grn_ctn", title: "Qty GRN CTN" },
                        { data: "qty_do", title: "Qty DO" },
                        { data: "qty_do_ctn", title: "Qty DO CTN" },
                        { data: "do_m3", title: "DO M3" },
                        { data: "do_kgs", title: "DO KGS" },
                        { data: "qty_si", title: "Qty SI" },
                        { data: "qty_si_ctn", title: "Qty SI CTN" },
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
                        { data: "last_status", title: "Last Status" },
                        { data: "last_update", title: "last Update" },
                        { data: "messages", title: "Messages" },
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
                tableRef.current.clear().rows.add(sellOutCustomerData).draw();
            }
            tableRef.current.on('order.dt search.dt draw.dt', function () {
                tableRef.current
                    .column(0, { search: 'applied', order: 'applied' })
                    .nodes()
                    .each(function (cell, i) {
                        cell.innerHTML = i + 1;
                    });
            });
        }
    }, [sellOutCustomerData]);
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
                                <table id="sellOutCustomerTable" className="min-w-full table-auto">
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
    document.getElementById("sell_out_customer")
);
root.render(<SellOutCustomerTable />);