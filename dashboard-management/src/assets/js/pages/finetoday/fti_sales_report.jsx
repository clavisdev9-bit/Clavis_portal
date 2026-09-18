const { useEffect, useState, useRef } = React;
const { DatePicker } = antd;
const { RangePicker } = DatePicker;

const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatDateID(dateStr) {
    if (!dateStr) {
        return '-';
    }
    const d = dayjs(dateStr);
    if (!d.isValid()) {
        return '-';
    }
    return d.date() + ' ' + MONTHS_ID[d.month()] + ' ' + d.year();
}

function formatRupiah(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return '-';
    }
    const parts = Number(value).toFixed(2).split('.');
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return 'Rp. ' + intPart + ',' + parts[1];
}

function formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return '-';
    }
    return Number(value).toLocaleString('id-ID');
}

function SalesReportCard() {
    const [ftiSales, setFtiSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const tableRef = useRef(null);
    const dtInstance = useRef(null);
    const [showColumn, setShowColumn] = useState(false);
    const columns = [
      { label: "Customer Name", index: 2, default: true },
      { label: "Customer PO Number", index: 3, default: true },
      { label: "MYE SO Number", index: 4, default: true },
      { label: "Delivery Address", index: 5, default: true },
      { label: "Request Delivery Date", index: 6, default: true },
      { label: "SO Qty", index: 7, default: true },
      { label: "Delivered Qty", index: 8, default: true },
      { label: "Brand", index: 9, default: true },
      { label: "Product Name", index: 10, default: true },
      { label: "Uom", index: 11, default: true },
      { label: "Unit Price", index: 12, default: true },
      { label: "SO Sub Total", index: 13, default: true },
      { label: "SO VAT", index: 14, default: true },
      { label: "SO VAT Amount", index: 15, default: true },
      { label: "SO Grand Total", index: 16, default: true },
      { label: "DO Sub Total", index: 17, default: true },
      { label: "DO VAT", index: 18, default: true },
      { label: "DO VAT Amount", index: 19, default: true },
      { label: "DO Grand Total", index: 20, default: true },
    ];
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
    const defaultColumns = [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const lockedColumns = [2, 4];
    
    const rangePresets = [
        { label: 'Today', value: [dayjs(), dayjs()] },
        { label: 'Last 7 Days', value: [dayjs().subtract(7, 'day'), dayjs()] },
        { label: 'Last 14 Days', value: [dayjs().subtract(14, 'day'), dayjs()] },
        { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
        { label: 'last 60 Days', value: [dayjs().subtract(90, 'day'), dayjs()] },
    ];
    const [defaultDates, setDefaultDates] = useState(null);
    const [startDate, setStartDate] = useState(dayjs().startOf('month').format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
    useEffect(() => {
        setDefaultDates([dayjs().startOf('month'), dayjs()]);
    }, []);
    const onRangeChange = (dates, dateStrings) => {
        if (dates) {
            setDefaultDates(dates);
            setStartDate(dateStrings[0]);
            setEndDate(dateStrings[1]);
        } else {
            setDefaultDates([dayjs(), dayjs()]);
            setStartDate(dayjs().startOf('month'));
            setEndDate(dayjs());
        }
    };
    useEffect(() => {
        setIsLoading(true);
        const params = {};
        if (startDate && endDate) {
            params.start_date = startDate;
            params.end_date = endDate;
        }
        axios.get(`${__API_URL__}/sales/fti_sales`, {params})
        .then(res => {
            console.log(res.data);
            setFtiSales(res.data);
        })
        .catch(console.error)
        .finally(() => {
            setIsLoading(false);
        });
    }, [startDate, endDate]);

    useEffect(() => {
        if (dtInstance.current) {
            dtInstance.current.destroy();
            dtInstance.current = null;
            if (tableRef.current) {
                $(tableRef.current).find('tbody').empty();
            }
        }

        if (tableRef.current && ftiSales.length > 0) {
            dtInstance.current = $(tableRef.current).DataTable({
                data: ftiSales,
                columns: [
                    {
                        title: 'No',
                        data: null,
                        defaultContent: '',
                        orderable: false,
                        searchable: false,
                        className: 'text-center',
                        width: '15px'
                    },
                    { title: 'Customer Name', data: 'customer_name', defaultContent: '-' },
                    { title: 'Customer PO Number', data: 'client_order_ref', defaultContent: '-' },
                    { title: 'MYE SO Number', data: 'name', defaultContent: '-' },
                    {
                        title: 'Delivery Address',
                        data: 'partner_shipping_id',
                        defaultContent: '-',
                        render: function (data) {
                            if (Array.isArray(data) && data.length > 1) {
                                return data[1];
                            }
                            return '-';
                        }
                    },
                    {
                        title: 'Request Delivery Date',
                        data: 'delivery_date',
                        defaultContent: '-',
                        render: function (data, type) {
                            if (type === 'sort' || type === 'type') {
                                return data ? data : '';
                            }
                            return formatDateID(data);
                        }
                    },
                    {
                        title: 'SO Qty',
                        data: 'so_qty',
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data) {
                            return formatNumber(data);
                        }
                    },
                    {
                        title: 'Delivered Qty',
                        data: 'delivered_qty',
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data) {
                            return formatNumber(data);
                        }
                    },
                    { title: 'Brand', data: 'brand', defaultContent: '-' },
                    {
                        title: 'Product Name',
                        data: 'product_name',
                        defaultContent: '-',
                    },
                    { title: 'Uom', data: 'uom', defaultContent: '-' },
                    {
                        title: 'Unit Price',
                        data: 'price_unit',
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data) {
                            return formatRupiah(data);
                        }
                    },
                    {
                        title: 'SO Sub Total',
                        data: 'price_subtotal',
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data) {
                            return formatRupiah(data);
                        }
                    },
                    {
                        title: 'SO VAT',
                        render: function () {
                            return '11%';
                        }
                    },
                    {
                        title: 'SO VAT Amount',
                        data: 'price_subtotal',
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data) {
                            return formatRupiah((data*11)/100);
                        }
                    },
                    {
                        title: 'SO Grand Total',
                        data: 'price_subtotal',
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data) {
                            return formatRupiah(data+((data*11)/100));
                        }
                    },
                    {
                        title: 'DO Sub Total',
                        data: null,
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data, type, row) {
                            const doQty = row.delivered_qty;
                            const unitPrice = row.price_unit;
                            if (doQty === null || doQty === undefined || unitPrice === null || unitPrice === undefined) {
                                return '-';
                            }
                            return formatRupiah(doQty * unitPrice);
                        }
                    },
                    {
                        title: 'DO VAT',
                        render: function () {
                            return '11%';
                        }
                    },
                    {
                        title: 'DO VAT Amount',
                        data: null,
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data, type, row) {
                            const doQty = row.delivered_qty;
                            const unitPrice = row.price_unit;
                            if (doQty === null || doQty === undefined || unitPrice === null || unitPrice === undefined) {
                                return '-';
                            }
                            return formatRupiah(((doQty * unitPrice)*11)/100);
                        }
                    },
                    {
                        title: 'DO Grand Total',
                        data: null,
                        defaultContent: '-',
                        className: 'text-right',
                        render: function (data, type, row) {
                            const doQty = row.delivered_qty;
                            const unitPrice = row.price_unit;
                            if (doQty === null || doQty === undefined || unitPrice === null || unitPrice === undefined) {
                                return '-';
                            }
                            return formatRupiah((doQty * unitPrice)+(((doQty * unitPrice)*11)/100));
                        }
                    },
                ],
                columnDefs: columns.map((col, i) => (
                    { targets: i + 1, visible: col.default }
                )),
                order: [[5, 'desc']],
                autoWidth: false,
                scrollX: true,
                scrollCollapse: true,
                drawCallback: function () {
                    const api = this.api();
                    const startIndex = api.page.info().start;
                    api.column(0, { order: 'current', search: 'applied', page: 'current' })
                        .nodes()
                        .each(function (cell, i) {
                            cell.innerHTML = startIndex + i + 1;
                        });
                }
            });
        }

        return () => {
            if (dtInstance.current) {
                dtInstance.current.destroy();
                dtInstance.current = null;
                if (tableRef.current) {
                    $(tableRef.current).find('tbody').empty();
                }
            }
        };
    }, [ftiSales]);
    const toggleColumn = (index) => {
        if (lockedColumns.includes(index)) {
            return;
        }
        const table = dtInstance.current;

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
        const table = dtInstance.current;

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

    // ===== Export Excel =====
    const getExportValue = (index, row) => {
        const doQty = row.delivered_qty;
        const unitPrice = row.price_unit;
        const hasDo = doQty !== null && doQty !== undefined && unitPrice !== null && unitPrice !== undefined;
        const doSubTotal = hasDo ? doQty * unitPrice : null;

        switch (index) {
            case 2: return row.customer_name || '-';
            case 3: return row.client_order_ref || '-';
            case 4: return row.name || '-';
            case 5:
                return (Array.isArray(row.partner_shipping_id) && row.partner_shipping_id.length > 1)
                    ? row.partner_shipping_id[1]
                    : '-';
            case 6: return row.delivery_date ? new Date(row.delivery_date) : '-';
            case 7: return (row.so_qty === null || row.so_qty === undefined) ? '-' : Number(row.so_qty);
            case 8: return (row.delivered_qty === null || row.delivered_qty === undefined) ? '-' : Number(row.delivered_qty);
            case 9: return row.brand || '-';
            case 10: return row.product_name || '-';
            case 11: return row.uom || '-';
            case 12: return (row.price_unit === null || row.price_unit === undefined) ? '-' : Number(row.price_unit);
            case 13: return (row.price_subtotal === null || row.price_subtotal === undefined) ? '-' : Number(row.price_subtotal);
            case 14: return '11%';
            case 15: return (row.price_subtotal === null || row.price_subtotal === undefined) ? '-' : Number((row.price_subtotal * 11) / 100);
            case 16: return (row.price_subtotal === null || row.price_subtotal === undefined) ? '-' : Number(row.price_subtotal + ((row.price_subtotal * 11) / 100));
            case 17: return hasDo ? Number(doSubTotal) : '-';
            case 18: return '11%';
            case 19: return hasDo ? Number((doSubTotal * 11) / 100) : '-';
            case 20: return hasDo ? Number(doSubTotal + ((doSubTotal * 11) / 100)) : '-';
            default: return '-';
        }
    };

    const thinBorder = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };

    const exportToExcel = async () => {
        if (!ftiSales || ftiSales.length === 0) return;

        const activeColumns = columns.filter(col => visibleColumns.includes(col.index));
        const totalCols = 1 + activeColumns.length; // +1 for "No"

        const sortedSales = [...ftiSales].sort((a, b) => {
            const dateA = a.delivery_date ? dayjs(a.delivery_date).valueOf() : 0;
            const dateB = b.delivery_date ? dayjs(b.delivery_date).valueOf() : 0;
            return dateB - dateA;
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('FTI Sales Report');

        // Row 1: Title
        worksheet.mergeCells(1, 1, 1, totalCols);
        const titleCell = worksheet.getCell(1, 1);
        titleCell.value = 'FTI Sales Report';
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'left', vertical: 'top' };

        // Row 2: date range, e.g. "2 Maret 2026 - 30 April 2026"
        const rangeText = (startDate && endDate)
            ? `${dayjs(startDate).format('D MMMM YYYY')} - ${dayjs(endDate).format('D MMMM YYYY')}`
            : '-';
        worksheet.mergeCells(2, 1, 2, totalCols);
        const rangeCell = worksheet.getCell(2, 1);
        rangeCell.value = rangeText;
        rangeCell.alignment = { horizontal: 'left', vertical: 'top' };

        // Row 3 intentionally left blank as spacer

        // Row 4: header
        const headerRowIndex = 4;
        const headerLabels = ['No', ...activeColumns.map(col => col.label)];
        headerLabels.forEach((label, i) => {
            const cell = worksheet.getCell(headerRowIndex, i + 1);
            cell.value = label;
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'left', vertical: 'top' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF00FFFF' } // cyan
            };
            cell.border = thinBorder;
        });

        const currencyColIndexes = [12, 13, 15, 16, 17, 19, 20];
        const currencyFormat = '[$-421]"Rp" #,##0.00';
        const qtyColIndexes = [7, 8];
        const qtyFormat = '[$-421]#,##0';

        sortedSales.forEach((row, rowIdx) => {
            const excelRowIndex = headerRowIndex + 1 + rowIdx;

            const noCell = worksheet.getCell(excelRowIndex, 1);
            noCell.value = rowIdx + 1;
            noCell.border = thinBorder;
            noCell.alignment = { vertical: 'top' };

            activeColumns.forEach((col, colPos) => {
                const cell = worksheet.getCell(excelRowIndex, colPos + 2);
                const value = getExportValue(col.index, row);
                cell.value = value;
                cell.border = thinBorder;
                cell.alignment = { vertical: 'top' };

                if (col.index === 6 && value instanceof Date) {
                    cell.numFmt = 'd mmm yyyy';
                } else if (currencyColIndexes.includes(col.index) && typeof value === 'number') {
                    cell.numFmt = currencyFormat;
                } else if (qtyColIndexes.includes(col.index) && typeof value === 'number') {
                    cell.numFmt = qtyFormat;
                }

                if (col.index === 10) {
                    cell.alignment = { wrapText: true, vertical: 'top' };
                }
            });
        });

        // Column widths: auto-fit to content, except "Product Name" fixed at 60
        worksheet.getColumn(1).width = Math.max(4, String(sortedSales.length).length + 2);
        activeColumns.forEach((col, i) => {
            const colNumber = i + 2;
            if (col.index === 10) {
                worksheet.getColumn(colNumber).width = 60;
                return;
            }
            let maxLen = col.label.length;
            sortedSales.forEach(row => {
                const val = getExportValue(col.index, row);
                let len;
                if (val instanceof Date) {
                    len = 12;
                } else if (typeof val === 'number') {
                    len = val.toLocaleString('id-ID').length + 4;
                } else {
                    len = String(val === null || val === undefined ? '' : val).length;
                }
                if (len > maxLen) maxLen = len;
            });
            worksheet.getColumn(colNumber).width = maxLen + 2;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fti_sales_report_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div class="col-span-12 2xl:col-span-12 order-[17] card" style={{ minWidth: 0 }}>
            <div className="grid-cols-1">
                <i className="fa-solid fa-filter dark:text-white text-sm"></i>
                <span className="ml-2 dark:text-white text-dark">
                    Filter
                </span>
            </div>
            <div className="grid-cols-12 border  border-t-0 border-l-0 border-r-0 py-2 filter-border">
                <label className="text-md col-span-2 text-dark dark:text-white font-medium pr-3 items-center">
                    Request Delivery Date &nbsp;&nbsp;&nbsp;&nbsp;
                </label>

                <RangePicker
                    presets={rangePresets}
                    value={defaultDates}
                    onChange={onRangeChange}
                    className={
                        defaultDates
                            ? "range-picker-date active col-span-10"
                            : "range-picker-date col-span-10"
                    }
                />
            </div>
            <div class="grid grid-cols-2 content-between mb-2 pt-3">
                <h4 class="font-semibold pt-1 dark:text-white">Finetoday Sales Report</h4>
                <div class="flex justify-end gap-2" ref={filterRef}>
                    <button
                        onClick={exportToExcel}
                        disabled={ftiSales.length === 0}
                        class="text-right py-1 px-3 font-medium rounded-md border border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <i class="ri-file-excel-2-line text-md"></i> Export Excel
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowColumn(!showColumn)} class="text-right py-1 px-3 font-medium rounded-md border border-gray-400"><i class="ri-layout-vertical-line text-md"></i> Columns</button>
                        {showColumn && (
                            <div className="absolute min-w-96 mt-2 right-0 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg shadow-xl p-4 z-50 whitespace-nowrap dark:text-black">
                                <div className="flex flex-col gap-3">

                                    {/* CHECK ALL */}
                                    <label className="flex items-center border-b pb-2 font-semibold cursor-pointer dark:text-white">
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
                                                <label key={col.index} className="flex items-center cursor-pointer dark:text-white">
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
                                                <label key={col.index} className="flex items-center cursor-pointer dark:text-white">
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
                                                <label key={col.index} className="flex items-center cursor-pointer dark:text-white">
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
            <div className="relative w-full">
                {isLoading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 dark:bg-slate-900/40">
                        <div className="flex flex-col items-center gap-2">
                            <i className="ri-loader-4-line animate-spin text-3xl text-primary-500"></i>
                            <span className="text-sm font-medium dark:text-white">Loading data...</span>
                        </div>
                    </div>
                )}
                {!isLoading && ftiSales.length === 0 && (
                    <div className="flex justify-center py-6">
                        <span className="text-sm font-medium dark:text-white">Tidak ada data</span>
                    </div>
                )}
                <div className="card-body" style={isLoading ? { minWidth: 0, filter: 'blur(2px)', pointerEvents: 'none', userSelect: 'none' } : { minWidth: 0 }}>
                    <div style={{ width: 0, minWidth: '100%' }}>
                        <table
                            ref={tableRef}
                            className="w-full display"
                            style={{ width: '100%', display: (!isLoading && ftiSales.length === 0) ? 'none' : undefined }}
                        >
                            <thead className="text-left">
                                <tr>
                                    <th>No</th>
                                    {columns.map(col => (
                                        <th key={col.index}>{col.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('sales_report'));
root.render(
    <SalesReportCard />
);