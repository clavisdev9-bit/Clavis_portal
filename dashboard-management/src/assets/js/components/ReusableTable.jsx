const { useEffect, useState, useRef } = React;

const ReusableTable = ({
    title,
    endpoint,
    columns:initialColumns,
    elementId,
}) => {
    const [tableData, setTableData] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [columns, setColumns] = useState(initialColumns);
    const filterRef = useRef(null);
    const getNestedValue = (obj, path) => {
        return path.split(".").reduce((acc, part) => {
            return acc && acc[part];
        }, obj);
    };

    const fetchData = (page = 1) => {
        const offset = (page - 1) * limit;
        setLoading(true);
        axios
            .get(
                `${__ODOO_URL__}${endpoint}?search=${searchText}&limit=${limit}&offset=${offset}`
            )
            .then((res) => {
                const result = res.data;

                setTableData(result.data.data || []);
                setTotal(result.data.pagination.total || 0);
                setCurrentPage(page);
            })
            .catch((err) => console.error(err))
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData(1);
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchData(1);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchText]);

    const totalPages = Math.ceil(total / limit);

    const getPagination = (currentPage, totalPages) => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta &&
                    i <= currentPage + delta)
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
    const [loading, setLoading] = useState(false);
    const [showColumn, setShowColumn] = useState(false);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setShowColumn(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const visibleColumns = columns.filter(
        (col) => col.visible !== false
    );
    const selectableColumns = columns;

    const chunkSize = Math.ceil(
        selectableColumns.length / 3
    );

    const col1 = selectableColumns.slice(
        0,
        chunkSize
    );

    const col2 = selectableColumns.slice(
        chunkSize,
        chunkSize * 2
    );

    const col3 = selectableColumns.slice(
        chunkSize * 2
    );
    const formatDate = (dateString) => {
        if (!dateString) return "";

        return new Date(dateString).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };
    const formatMonth = (dateString) => {
        if (!dateString) return ;

        return new Date(dateString).toLocaleDateString("en-GB", {
            month: "long",
        });
    };
    const formatYear = (dateString) => {
        if (!dateString) return ;

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
        if (value == null) return ;

        const locale = "id-ID";

        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };
    const formatNumber = (value) => {
        if (value === null || value === undefined || value === "")
            return ;

        return Number(value).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };
    const formatters = {
        date: formatDate,
        number: formatNumber,
        currency: formatCurrency,
    };
    return (
        <div className="dark:bg-dark">
            <div class="card m-5 p-0">
                <div class="border border-gray-300 border-t-0 border-l-0 border-r-0 p-4 font-bold">
                    <i class="ri-filter-line"></i> Filter Panel
                </div>
                <div class="grid grid-cols-4 p-4 gap-4">
                    <div class="flex flex-col">
                        <label class="pb-2 font-medium">Date From</label>
                        <input type="date" class="border border-gray-300 rounded-md dark:bg-dark text-black dark:text-white date-input"/>
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
            <div className="flex flex-col gap-4 m-5 mt-0 min-h-[calc(100vh-212px)]">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 card relative overflow-visible">

                        {/* Header */}
                        <div className="grid grid-cols-2 content-between mb-2">
                            <h4 className="font-semibold pt-1">
                                {title}
                            </h4>

                            <div
                                className="flex justify-end gap-1"
                            >
                                <div class="relative">
                                    <span class="absolute left-3 top-2 text-gray-400">🔍</span>
                                    <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search..." className="w-18 pl-10 pr-4 py-1 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple focus:outline-none dark:bg-dark"/>
                                </div>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-excel-line text-md"></i> XLSX</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-pdf-2-line text-md"></i> PDF</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-file-hwp-line text-md"></i> CSV</button>
                                <button id="exportExcel" class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-printer-line text-md"></i> PRINT</button>
                                <div
                                    className="relative"
                                    ref={filterRef}
                                >
                                    <button
                                        onClick={() =>
                                            setShowColumn(!showColumn)
                                        }
                                        id="exportExcel"
                                        className="text-right py-1 px-3 font-medium rounded-md border border-gray-400"
                                    >
                                        <i className="ri-layout-vertical-line text-md"></i>
                                        {" "}Columns
                                    </button>

                                    {showColumn && (
                                        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-2xl p-4 z-[99999] max-h-[500px] overflow-y-auto inline-block min-w-max whitespace-nowrap">

                                            {/* Check All */}
                                            <label className="flex items-center border-b pb-2 mb-2 font-semibold cursor-pointer text-black dark:text-black">
                                                <input
                                                    type="checkbox"
                                                    className="mr-2 cursor-pointer"
                                                    checked={columns.every(
                                                        (col) =>
                                                            col.visible !== false
                                                    )}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;

                                                        setColumns((prev) =>
                                                            prev.map((col) => ({
                                                                ...col,

                                                                // index 1 - 6 selalu visible
                                                                visible:
                                                                    col.index <= 6
                                                                        ? true
                                                                        : checked,
                                                            }))
                                                        );
                                                    }}
                                                />
                                                Check All Columns
                                            </label>

                                            {/* Column List */}
                                            <div className="flex gap-8 w-max">
    
                                                {[col1, col2, col3].map((group, groupIndex) => (
                                                    <div key={groupIndex} className="flex flex-col pr-4 min-w-[220px]">
                                                        {group.map((col) => (
                                                            <label key={col.index} className="flex items-center gap-2 cursor-pointer text-black whitespace-nowrap">
                                                                <input type="checkbox" className="mt-1 flex-shrink-0 cursor-pointer" checked={col.visible !== false} 
                                                                onChange={() => {
                                                                        setColumns((prev) =>
                                                                            prev.map((item) =>
                                                                                item.index === col.index
                                                                                    ? {
                                                                                        ...item,
                                                                                        visible: !item.visible,
                                                                                    }
                                                                                    : item
                                                                            )
                                                                        );
                                                                    }}
                                                                />

                                                                <span className="whitespace-nowrap">
                                                                    {col.label}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ))}

                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto relative">
                            {loading && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 dark:bg-black/40 backdrop-blur-[2px] rounded-md">
                                    
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-white mb-3">
                                        <i className="ri-loader-4-line animate-spin text-lg"></i>
                                        Loading data...
                                    </div>

                                    <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-slate-700">
                                        <div className="h-full bg-blue-600 animate-pulse w-full"></div>
                                    </div>
                                </div>
                            )}
                            <table className={`table-fixed min-w-max transition-all duration-200 ${loading ? "blur-sm brightness-50 scale-[0.99] pointer-events-none select-none" : ""}`}>

                                <colgroup>
                                    <col style={{ width: "50px" }} />

                                    {visibleColumns.map((col) => (
                                        <col
                                            key={col.index}
                                            style={{
                                                width:
                                                    col.width ||
                                                    "200px",
                                            }}
                                        />
                                    ))}

                                    <col style={{ width: "80px" }} />
                                </colgroup>

                                <thead
                                    className="text-left"
                                    style={{
                                        backgroundColor:
                                            "#0d2b5e",
                                    }}
                                >
                                    <tr>
                                        <th className="text-white sticky left-0 bg-black dark:bg-blue-950 z-4">
                                            No
                                        </th>

                                        {visibleColumns.map((col) => (
                                            <th
                                                key={col.index}
                                                className="text-white"
                                            >
                                                {col.label}
                                            </th>
                                        ))}

                                        <th className="text-white sticky right-0 bg-gray-700 dark:bg-blue-950 z-10">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {tableData.map((item, index) => (
                                        <tr
                                            key={index}
                                            className="align-top"
                                        >
                                            {/* No */}
                                            <td className="sticky left-0 bg-white dark:bg-dark z-4">
                                                {(currentPage - 1) * limit + index + 1}
                                            </td>

                                            {/* Dynamic Columns */}
                                            {visibleColumns.map((col) => {
                                                const rawValue = getNestedValue(item, col.field);

                                                const formatter =
                                                    formatters[col.type];

                                                const value = formatter
                                                    ? formatter(rawValue)
                                                    : rawValue;

                                                return (
                                                    <td
                                                        key={col.index}
                                                        className={`
                                                            px-3 py-2
                                                            align-top
                                                            break-words
                                                            whitespace-normal
                                                            overflow-hidden
                                                            ${col.className || ""}
                                                        `}
                                                    >
                                                        {value}
                                                    </td>
                                                );
                                            })}

                                            {/* Actions */}
                                            <td className="sticky right-0 bg-white dark:bg-dark z-10">
                                                <i className="ri-eye-line"></i>

                                                <i className="ri-printer-line ml-3"></i>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="pt-3 text-right">

                            <button
                                onClick={() =>
                                    fetchData(
                                        currentPage - 1
                                    )
                                }
                                disabled={
                                    currentPage === 1
                                }
                                className={`px-2 rounded-md ${
                                    currentPage === 1
                                        ? "text-gray-400"
                                        : "border border-gray-400 text-black"
                                }`}
                            >
                                <i className="ri-arrow-left-double-line"></i>
                            </button>

                            {pages.map((p, index) => (
                                <button
                                    key={index}
                                    onClick={() =>
                                        typeof p ===
                                            "number" &&
                                        fetchData(p)
                                    }
                                    disabled={p === "..."}
                                    style={{
                                        margin: "0 1px",
                                        fontWeight:
                                            currentPage === p
                                                ? "bold"
                                                : "normal",
                                        cursor:
                                            p === "..."
                                                ? "default"
                                                : "pointer",
                                        backgroundColor:
                                            currentPage ===
                                            p
                                                ? "#0d2b5e"
                                                : "white",
                                        color:
                                            currentPage ===
                                            p
                                                ? "white"
                                                : "#0d2b5e",
                                    }}
                                    className="rounded-md px-2 content-center border border-gray-400"
                                >
                                    {p}
                                </button>
                            ))}

                            <button
                                onClick={() =>
                                    fetchData(
                                        currentPage + 1
                                    )
                                }
                                disabled={
                                    currentPage ===
                                    totalPages
                                }
                                className={`px-2 rounded-md content-center ${
                                    currentPage ===
                                    totalPages
                                        ? "text-gray-400"
                                        : "border border-gray-400 text-black"
                                }`}
                            >
                                <i className="ri-arrow-right-double-line"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
window.ReusableTable = ReusableTable;