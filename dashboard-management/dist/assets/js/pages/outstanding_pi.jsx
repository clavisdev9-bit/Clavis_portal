const { useEffect, useState, useRef }=React;
const OutstandingPITable = () => {
    const [outstandingPiData, setOutstandingPiData] = useState([]);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState("");
    const [showColumn, setShowColumn] = useState(false);
    const [limit] = useState(10);
    const filterRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const columns = [
        { label: "Cust PO No", index: 1, default:true },
        { label: "PO Date", index: 2, default:true },
        { label: "GR No", index: 3, default:true },
        { label: "GR Date", index: 4, default:true },
        { label: "Exp Date", index: 5, default:true },
        { label: "Customer", index: 6, default:true },
        { label: "Customer Alias", index: 7, default:true },
        { label: "DC Name", index: 8, default:true },
        { label: "Area", index: 9, default:false },
        { label: "Total SKU", index: 10, default:false },
        { label: "Qty SO", index: 11, default:false },
        { label: "Qty SO CTN", index: 12, default:false },
        { label: "Qty GR", index: 13, default:false },
        { label: "Qty GRN CTN", index: 14, default:false },
        { label: "Qty DO", index: 15, default:false },
        { label: "Qty DO CTN", index: 16, default:false },
        { label: "Amt Bef. Tax", index: 17, default:false },
        { label: "Last Status", index: 18, default:false },
        { label: "Last Update", index: 19, default:false },
        { label: "Messages", index: 20, default:false }
    ];
    const chunkSize = Math.ceil(columns.length / 3);

    const col1 = columns.slice(0, chunkSize);
    const col2 = columns.slice(chunkSize, chunkSize * 2);
    const col3 = columns.slice(chunkSize * 2);
    const [visibleColumns, setVisibleColumns] = useState(
        columns.filter(col => col.default).map(col => col.index)
    );
    const toggleColumn = (index) => {
        setVisibleColumns(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index); // hide
            } else {
                return [...prev, index]; // show
            }
        });
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
    const fetchData = (page = 1) => {
        const offset = (page - 1) * limit;

        axios.get(`${__ODOO_URL__}/api/odoo/outstanding-pi?search=${searchText}&limit=${limit}&offset=${offset}`)
            .then(res => {
                const result = res.data;

                setOutstandingPiData(result.data.data || []);
                setTotal(result.data.pagination.total || 0);
                setCurrentPage(page);
            })
            .catch(err => console.error(err));
    };
    useEffect(() => {
        fetchData(1);
    }, []);
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchData(1);
        }, 500); // delay biar gak spam API

        return () => clearTimeout(delayDebounce);
    }, [searchText]);
    const totalPages = Math.ceil(total / limit);
    const getPagination = (currentPage, totalPages) => {
        const delta = 2; // jumlah halaman sekitar current
        const range = [];
        const rangeWithDots = [];

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                range.push(i);
            }
        }

        let last = 0;
        for (let i of range) {
            if (i - last > 1) {
                rangeWithDots.push("...");
            }
            rangeWithDots.push(i);
            last = i;
        }

        return rangeWithDots;
    };
    const pages = getPagination(currentPage, totalPages);
    const formatDate = (dateString) => {
        if (!dateString) return "-";

        return new Date(dateString).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
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
                        <input type="date" class="border border-gray-300 rounded-md"/>
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Date To</label>
                        <input type="date" class="border border-gray-300 rounded-md"/>
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Distribution Center</label>
                        <select class="border border-gray-300 rounded-md">
                            <option value="All DCs">All DCs</option>
                            <option value="DC Jakarta Barat">DC Jakarta Barat</option>
                            <option value="DC Surabaya">DC Surabaya</option>
                            <option value="DC Medan">DC Medan</option>
                            <option value="DC Bandung">DC Bandung</option>
                        </select>
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Status</label>
                        <select class="border border-gray-300 rounded-md">
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
                        <select class="border border-gray-300 rounded-md">
                            <option value="all_couriers">All Couriers</option>
                            <option value="jne">JNE</option>
                            <option value="JT Express">J&amp;T Express</option>
                            <option value="sicepat">SiCepat</option>
                            <option value="anteraja">Anteraja</option>
                        </select>
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Saved Filter</label>
                        <select class="border border-gray-300 rounded-md">
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
                                <div class="relative">
                                    <span class="absolute left-3 top-2 text-gray-400">🔍</span>
                                    <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search..." className="w-18 pl-10 py-1 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple focus:outline-none"/>
                                </div>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-excel-line text-md"></i> XLSX</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-pdf-2-line text-md"></i> PDF</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-hwp-line text-md"></i> CSV</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-printer-line text-md"></i> PRINT</button>
                                
                                <div className="relative">
                                    <button onClick={() => setShowColumn(!showColumn)} id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-layout-vertical-line text-md"></i> Columns</button>
                                    {showColumn && (
                                        <div className="absolute min-w-96 mt-2 right-0 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-xl p-4 z-50 whitespace-nowrap">
                                            <div className="flex gap-3">
                                                <div className="flex-1 flex flex-col">
                                                    {col1.map(col => (
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
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="overflow-auto">
                            <table border="1">

                                <thead className="text-left" style={{backgroundColor:'#0d2b5e'}}>
                                    <tr>
                                        <th class="text-white w-12 sticky left-0 bg-black z-10">No</th>
                                        {columns.map(col => 
                                            visibleColumns.includes(col.index) && (
                                                <th key={col.index} className="text-white">
                                                    {col.label}
                                                </th>
                                            )
                                        )}
                                        <th className="text-white sticky right-0 bg-black z-10">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {outstandingPiData.map((item, index) => (
                                        <tr key={index} className="align-top">
                                        <td className="sticky left-0 bg-white z-10">{(currentPage - 1) * limit + index + 1}</td>
                                            {visibleColumns.includes(1) && <td>{item.cust_po_no}</td>}
                                            {visibleColumns.includes(2) && <td>{formatDate(item.po_date)}</td>}
                                            {visibleColumns.includes(3) && <td>{item.gr_no}</td>}
                                            {visibleColumns.includes(4) && <td>{formatDate(item.gr_date)}</td>}
                                            {visibleColumns.includes(5) && <td>{item.exp_date}</td>}
                                            {visibleColumns.includes(6) && <td>{item.customer}</td>}
                                            {visibleColumns.includes(7) && <td>{item.customer_alias}</td>}
                                            {visibleColumns.includes(8) && <td>{item.dc_name}</td>}
                                            {visibleColumns.includes(9) && <td>{item.area}</td>}
                                            {visibleColumns.includes(10) && <td>{item.total_sku}</td>}
                                            {visibleColumns.includes(11) && <td>{item.qty_so}</td>}
                                            {visibleColumns.includes(12) && <td>{item.qty_so_ctn}</td>}
                                            {visibleColumns.includes(13) && <td>{item.qty_gr}</td>}
                                            {visibleColumns.includes(14) && <td>{item.qty_grn_ctn}</td>}
                                            {visibleColumns.includes(15) && <td>{item.qty_do}</td>}
                                            {visibleColumns.includes(16) && <td>{item.qty_do_ctn}</td>}
                                            {visibleColumns.includes(17) && <td>{item.amt_bef_tax}</td>}
                                            {visibleColumns.includes(18) && <td>{item.last_status}</td>}
                                            {visibleColumns.includes(19) && <td>{item.last_update}</td>}
                                            {visibleColumns.includes(20) && <td>{item.messages}</td>}
                                            <td className="sticky right-0 bg-white z-10"><i class="ri-eye-line"></i><i class="ri-printer-line ml-3"></i></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div class="pt-3 text-right">
                            <button 
                                onClick={() => fetchData(currentPage - 1)} 
                                disabled={currentPage === 1}
                                className={`px-2 rounded-md ${
                                    currentPage === 1
                                    ? "text-gray-400"
                                    : "border border-gray-400 text-black"
                                }`}
                            >
                                 <i class="ri-arrow-left-double-line"></i> 
                            </button>

                            {pages.map((p, index) => (
                                <button
                                    key={index}
                                    onClick={() => typeof p === "number" && fetchData(p)}
                                    disabled={p === "..."}
                                    style={{
                                        margin: "0 1px",
                                        fontWeight: currentPage === p ? "bold" : "normal",
                                        cursor: p === "..." ? "default" : "pointer",
                                        backgroundColor: currentPage === p ?'#0d2b5e':'white',
                                        color:currentPage === p ?'white':'#0d2b5e',
                                    }}
                                    className={`rounded-md px-2 content-center border border-gray-400`}
                                >
                                    {p}
                                </button>
                            ))}

                            <button 
                                onClick={() => fetchData(currentPage + 1)} 
                                disabled={currentPage === totalPages}
                                className={`px-2 rounded-md content-center ${
                                    currentPage === totalPages
                                    ? "text-gray-400"
                                    : "border border-gray-400 text-black"
                                }`}
                            >
                                 <i class="ri-arrow-right-double-line"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(
    document.getElementById("outstanding_pi")
);
root.render(<OutstandingPITable />);