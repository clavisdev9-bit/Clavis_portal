const {useEffect,useState,useRef}=React;
function SalesInvoiceCard(){
    const tableRef = useRef(null);
    const [salesInvoiceData,setSalesInvoiceData]=useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [categoryNameData,setCategoryNameData]=useState([]);
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(false);
    const columns = [
        { label: "Invoice Date", index: 1 },
        { label: "Month", index: 2 },
        { label: "Year", index: 3 },
        { label: "Customer", index: 4 },
        { label: "No SO", index: 5 },
        { label: "No Invoice", index: 6 },
        { label: "Reference", index: 7 },
        { label: "Brand", index: 8 },
        { label: "Deskripsi", index: 9 },
        { label: "Qty", index: 10 },
        { label: "Price", index: 11 },
        { label: "SI Amt Bef. Discount", index: 12 },
        { label: "Discount", index: 13 },
        { label: "Total SI Discount", index: 14 },
        { label: "SI Amt Bef. Tax", index: 15 },
        { label: "Tax", index: 16 },
        { label: "Total Tax", index: 17 },
        { label: "SI Amt Aft. Tax", index: 18 },
    ];

    // default tampil
    const defaultColumns = [1,2,3,4,5,6,7,8];

    // tidak bisa di-hide
    const lockedColumns = [1,2];

    const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
    const allColumnIndexes = columns.map(col => col.index);

    const isAllChecked =
        allColumnIndexes.every(index => visibleColumns.includes(index));

    const toggleAllColumns = () => {
        const table = tableRef.current;

        if (!table) return;

        if (isAllChecked) {
            // sisakan locked column
            columns.forEach((col) => {
                const columnIndex = col.index;

                if (!defaultColumns.includes(columnIndex)) {
                    table.column(columnIndex).visible(false);
                }
            });

            setVisibleColumns([...defaultColumns]);
        } else {
            // tampilkan semua
            columns.forEach((col) => {
                const columnIndex = col.index;

                table.column(columnIndex).visible(true);
            });

            setVisibleColumns(allColumnIndexes);
        }
    };
    const [showColumn, setShowColumn] = useState(false);
    const chunkSize = Math.ceil(columns.length / 3);

    const col1 = columns.slice(0, chunkSize);
    const col2 = columns.slice(chunkSize, chunkSize * 2);
    const col3 = columns.slice(chunkSize * 2);
    const filterRef = useRef(null);
    const toggleColumn = (index) => {
        // locked column tidak bisa di-hide
        if (lockedColumns.includes(index)) return;

        const table = tableRef.current;

        if (!table) return;

        const columnIndex = index;

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
    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setShowColumn(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(today.getDate() - 30);
    const formatDateInput = (date) => {
        return date.toISOString().split("T")[0];
    };
    const [startDate, setStartDate] = useState(formatDateInput(oneMonthAgo));
    const [endDate, setEndDate] = useState(formatDateInput(today));
    
    useEffect(()=>{
        setLoading(true);
        axios.get(`${__ODOO_URL__}/api/odoo/mye/get/si?start_date=${startDate}&end_date=${endDate}`)
        .then(res=>{
            setSalesInvoiceData(res.data.data.data);
        })
        .catch(err=>console.error(err))
        .finally(() => {
            setLoading(false);
        });
    },[startDate, endDate]);
    useEffect(() => {
        setFilteredData(salesInvoiceData);
        setCategoryNameData(setCategoryNameDatas(salesInvoiceData));
    }, [salesInvoiceData]);
    useEffect(() => {
        if (filteredData.length) {
            let rowNumber = 1;
            const flatData = filteredData.flatMap((item, parentIndex) =>
                item.lines.map((line, lineIndex) => {
                    const qty = Number(line.quantity) || 0;
                    const price = Number(line.price_unit) || 0;
                    const discount = Number(line.discount) || 0;

                    const subtotal = qty * price;
                    const discountValue = subtotal * discount / 100;

                    const taxPercent = line.tax_ids && line.tax_ids.length > 0
                        ? parseInt(line.tax_ids[0][1].match(/\d+/)?.[0] || 0, 10)
                        : 0;

                    const taxAmount = (taxPercent * subtotal) / 100;
                    const total = subtotal + taxAmount;

                    return [
                        rowNumber++,
                        {
                            display: formatDate(item.invoice_date),
                            sort: new Date(item.invoice_date).getTime()
                        },
                        formatMonth(item.invoice_date),
                        formatYear(item.invoice_date),
                        item.invoice_partner_display_name,
                        item.invoice_origin === false ? '-' : item.invoice_origin,
                        item.name,
                        item.ref,
                        line.category_name,
                        line.name,
                        qty,
                        formatRupiah(price),
                        formatRupiah(subtotal),
                        discount + '%',
                        formatRupiah(discountValue),
                        formatRupiah(line.price_subtotal),
                        taxPercent + '%',
                        formatRupiah(taxAmount),
                        formatRupiah(total),

                        // ACTIONS
                        `
                            <div class="flex items-center justify-center">
                                <i class="ri-eye-line cursor-pointer"></i>
                                <i class="ri-printer-line ml-3 cursor-pointer"></i>
                            </div>
                        `
                    ];
                })
            );

            if (!tableRef.current) {
                tableRef.current = $('#salesInvoiceTable').DataTable({
                    data: flatData,
                    columns: [
                        {
                            title: "No"
                        },
                        {
                            title: "Invoice Date",
                            render: function (data, type) {
                                if (type === 'sort') return data.sort;
                                return data.display;
                            }
                        },
                        { title: "Month" },
                        { title: "Year" },
                        { title: "Customer" },
                        { title: "No SO" },
                        { title: "No Invoice" },
                        { title: "Reference" },
                        { title: "Brand" },
                        { title: "Deskripsi" },
                        { title: "Qty" },
                        { title: "Price" },
                        { title: "SI Amt Bef. Discount" },
                        { title: "Discount" },
                        { title: "Total SI Discount" },
                        { title: "SI Amt Bef. Tax" },
                        { title: "Tax" },
                        { title: "Total Tax" },
                        { title: "SI Amt Aft. Tax" },

                        // ACTIONS
                        {
                            title: "Actions",
                            orderable: false,
                            searchable: false
                        }
                    ],

                    order: [[1, 'desc']],

                    scrollX: true,
                    scrollCollapse: true,

                    fixedColumns: {
                        leftColumns: 1,
                        rightColumns: 1
                    },

                    autoWidth: true,

                    columnDefs: [
                        ...columns.map((col, i) => ({
                            targets: i + 1,
                            visible: visibleColumns.includes(col.index)
                        })),

                        {
                            targets: 0,
                            width: "auto",
                            className: "dt-center"
                        },

                        {
                            targets: 9,
                            width: "400px",
                            createdCell: function (td) {
                                $(td).css({
                                    "white-space": "normal",
                                    "word-break": "break-word"
                                });
                            }
                        },

                        {
                            targets: -1,
                            width: "auto",
                            className: "dt-center",
                            orderable: false
                        }
                    ]
                });
            } else {
                tableRef.current.clear().rows.add(flatData).draw();
            }
        }
    }, [filteredData]);
    
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
        if (tableRef.current) {
            tableRef.current.search(searchText).draw();
        }
    }, [searchText]);
    const handleFilterCategory = (category) => {
        setSelectedCategory(category);

        if (!category) {
            setFilteredData(salesInvoiceData);
            return;
        }

        const filtered = salesInvoiceData
            .map(item => {
                const filteredLines = (item.lines || []).filter(
                    line => line.category_name === category
                );

                if (filteredLines.length > 0) {
                    return { ...item, lines: filteredLines };
                }

                return null;
            })
            .filter(Boolean);

        setFilteredData(filtered);
    };

    const formatMonth = (dateString) => {
        if (!dateString) return "-";

        return new Date(dateString).toLocaleDateString("en-GB", {
            month: "long",
        });
    };
    const formatYear = (dateString) => {
        if (!dateString) return "-";

        return new Date(dateString).toLocaleDateString("en-GB", {
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

        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits,
            maximumFractionDigits,
        }).format(number);
    };
    const formatCurrency = (value, currency = "IDR") => {
        if (value == null) return "-";

        const locale = "id-ID";

        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };
    const setCategoryNameDatas = (data) => { 
        const categories = data.flatMap(item =>
            (item.lines || [])
                .map(line => line.category_name)
                .filter(Boolean)
        );

        return [...new Set(categories)];
    };
    const autoSizeColumns = (data) => {
        return data[0].map((_, colIndex) => {
            const maxLength = data.reduce((max, row) => {
                const cell = row[colIndex];
                const length = cell ? cell.toString().length : 0;
                return Math.max(max, length);
            }, 10);

            return { wch: maxLength + 2 }; 
        });
    };
    const exportToExcel = () => {
        const headers = [
            "Invoice Date", "Month", "Year", "Customer",
            "SO Number", "Invoice Number",
            "Reference", "Brand", "Deskripsi", "Qty",
            "Price", "SI Amt Bef. Discount", "Discount", "Total SI Discount",
            "SI Amt Bef. Tax", "Tax", "Total Tax", "SI Amt Aft. Tax"
        ];
        const currencyMap = {
            IDR: '"Rp"#,##0.00',
            USD: '"$"#,##0.00',
            EUR: '"€"#,##0.00'
        };
        const currency = "IDR";
        
        const data = filteredData.flatMap((item) =>
            item.lines.map((line) => {
                const qty = Number(line.quantity) || 0;
                const price = Number(line.price_unit) || 0;
                const discount = Number(line.discount) || 0;

                const subtotal = qty * price;
                const discountValue = subtotal * discount/100;

                const taxPercent = line.tax_ids && line.tax_ids.length > 0
                ? parseInt(line.tax_ids[0][1].match(/\d+/)?.[0] || 0, 10)
                : 0;

                const taxAmount = (taxPercent * subtotal) / 100;
                const total = subtotal + taxAmount;
                
                return [
                    item.invoice_date === 'false' ? '-' : formatDate(item.invoice_date),
                    item.invoice_date === 'false' ? '-' : formatMonth(item.invoice_date),
                    item.invoice_date === 'false' ? '-' : formatYear(item.invoice_date),
                    item.invoice_partner_display_name,
                    item.invoice_origin==='false'?'-':item.invoice_origin,
                    item.name === false ? '-' : item.name,
                    item.ref,
                    line.product_id === null ? '-' : line.product_id[1],
                    line.name,
                    qty,
                    price,
                    subtotal,
                    discount,
                    discountValue,
                    line.price_subtotal,
                    taxPercent,
                    taxAmount,
                    total
                ];
            })
        );
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const range = XLSX.utils.decode_range(ws['!ref']);
        const currencyCols = [10, 11, 13, 14, 16, 17]; 
        currencyCols.forEach((colIndex) => {
            for (let row = 1; row <= range.e.r; row++) {
                const cell = XLSX.utils.encode_cell({ r: row, c: colIndex });

                if (!ws[cell]) continue;

                ws[cell].t = 'n';
                ws[cell].z = '#,##0.00';
            }
        });
        headers.forEach((_, colIndex) => {
            const cell = XLSX.utils.encode_cell({ r: 0, c: colIndex });

            if (ws[cell]) {
                ws[cell].s = {
                    font: {
                        bold: true,
                        color: { rgb: "FFFFFF" }
                    },
                    fill: {
                        fgColor: { rgb: "1E3A8A" } // biru
                    },
                    alignment: {
                        horizontal: "center"
                    }
                };
            }
        });
        const allData = [headers, ...data];
        ws['!cols'] = autoSizeColumns(allData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Invoice");
        const randomText = Math.random().toString(36).substring(2, 8);
        const randomDate = Date.now();
        XLSX.writeFile(wb, `Sales Invoice ${randomDate} ${randomText}.xlsx`);
    };
    return (
        <div class="pt-4 dark:bg-dark">
            <div class="card m-5 p-0">
                <div class="border border-gray-300 border-t-0 border-l-0 border-r-0 px-4 py-2 font-bold">
                    <i class="ri-filter-line"></i> Filter
                </div>
                <div class="grid grid-cols-4 p-4 gap-4">
                    <div class="flex flex-col">
                        <label className="pb-2 font-medium">Start Date</label>
                        <input type="date" value={startDate}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value > endDate) {
                                alert("Start Date tidak boleh melebihi End Date");
                                return;
                            }else{
                                setStartDate(value);
                            }
                        }} className="border border-gray-300 rounded-md dark:bg-dark dark:text-white date-input"/>
                    </div>
                    <div class="flex flex-col">
                        <label className="pb-2 font-medium">End Date</label>
                        <input type="date" value={endDate}
                        onChange={(e) => {
                            const value = e.target.value;

                            if (value < startDate) {
                                alert("End Date tidak boleh kurang dari Start Date");
                                return;
                            }else{
                                setEndDate(value);
                            }
                        }} className="border border-gray-300 rounded-md dark:bg-dark dark:text-white date-input"/>
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Category</label>
                        <select value={selectedCategory} onChange={(e) => handleFilterCategory(e.target.value)} className="border border-gray-300 rounded-md dark:bg-dark">
                            <option value="">All Category</option>
                            {categoryNameData.map(category => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
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
                                
                                <div className="relative">
                                    <button class="text-right py-1 px-3 font-medium rounded-md border border-gray-400" onClick={exportToExcel}><i class="ri-file-excel-line text-md"></i> XLSX</button>&nbsp;
                                    <button onClick={() => setShowColumn(!showColumn)} class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-layout-vertical-line text-md"></i> Columns</button>
                                    {showColumn && (
                                        <div className="absolute min-w-96 mt-2 right-0 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-xl p-4 z-50 whitespace-nowrap dark:text-black">
                                            <div className="border-b pb-2 mb-2">
                                                <label className="flex items-center cursor-pointer font-semibold">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllChecked}
                                                        onChange={toggleAllColumns}
                                                        className="mr-2 cursor-pointer"
                                                    />
                                                    <span>Check All Columns</span>
                                                </label>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex-1 flex flex-col">
                                                    {col1.map(col => (
                                                        <label key={col.index} className="flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={visibleColumns.includes(col.index)}
                                                                disabled={lockedColumns.includes(col.index)}
                                                                onChange={() => toggleColumn(col.index)}
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
                                <table id="salesInvoiceTable" className="min-w-full table-auto">
                                    <thead>
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
}

const root = ReactDOM.createRoot(
    document.getElementById("sales_invoice")
);
root.render(<SalesInvoiceCard />);