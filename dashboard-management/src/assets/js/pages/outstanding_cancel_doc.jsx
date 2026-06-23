const { useEffect, useState, useRef }=React;
const OutstandingCancelDocTable = () => {
    const tableRef = useRef();
    const [outstandingCancelDocData, setOutstandingCancelDocData] = useState([]);
    const columns = [
        { label: "Cancel Type", index: 2, default:true },
        { label: "Cust PO No", index: 3, default:true },
        { label: "PO Date", index: 4, default:true },
        { label: "Exp Date", index: 5, default:true },
        { label: "Shipment Date", index: 6, default:true },
        { label: "POD Date", index: 7, default:true },
        { label: "Driver", index: 8, default:false },
        { label: "AWB No", index: 9, default:false },
        { label: "Service Name", index: 10, default:false },
        { label: "DO Date", index: 11, default:false },
        { label: "Customer", index: 12, default:false },
        { label: "Customer Alias", index: 13, default:false },
        { label: "DC Name", index: 14, default:false },
        { label: "Area", index: 15, default:false },
        { label: "Product Code", index: 16, default:false },
        { label: "Std Pack", index: 17, default:false },
        { label: "Qty SO", index: 18, default:false },
        { label: "Qty SO CTN", index: 19, default:false },
        { label: "Qty GR", index: 20, default:false },
        { label: "Qty GR CTN", index: 21, default:false },
        { label: "Qty DO", index: 22, default:false },
        { label: "Qty DO CTN", index: 23, default:false },
        { label: "Qty Loading CTN", index: 24, default:false },
        { label: "Qty POD CTN", index: 25, default:false },
        { label: "Qty Reject CTN", index: 26, default:false },
        { label: "Qty DR", index: 27, default:false },
        { label: "Qty DR CTN", index: 28, default:false },
        { label: "Qty Cancelled", index: 29, default:false },
        { label: "Qty Cancelled CTN", index: 30, default:false },
        { label: "Qty Delta", index: 31, default:false },
        { label: "Qty Delta CTN", index: 32, default:false },
        { label: "Cust GR No", index: 33, default:false },
        { label: "Messages", index: 34, default:false },
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
            // hide all
            columns.forEach((col) => {
                const shouldShow = defaultColumns.includes(col.index);

                table.column(col.index - 1).visible(shouldShow);
            });

            setVisibleColumns(defaultColumns);
        } else {
            // show all
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
        axios.get(`${__API_URL__}/outstanding_cancel_doc/master`)
        .then(res=>{
            setOutstandingCancelDocData(res.data);
        })
        .catch(err=>console.error(err))
        .finally(() => {
            setLoading(false);
        });
    },[]);
    useEffect(() => {
        if (outstandingCancelDocData.length) {
            outstandingCancelDocData.map(item => {
                return [
                    item.cancel_type,
                    item.cust_po_no,
                    item.po_date,
                    item.exp_date,
                    item.shipment_date,
                    item.pod_date,
                    item.driver,
                    item.awb_no,
                    item.service_name,
                    item.do_date,
                    item.customer,
                    item.customer_alias,
                    item.dc_name,
                    item.area,
                    item.product_code,
                    item.std_pack,
                    item.qty_so,
                    item.qty_so_ctn,
                    item.qty_gr,
                    item.qty_gr_ctn,
                    item.qty_do,
                    item.qty_do_ctn,
                    item.qty_loading_ctn,
                    item.qty_pod_ctn,
                    item.qty_reject_ctn,
                    item.qty_dr,
                    item.qty_dr_ctn,
                    item.qty_cancelled,
                    item.qty_cancelled_ctn,
                    item.qty_delta,
                    item.qty_delta_ctn,
                    item.cust_gr_no,
                    item.messages,
                ];
            });

            if (!tableRef.current) {
                tableRef.current = $('#outstandingCancelDocTable').DataTable({
                    data: outstandingCancelDocData,
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
                        { data: "cancel_type", title: "Cancel Type" },
                        { data: "cust_po_no", title: "Cust PO No" },
                        {
                            data: "po_date",
                            title: "PO Date",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        {
                            data: "exp_date",
                            title: "Exp Date",
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
                        { data: "driver", title: "Driver" },
                        { data: "awb_no", title: "AWB No" },
                        { data: "service_name", title: "Service Name" },
                        {
                            data: "do_date",
                            title: "DO Date",
                            render: function(data) {
                                return formatDate(data);
                            }
                        },
                        { data: "customer", title: "Customer" },
                        { data: "customer_alias", title: "Customer Alias" },
                        { data: "dc_name", title: "DC Name" },
                        { data: "area", title: "Area" },
                        { data: "product_code", title: "Product Code" },
                        { data: "std_pack", title: "Std Pack" },
                        { data: "qty_so", title: "Qty SO" },
                        { data: "qty_so_ctn", title: "Qty SO CTN" },
                        { data: "qty_gr", title: "Qty GR" },
                        { data: "qty_gr_ctn", title: "Qty GR CTN" },
                        { data: "qty_do", title: "Qty DO" },
                        { data: "qty_do_ctn", title: "Qty DO CTN" },
                        { data: "qty_loading_ctn", title: "Qty Loading CTN" },
                        { data: "qty_pod_ctn", title: "Qty POD CTN" },
                        { data: "qty_reject_ctn", title: "Qty Reject CTN" },
                        { data: "qty_dr", title: "Qty DR" },
                        { data: "qty_dr_ctn", title: "Qty DR CTN" },
                        { data: "qty_cancelled", title: "Qty Cancelled" },
                        { data: "qty_cancelled_ctn", title: "Qty Cancelled CTN" },
                        { data: "qty_delta", title: "Qty Delta" },
                        { data: "qty_delta_ctn", title: "Qty Delta CTN" },
                        { data: "cust_gr_no", title: "Cust GR No" },
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
                tableRef.current.clear().rows.add(outstandingCancelDocData).draw();
            }
        }
    }, [outstandingCancelDocData]);
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
                                <table id="outstandingCancelDocTable" className="min-w-full table-auto">
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
    document.getElementById("outstanding_cancel_doc")
);
root.render(<OutstandingCancelDocTable />);