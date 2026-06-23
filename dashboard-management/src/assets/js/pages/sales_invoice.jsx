const {useEffect,useState,useRef}=React;
function SalesInvoiceCard(){
    const tableRef = useRef(null);
    const [salesInvoiceData,setSalesInvoiceData]=useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [categoryNameData,setCategoryNameData]=useState([]);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState("");
    const [showColumn, setShowColumn] = useState(false);
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(today.getDate() - 30);
    const formatDateInput = (date) => {
        return date.toISOString().split("T")[0];
    };
    const [startDate, setStartDate] = useState(formatDateInput(oneMonthAgo));
    const [endDate, setEndDate] = useState(formatDateInput(today));
    const [limit] = useState(10);
    const filterRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const columns = [
        { label: "Invoice Date", index: 1, default:true },
        { label: "Month", index: 2, default:true },
        { label: "Year", index: 3, default:true },
        { label: "Customer", index: 4, default:true },
        { label: "No SO", index: 5, default:true },
        { label: "No Invoice", index: 6, default:true },
        { label: "Reference", index: 7, default:true },
        { label: "Brand", index: 8, default:true },
        { label: "Deskripsi", index: 9, default:false },
        { label: "Qty", index: 10, default:false },
        { label: "Price", index: 11, default:false },
        { label: "SI Amt Bef. Discount", index: 12, default:false },
        { label: "Discount", index: 13, default:false },
        { label: "Total SI Discount", index: 14, default:false },
        { label: "SI Amt Bef. Tax", index: 15, default:false },
        { label: "Tax", index: 16, default:false },
        { label: "Total Tax", index: 17, default:false },
        { label: "SI Amt Aft. Tax", index: 18, default:false },
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
    const setCategoryNameDatas = (data) => { 
        const categories = data.flatMap(item =>
            (item.lines || [])
                .map(line => line.category_name)
                .filter(Boolean)
        );

        return [...new Set(categories)];
    };
    const handleFilterCategory = (category) => {
        setSelectedCategory(category);

        if (!category) {
            setFilteredData(salesInvoiceData);
            return;
        }

        const filtered = salesInvoiceData
            .map(item => {
                // filter lines sesuai category
                const filteredLines = (item.lines || []).filter(
                    line => line.category_name === category
                );

                // hanya return item kalau masih ada line
                if (filteredLines.length > 0) {
                    return {
                        ...item,
                        lines: filteredLines
                    };
                }

                return null;
            })
            .filter(Boolean); // hapus null

        setFilteredData(filtered);
    };
    const fetchData = (page = 1) => {
        const offset = (page - 1) * limit;
        axios.get(`${__ODOO_URL__}/api/odoo/mye/get/si?start_date=${startDate}&end_date=${endDate}&limit=${limit}&offset=${offset}`)
            .then(res => {
                const result = res.data;
                const salesData=result.data.data;
                setSalesInvoiceData(result.data.data || []);
                setFilteredData(salesData);
                setCategoryNameData(setCategoryNameDatas(salesData));
                setTotal(result.data.pagination.total || 0);
                setCurrentPage(page);
            })
            .catch(err => console.error(err));
    };
    useEffect(() => {
        fetchData(1);
    }, [startDate, endDate]);
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
    let rowNumber = 1;
    const formatDate = (dateString) => {
        if (!dateString) return "-";

        return new Date(dateString).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
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
    const formatCurrency = (value, currency = "IDR") => {
        if (value == null) return "-";

        // mapping locale biar format sesuai negara
        // const localeMap = {
        //     IDR: "id-ID",
        //     EUR: "de-DE",
        //     USD: "en-US"
        // };

        const locale = "id-ID";

        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
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
                    item.invoice_origin,
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
        <div class="pt-4">
            <div class="card m-5 p-0">
                <div class="border border-gray-300 border-t-0 border-l-0 border-r-0 px-4 py-2 font-bold">
                    <i class="ri-filter-line"></i> Filter
                </div>
                <div class="grid grid-cols-4 p-4 gap-4">
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Start Date</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} class="border border-gray-300 rounded-md" />
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">End Date</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}  class="border border-gray-300 rounded-md"/>
                    </div>
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Category</label>
                        <select value={selectedCategory} onChange={(e) => handleFilterCategory(e.target.value)} className="border border-gray-300 rounded-md">
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
                                <div class="relative">
                                    <span class="absolute left-3 top-2 text-gray-400">🔍</span>
                                    <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search..." className="w-18 pl-10 pr-4 py-1 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple focus:outline-none"/>
                                </div>
                                <button class="text-right py-1 px-3 font-medium rounded-md border border-gray-400" onClick={exportToExcel}><i class="ri-file-excel-line text-md"></i> XLSX</button>
                                <button id="exportPdf" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-pdf-2-line text-md"></i> PDF</button>
                                <button id="exportCsv" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-hwp-line text-md"></i> CSV</button>
                                <button id="printInvoice" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-printer-line text-md"></i> PRINT</button>
                                
                                <div className="relative">
                                    <button onClick={() => setShowColumn(!showColumn)} class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-layout-vertical-line text-md"></i> Columns</button>
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
                        <div className="overflow-y-auto" style={{height:550}}>
                            <table className="min-w-full border-separate border-spacing-0">
                                <thead className="text-left">
                                    <tr>
                                        <th className="text-white sticky top-0 left-0 bg-blue-600 z-50">No</th>
                                        {columns.map(col => 
                                            visibleColumns.includes(col.index) && (
                                                <th key={col.index} className="text-white sticky top-0 bg-blue-600 z-40">
                                                    {col.label}
                                                </th>
                                            )
                                        )}
                                        <th className="text-white sticky top-0 right-0 bg-blue-600 z-10">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item, index) => (
                                        
                                        item.lines.map((line, lineIndex) => (
                                            <tr key={`${index}-${lineIndex}`} className="align-top">
                                                <td className="sticky left-0 bg-white z-30">
                                                    {rowNumber++}
                                                </td>

                                                {visibleColumns.includes(1) && <td>{formatDate(item.invoice_date)}</td>}
                                                {visibleColumns.includes(2) && <td>{formatMonth(item.invoice_date)}</td>}
                                                {visibleColumns.includes(3) && <td>{formatYear(item.invoice_date)}</td>}
                                                {visibleColumns.includes(4) && <td>{item.invoice_partner_display_name}</td>}
                                                {visibleColumns.includes(5) && <td>{item.invoice_origin}</td>}
                                                {visibleColumns.includes(6) && <td>{item.name}</td>}
                                                {visibleColumns.includes(7) && <td>{item.ref}</td>}
                                                {visibleColumns.includes(8) && <td>{line.category_name}</td>}
                                                {visibleColumns.includes(9) && <td>{line.name}</td>}
                                                {visibleColumns.includes(10) && <td>{line.quantity}</td>}
                                                {visibleColumns.includes(11) && <td>{formatRupiah(line.price_unit)}</td>}
                                                {visibleColumns.includes(12) && <td>{formatRupiah(line.quantity*line.price_unit)}</td>}
                                                {visibleColumns.includes(13) && <td>{line.discount}%</td>}
                                                {visibleColumns.includes(14) && <td>{formatRupiah(((line.quantity*line.price_unit)*line.discount/100))}</td>}
                                                {visibleColumns.includes(15) && <td>{formatRupiah(line.price_subtotal)}</td>}
                                                {visibleColumns.includes(16) && 
                                                <td>
                                                    {line.tax_ids && line.tax_ids.length > 0
                                                    ? parseInt(line.tax_ids[0][1].match(/\d+/)?.[0] || 0, 10)+'%'
                                                    : 0}
                                                </td>}
                                                {visibleColumns.includes(17) && 
                                                <td>{
                                                        (line.tax_ids &&
                                                        line.tax_ids.length > 0 &&line.tax_ids[0][1].match(/\d+/))?
                                                        formatRupiah((parseInt(line.tax_ids[0][1].match(/\d+/)[0], 10) * line.price_subtotal)/100):'0,00'
                                                    }
                                                </td>}
                                                {visibleColumns.includes(18) && 
                                                <td>{
                                                        (line.tax_ids &&
                                                        line.tax_ids.length > 0 &&line.tax_ids[0][1].match(/\d+/))?
                                                        formatRupiah(line.price_subtotal+((parseInt(line.tax_ids[0][1].match(/\d+/)[0], 10) * line.price_subtotal)/100)):
                                                        formatRupiah(line.price_subtotal)
                                                    }
                                                </td>}

                                                <td className="sticky right-0 bg-white z-20">
                                                    <i className="ri-eye-line"></i>
                                                    <i className="ri-printer-line ml-3"></i>
                                                </td>
                                            </tr>
                                        ))
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* <div class="pt-3 text-right">
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
                        </div> */}
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