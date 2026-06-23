const { useEffect, useState, useRef }=React;
const DcTable = () => {
    const tableRef = useRef();
    const [dcData, setDcData] = useState([]);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState("");
    const [showColumn, setShowColumn] = useState(false);
    const [limit] = useState(10);
    const filterRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const columns = [
        { label: "DC Approved By", index: 1, default:true },
        { label: "DC Approved At", index: 2, default:true },
        { label: "Customer Code", index: 3, default: true },
        { label: "Customer Name", index: 4, default: true },
        { label: "DC Code", index: 5, default:true },
        { label: "DC Name", index: 6, default:true },
        { label: "City", index: 7, default: false },
        { label: "Area", index: 8, default: false },
        { label: "Min Lead Day", index: 9, default: false },
        { label: "Max Lead Day", index: 10, default: false },
        { label: "DC Address", index: 11, default: false },
        { label: "Phone 1", index: 12, default: false },
        { label: "Phone 2", index: 13, default: false },
        { label: "Kode Pos", index: 14, default: false },
        { label: "Pulau", index: 15, default: false },
        { label: "Propinsi", index: 16, default: false },
        { label: "Kabupaten", index: 17, default: false },
        { label: "Kecamatan", index: 18, default: false },
        { label: "Kelurahan", index: 19, default: false },
    ];
    const chunkSize = Math.ceil(columns.length / 3);
    const col1 = columns.slice(0, chunkSize);
    const col2 = columns.slice(chunkSize, chunkSize * 2);
    const col3 = columns.slice(chunkSize * 2);
    const [visibleColumns, setVisibleColumns] = useState(
        columns.filter(col => col.default).map(col => col.index)
    );
    const tableInstance = useRef(null);
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

        axios.get(`${__ODOO_URL__}/api/odoo/dc?search=${searchText}&limit=${limit}&offset=${offset}`)
            .then(res => {
                const result = res.data;

                setDcData(result.data.data || []);
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
                                    <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search..." className="w-18 pl-10 pr-4 py-1 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple focus:outline-none dark:text-black"/>
                                </div>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-excel-line text-md"></i> XLSX</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-pdf-2-line text-md"></i> PDF</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-hwp-line text-md"></i> CSV</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-printer-line text-md"></i> PRINT</button>
                                
                                <div className="relative">
                                    <button onClick={() => setShowColumn(!showColumn)} id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-layout-vertical-line text-md"></i> Columns</button>
                                    {showColumn && (
                                        <div className="absolute min-w-96 mt-2 right-0 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-xl p-4 z-50 whitespace-nowrap dark:text-black">
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
                                <thead class="text-left" style={{backgroundColor:'#0d2b5e'}}>
                                    <tr>
                                        <th className="text-white sticky left-0 bg-black z-10">No</th>
                                        {columns.map(col => 
                                            visibleColumns.includes(col.index) && (
                                                <th key={col.index} className="text-white">
                                                    {col.label}
                                                </th>
                                            )
                                            
                                        )}
                                        <th className="text-white sticky right-0 bg-gray-700 z-10">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dcData.map((item, index) => (
                                        <tr key={index} className="align-top">
                                            <td className="sticky left-0 bg-white z-10">{(currentPage - 1) * limit + index + 1}</td>
                                            {visibleColumns.includes(1) && <td>{item.approved_by}</td>}
                                            {visibleColumns.includes(2) && <td>{item.approved_at}</td>}
                                            {visibleColumns.includes(3) && <td>{item.customer.id}</td>}
                                            {visibleColumns.includes(4) && <td>{item.customer.name}</td>}
                                            {visibleColumns.includes(5) && <td>{item.dc_code}</td>}
                                            {visibleColumns.includes(6) && <td>{item.dc_name}</td>}
                                            {visibleColumns.includes(7) && <td>{item.city}</td>}
                                            {visibleColumns.includes(8) && <td>{item.area}</td>}
                                            {visibleColumns.includes(9) && <td>{item.min_lead_day}</td>}
                                            {visibleColumns.includes(10) && <td>{item.max_lead_day}</td>}
                                            {visibleColumns.includes(11) && (
                                            <td className="break-words whitespace-normal">
                                                {item.dc_address}
                                            </td>
                                            )}
                                            {visibleColumns.includes(12) && <td>{item.phone_1}</td>}
                                            {visibleColumns.includes(13) && <td>{item.phone_2}</td>}
                                            {visibleColumns.includes(14) && <td>{item.zip}</td>}
                                            {visibleColumns.includes(15) && <td>{item.pulau}</td>}
                                            {visibleColumns.includes(16) && <td>{item.propinsi}</td>}
                                            {visibleColumns.includes(17) && <td>{item.kabupaten}</td>}
                                            {visibleColumns.includes(18) && <td>{item.kecamatan}</td>}
                                            {visibleColumns.includes(19) && <td>{item.kelurahan}</td>}
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
    document.getElementById("dc")
);
root.render(<DcTable />);