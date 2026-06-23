const { useEffect, useState, useRef }=React;
const SellOutCustomerTable = () => {
    const tableRef = useRef();
    const [sellOutCustumerData, setSellOutCustomerData] = useState([]);
    const [showColumn, setShowColumn] = useState(false);
    const filterRef = useRef(null);
    const columns = [
        { label: "Cust PO No", index: 1 },
        { label: "PO Date", index: 2 },
        { label: "SO No", index: 3 },
        { label: "GRN No", index: 4 },
        { label: "GRN Date", index: 5 },
        { label: "DO No", index: 6 },
        { label: "DO Date", index: 7 },
    ];
    const tableInstance = useRef(null);
    const toggleColumn = (index) => {
        if (!tableInstance.current) return;

        const column = tableInstance.current.column(index);
        const isVisible = column.visible();

        column.visible(!isVisible);
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
        axios.get(`${__API_URL__}/sell_out_customer/master`)
            .then(res => setSellOutCustomerData(res.data))
            .catch(err => console.error(err));
    }, []); 
    useEffect(() => {
        if (!sellOutCustumerData || sellOutCustumerData.length === 0) return;

        // destroy jika sudah ada
        if (tableInstance.current) {
            tableInstance.current.destroy();
        }

        tableInstance.current = $(tableRef.current).DataTable({
            data: sellOutCustumerData, 
            columns: [
                {
                    title: "No",
                    data: null,
                    render: (data, type, row, meta) => meta.row + 1,
                },
                { title: "Cust PO No", data: "cust_po_no" },
                { title: "PO Date", data: "po_date" },
                { title: "SO No", data: "so_no" },
                { title: "GRN No", data: "grn_no" },
                { title: "GRN Date", data: "grn_date" },
                { title: "DO No", data: "do_no" },
                { title: "DO Date", data: "do_date" },
            ],
        });

        return () => {
            if (tableInstance.current) {
                tableInstance.current.destroy();
            }
        };
    }, [sellOutCustumerData]);
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
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-excel-line text-md"></i> XLSX</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-pdf-2-line text-md"></i> PDF</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-hwp-line text-md"></i> CSV</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-printer-line text-md"></i> PRINT</button>
                                
                                <div className="relative">
                                    <button onClick={() => setShowColumn(!showColumn)} id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-layout-vertical-line text-md"></i> Columns</button>
                                    {showColumn && (
                                        <div className="absolute top-full mt-2 right-0 w-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-darkborder rounded-lg shadow-xl p-1 z-50">
                                            <div class="grid grid-cols-1 gap-3">
                                                {showColumn && (
                                                    <div>
                                                        {/* 👉 RENDER DI SINI */}
                                                        {columns.map(col => (
                                                            <label key={col.index} className="inline-flex cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    defaultChecked
                                                                    onChange={() => toggleColumn(col.index)}
                                                                    class="form-checkbox text-primary"
                                                                />
                                                                <span>&nbsp;{col.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div class="w-full overflow-x-auto">
                            <table ref={tableRef} className="display" style={{ width: "100%" }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(
    document.getElementById("sell_out_customers")
);
root.render(<SellOutCustomerTable />);