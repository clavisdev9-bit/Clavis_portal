const { useEffect, useState, useRef }=React;
const OutstandingDoCostTable = () => {
    const tableRef = useRef();
    const [outstandingDoCostData, setOutstandingDoCostData] = useState([]);
    const columns = [
        { label: "Customer", index: 2, default:true },
        { label: "Cust PO No", index: 3, default:true },
        { label: "DC", index: 4, default:true },
        { label: "Cust Lead Time", index: 5, default:true },
        { label: "Freight Lead Time", index: 6, default:true },
        { label: "Area", index: 7, default:true },
        { label: "Pulau", index: 8, default:false },
        { label: "Propinsi", index: 9, default:false },
        { label: "Kabupaten", index: 10, default:false },
        { label: "Kecamatan", index: 11, default:false },
        { label: "Kelurahan", index: 12, default:false },
        { label: "Kode Pos", index: 13, default:false },
        { label: "PO Date", index: 14, default:false },
        { label: "Expired Date", index: 15, default:false },
        { label: "GR No", index: 16, default:false },
        { label: "GR Date", index: 17, default:false },
        { label: "Total SKU", index: 18, default:false },
        { label: "Total CTN", index: 19, default:false },
        { label: "Total CM3", index: 20, default:false },
        { label: "Total CBM", index: 21, default:false },
        { label: "Total KGS", index: 22, default:false },
        { label: "Amt Bef Tax", index: 23, default:false },
        { label: "Service", index: 24, default:false },
        { label: "Freight Price", index: 25, default:false },
        { label: "Doc Price", index: 26, default:false },
        { label: "Ratio", index: 27, default:false },
        { label: "Volumetric", index: 28, default:false },
        { label: "CW", index: 29, default:false },
        { label: "Freight Cost Bef. Min", index: 30, default:false },
        { label: "Min CW", index: 31, default:false },
        { label: "CW Aft. Min", index: 32, default:false },
        { label: "Freight Cost Aft. Min", index: 33, default:false },
        { label: "Est. Courier Cost", index: 34, default:false },
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
        axios.get(`${__API_URL__}/outstanding_do_cost/master`)
        .then(res=>{
            setOutstandingDoCostData(res.data);
        })
        .catch(err=>console.error(err))
        .finally(() => {
            setLoading(false);
        });
    },[]);
    console.log(outstandingDoCostData);
    useEffect(() => {
        if (outstandingDoCostData.length) {
            outstandingDoCostData.map(item => {
                return [
                    item.customer,
                    item.cust_po_no,
                    item.dc,
                    item.cust_lead_time,
                    item.freight_lead_time,
                    item.area,
                    item.customer,
                    item.cust_po_no,
                    item.dc,
                    item.cust_lead_time,
                    item.freight_lead_time,
                    item.area,
                    item.pulau,
                    item.propinsi,
                    item.kabupaten,
                    item.kecamatan,
                    item.kelurahan,
                    item.kode_pos,
                    item.po_date,
                    item.expired_date,
                    item.gr_no,
                    item.gr_date,
                    item.total_sku,
                    item.total_ctn,
                    item.total_cm3,
                    item.total_cbm,
                    item.total_kgs,
                    item.amt_bef_tax,
                    item.service,
                    item.freight_price,
                    item.doc_price,
                    item.ratio,
                    item.volumetric,
                    item.cw,
                    item.freight_cost_bef_min,
                    item.min_cw,
                    item.cw_aft_min,
                    item.freight_cost_aft_min,
                    item.est_courier_cost,
                ];
            });

            if (!tableRef.current) {
                tableRef.current = $('#outstandingDoCostTable').DataTable({
                    data: outstandingDoCostData,
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
                        { data: "customer", title: "Customer" },
                        { data: "cust_po_no", title: "Cust PO No" },
                        { data: "dc", title: "DC" },
                        { data: "cust_lead_time", title: "Cust Lead Time" },
                        { data: "freight_lead_time", title: "Freight Lead Time" },
                        { data: "area", title: "Area" },
                        { data: "pulau", title: "Pulau" },
                        { data: "propinsi", title: "Propinsi" },
                        { data: "kabupaten", title: "Kabupaten" },
                        { data: "kecamatan", title: "Kecamatan" },
                        { data: "kelurahan", title: "Kelurahan" },
                        { data: "kode_pos", title: "Kode Pos" },
                        { data: "po_date", title: "PO Date" },
                        { data: "expired_date", title: "Expired Date" },
                        { data: "gr_date", title: "GR Date" },
                        {
                            data: "gr_date",
                            title: "GR Date",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        { data: "total_sku", title: "Total SKU" },
                        { data: "total_ctn", title: "Total CTN" },
                        {
                            data: "total_cm3",
                            title: "Total CM3",
                            render: function(data) {
                                return formatRupiah(data);
                            }
                        },
                        { data: "total_cbm", title: "Total CBM" },
                        { data: "total_kgs", title: "Total KGS" },
                        {
                            data: "amt_bef_tax",
                            title: "Amt Bef. Tax",
                            render: function(data) {
                                return formatRupiah(data);
                            }
                        },
                        { data: "service", title: "Service" },
                        {
                            data: "freight_price",
                            title: "Freight Price",
                            render: function(data) {
                                return formatRupiah(data);
                            }
                        },
                        {
                            data: "doc_price",
                            title: "Doc Price",
                            render: function(data) {
                                return formatRupiah(data);
                            }
                        },
                        {
                            data: "ratio",
                            title: "Ratio",
                            render: function(data) {
                                return formatRupiah(data);
                            }
                        },
                        { data: "volumetric", title: "Volumetric" },
                        { data: "cw", title: "CW" },
                        {
                            data: "freight_cost_bef_min",
                            title: "Freight Cost Bef. Min",
                            render: function(data) {
                                return formatRupiah(data);
                            }
                        },
                        { data: "min_cw", title: "Min CW" },
                        { data: "cw_aft_min", title: "CW Aft. Min" },
                        {
                            data: "freight_cost_aft_min",
                            title: "Freight Cost Aft. Min",
                            render: function(data) {
                                return formatRupiah(data);
                            }
                        },
                        {
                            data: "est_courier_cost",
                            title: "Est. Courier Cost",
                            render: function(data) {
                                return formatRupiah(data);
                            }
                        },
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
                tableRef.current.clear().rows.add(outstandingDoCostData).draw();
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
    }, [outstandingDoCostData]);
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
                                                                    className={`mr-2 ${
                                                                        lockedColumns.includes(col.index)
                                                                            ? "cursor-not-allowed"
                                                                            : "cursor-pointer"
                                                                    }`}
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
                                <table id="outstandingDoCostTable" className="min-w-full table-auto">
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
    document.getElementById("outstanding_do_cost")
);
root.render(<OutstandingDoCostTable />);