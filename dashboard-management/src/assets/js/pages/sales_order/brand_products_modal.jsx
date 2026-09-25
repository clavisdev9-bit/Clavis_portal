const COMPANY_TITLES = {
    "2": "PT. DUTA INDO MANDIRI",
    "3": "PT. My Everything Indonesia",
    "4": "PT. CLAVIS APPAREL INDONESIA",
    "11": "PT. DUTA INDO RAYA",
};
const RP_FORMAT_ZERO = '_-"Rp"* #,##0.00_-;\\-"Rp"* #,##0.00_-;_-"Rp"* 0.00_-;_-@_-';
window.BrandProductsModal = function BrandProductsModal({
    show, onClose, startDate, endDate, filterType, selectedCompany,
    brandName, productName, categoryName, endpoint = "/invoices/products",
}) {
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [productsData, setProductsData] = useState([]);

    const tableElRef = React.useRef(null);
    const dataTableInstanceRef = React.useRef(null);

    // angka biasa + pemisah ribuan, TANPA format currency (Rp./K/M/B)
    const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

    // format currency KHUSUS modal ini, dalam satuan ribuan rupiah — sama
    // seperti order_data_modal.jsx / invoice_data_modal.jsx. "Rp." & nominal
    // dibungkus kotak lebar TETAP (bukan w-full, supaya jaraknya tidak ikut
    // melebar), kotak itu didorong rata kanan sel lewat ml-auto. Contoh:
    // 50.000.000 -> "Rp. 50.000", 500.000 -> "Rp. 500"
    const formatCurrencyAccounting = (value) => {
        const amount = Number(value);
        if (isNaN(amount)) return "-";
        const formatted = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(amount / 1000);
        return `<span class="flex w-20 ml-auto justify-between"><span class="shrink-0">Rp.</span><span>${formatted}</span></span>`;
    };

    // parse string tanggal format Indonesia ("3 Agustus 2026") jadi
    // timestamp, khusus untuk SORTING kolom "date" — string itu sendiri
    // tetap ditampilkan apa adanya, cuma dipakai timestamp-nya untuk
    // menentukan urutan kronologis yang benar (bukan urutan alfabetis)
    const monthNamesId = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const parseIndonesianDate = (str) => {
        if (!str || typeof str !== "string") return 0;
        const parts = str.split(" ");
        if (parts.length !== 3) return 0;
        const day = parseInt(parts[0], 10);
        const monthIndex = monthNamesId.indexOf(parts[1]);
        const year = parseInt(parts[2], 10);
        if (monthIndex === -1 || isNaN(day) || isNaN(year)) return 0;
        return new Date(year, monthIndex, day).getTime();
    };

    // fetch products — hanya saat modal terbuka
    useEffect(() => {
        if (!show) return;
        const params = {};
        if (startDate && endDate && filterType) {
            params.start_date = startDate;
            params.end_date = endDate;
            params.filter_type = filterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        if (brandName) {
            params.brand_name = brandName;
        }
        if (productName) {
            params.product_name = productName;
        }
        if (categoryName) {
            params.category = categoryName;
        }
        setIsLoadingProducts(true);
        axios.get(`${__API_URL__}${endpoint}`, { params })
            .then(res => {
                console.log(res.data);
                setProductsData(res.data);
            })
            .catch(console.error)
            .finally(() => setIsLoadingProducts(false));
    }, [show, startDate, endDate, filterType, selectedCompany, brandName, productName, categoryName, endpoint]);

    // render datatable — hanya jalan kalau elemen <table> sudah ter-mount
    useEffect(() => {
        if (!productsData.length || !tableElRef.current) return;
        const targetEl = tableElRef.current;

        if (dataTableInstanceRef.current) {
            dataTableInstanceRef.current.destroy();
            dataTableInstanceRef.current = null;
        }

        const baseColumns = [
            {
                title: "No",
                data: null,
                className: "text-center align-top",
                // TIDAK pakai render meta.row di sini — meta.row adalah
                // index di data ASLI (sebelum sorting), bukan posisi
                // tampilan setelah di-sort. Nomornya diisi lewat
                // drawCallback di bawah, yang jalan SETELAH DataTables
                // selesai sorting/paging.
            },
            {
                title: "Write Date",
                data: "date",
                className: "align-top",
                render: function (data, type) {
                    // untuk sorting/type internal DataTables, pakai
                    // timestamp; untuk tampilan (display/filter), pakai
                    // string aslinya
                    if (type === "sort" || type === "type") {
                        return parseIndonesianDate(data);
                    }
                    return data;
                }
            },
            { title: "Customer Name", data: "customer_name", className: "align-top" },
            {
                title: "Product Name",
                data: "product_name",
                width: "300px",
                className: "max-w-[260px] whitespace-normal break-words align-top",
            },
            { title: "Category", data: "category", className: "align-top" },
            {
                title: "Price Unit",
                data: "price_unit",
                className: "text-left align-top",
                render: function (data, type) {
                    // untuk sorting/type internal DataTables, pakai angka
                    // asli supaya urut numerik; untuk tampilan (display/
                    // filter), pakai format accounting ("Rp." sejajar,
                    // nominal rata kanan)
                    if (type === "sort" || type === "type") {
                        return data;
                    }
                    return formatCurrencyAccounting(data);
                }
            },
            {
                title: "Qty",
                data: "quantity",
                className: "text-right align-top",
            },
            {
                title: "Subtotal",
                data: "price_subtotal",
                className: "text-left align-top",
                render: function (data, type) {
                    if (type === "sort" || type === "type") {
                        return data;
                    }
                    return formatCurrencyAccounting(data);
                }
            },
            {
                title: "Tax",
                data: "tax",
                className: "text-left align-top",
                render: function (data, type) {
                    if (type === "sort" || type === "type") {
                        return data;
                    }
                    return formatCurrencyAccounting(data);
                }
            },
            {
                title: "Total",
                data: "total_amount",
                className: "text-left align-top",
                render: function (data, type) {
                    if (type === "sort" || type === "type") {
                        return data;
                    }
                    return `<span class="font-medium">${formatCurrencyAccounting(data)}</span>`;
                }
            },
        ];

        // Sisipkan kolom Company Name setelah "No" & "Date" (index 2),
        // KHUSUS saat selectedCompany kosong (tampilan ALL COMPANY) — di
        // luar itu, company sudah jelas dari filter jadi tidak perlu
        // ditampilkan lagi per baris
        const columns = selectedCompany === ''
            ? [
                baseColumns[0],
                baseColumns[1],
                { title: "Company Name", data: "company_name", className: "align-top" },
                ...baseColumns.slice(2),
            ]
            : baseColumns;

        // index kolom bergeser +1 kalau kolom Company Name ikut disisipkan
        const colOffset = selectedCompany === '' ? 1 : 0;
        const qtyCol = 6 + colOffset;
        const subtotalCol = 7 + colOffset;
        const taxCol = 8 + colOffset;
        const totalCol = 9 + colOffset;

        const table = $(targetEl).DataTable({
            data: productsData,
            destroy: true,
            pageLength: 10,
            lengthMenu: [10, 25, 50, 100],
            order: [[1, "desc"]], // kolom "Date" (index 1, tidak terpengaruh colOffset — selalu tepat setelah "No")
            columns: columns,
            language: {
                search: "Search:",
                info: "Showing _START_ to _END_ of _TOTAL_ products",
                paginate: { previous: "Prev", next: "Next" },
            },
            drawCallback: function (settings) {
                // isi nomor "No" SETELAH DataTables selesai sorting/paging
                // — i di sini adalah posisi tampilan saat ini (sesuai
                // urutan sort yang aktif), bukan index data asli
                const api = this.api();
                const startIndex = api.context[0]._iDisplayStart;
                api.column(0, { page: "current" }).nodes().each(function (cell, i) {
                    cell.innerHTML = startIndex + i + 1;
                });
            },
            footerCallback: function (row, data, start, end, display) {
                // grand total dihitung dari SELURUH data yang lolos
                // filter/search (bukan cuma yang tampil di halaman aktif)
                const api = this.api();
                const sumColumn = (colIndex) => api
                    .column(colIndex, { search: "applied" })
                    .data()
                    .reduce((sum, val) => sum + Number(val || 0), 0);

                const qtySum = sumColumn(qtyCol);
                const subtotalSum = sumColumn(subtotalCol);
                const taxSum = sumColumn(taxCol);
                const totalSum = sumColumn(totalCol);

                $(api.column(qtyCol).footer()).html(
                    `<span class="font-semibold">${formatNumber(qtySum)}</span>`
                );
                $(api.column(subtotalCol).footer()).html(
                    `<span class="font-semibold">${formatCurrencyAccounting(subtotalSum)}</span>`
                );
                $(api.column(taxCol).footer()).html(
                    `<span class="font-semibold">${formatCurrencyAccounting(taxSum)}</span>`
                );
                $(api.column(totalCol).footer()).html(
                    `<span class="font-semibold">${formatCurrencyAccounting(totalSum)}</span>`
                );
            },
        });

        dataTableInstanceRef.current = table;

        return () => {
            if (dataTableInstanceRef.current) {
                dataTableInstanceRef.current.destroy();
                dataTableInstanceRef.current = null;
            }
        };
    }, [productsData]);
    const exportToExcel = async () => {
        if (!productsData || productsData.length === 0) return;
        const TAX_RATE = 0.11;
        const RP_FORMAT = '_-"Rp"* #,##0.00_-;\\-"Rp"* #,##0.00_-;_-"Rp"* "-"??_-;_-@_-';
        const DATE_FORMAT = '[$-421]dd mmmm yyyy;@';
        const HEADER_FILL = "FFC6D9F1";
        const HEADER_ROW = 5;
        const thinBorder = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        };

        const getCompanyTitle = (companyId, fallback) =>
            COMPANY_TITLES[String(companyId)] || fallback;

        const toExcelDate = (value) => {
            if (!value) return null;
            const d = new Date(value);
            return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        };
        const toNumber = (value) => {
            if (typeof value === "number") return value;
            if (!value) return 0;
            const s = String(value);
            // hanya normalisasi jika ada koma (format Indonesia)
            const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
            return parseFloat(normalized) || 0;
        };
        const isZeroTax = (value) => {
            if (value === null || value === undefined || value === "") return true;
            // normalisasi format Indonesia: "1.234,56" -> "1234.56", "0,00" -> "0.00"
            const normalized = String(value).replace(/\./g, "").replace(",", ".");
            return parseFloat(normalized) === 0;
        };

        const isAllCompany = selectedCompany === "" || selectedCompany === null || selectedCompany === undefined;
        const companyTitle = getCompanyTitle(selectedCompany, "ALL Company");
        const periodLabel = window.formatDateRangeLabel(startDate, endDate);

        // ===== Definisi kolom =====
        // show: false  -> kolom tidak ditampilkan
        // fixedWidth   -> lebar tetap (tidak auto)
        const columns = [
            { header: "No", value: (item, i) => i + 1 },
            {
                header: "Company",
                show: isAllCompany,
                value: (item) => getCompanyTitle(item.company_id, item.company_name || ""),
            },
            { header: "Order Number", value: (item) => item.name },
            { header: "Order Date", value: (item) => toExcelDate(item.write_date), numFmt: DATE_FORMAT },
            { header: "Customer Name", value: (item) => item.customer_name },
            { header: "Product Name", value: (item) => item.product_name, fixedWidth: 43.43 },
            { header: "Brand", value: (item) => (item.brand ? item.brand : "No Brand") },
            { header: "Category", value: (item) => item.category },
            { header: "Price Unit", value: (item) => toNumber(item.price_unit), numFmt: RP_FORMAT },
            { header: "Qty SO", value: (item) => toNumber(item.quantity) },
            { header: "Subtotal", value: (item) => toNumber(item.price_subtotal), numFmt: RP_FORMAT },
            { header: "Tax", value: (item) => (isZeroTax(item.tax) ? 0 : TAX_RATE), numFmt: "0%"},
            {
                header: "Tax Amount",
                value: (item) => (isZeroTax(item.tax) ? 0 : toNumber(item.tax)),
                numFmt: RP_FORMAT_ZERO,
            },
            { header: "Total", value: (item) => toNumber(item.total_amount), numFmt: RP_FORMAT },
        ].filter((col) => col.show !== false);

        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet("Sheet1");

        // ===== Judul =====
        ws.getCell("A1").value = "Order Report";
        ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true };
        ws.getCell("A2").value = companyTitle;
        ws.getCell("A2").font = { name: "Calibri", size: 12, bold: true };
        ws.getCell("A3").value = periodLabel;
        ws.getCell("A3").font = { name: "Calibri", size: 11 };

        // ===== Header =====
        const headerRow = ws.getRow(HEADER_ROW);
        headerRow.values = columns.map((col) => col.header);
        headerRow.eachCell((cell) => {
            cell.font = { name: "Calibri", size: 11, bold: true };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
            cell.border = thinBorder;
        });

        // ===== Urutkan: invoice_date, lalu invoice number =====
        const sortedData = productsData.slice().sort((a, b) => {
            const dateA = new Date(a.write_date).getTime() || 0;
            const dateB = new Date(b.write_date).getTime() || 0;
            if (dateA !== dateB) return dateB - dateA; // desc
            return String(a.name || "").localeCompare(String(b.name || ""), undefined, { numeric: true });
        });

        // ===== Data =====
        sortedData.forEach((item, index) => {
            const row = ws.addRow(columns.map((col) => col.value(item, index)));

            columns.forEach((col, i) => {
                const cell = row.getCell(i + 1);
                cell.font = { name: "Calibri", size: 11 };
                cell.border = thinBorder;
                if (col.numFmt) cell.numFmt = col.numFmt;
            });
        });

        // ===== Lebar kolom otomatis =====
        const BULAN = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember",
        ];

        const getDisplayText = (cell) => {
            const v = cell.value;
            if (v === null || v === undefined) return "";
            if (v instanceof Date) {
                const dd = String(v.getUTCDate()).padStart(2, "0");
                return dd + " " + BULAN[v.getUTCMonth()] + " " + v.getUTCFullYear();
            }
            if (typeof v === "number") {
                if (cell.numFmt === RP_FORMAT) {
                    return "Rp   " + v.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                if (cell.numFmt === "0%") return Math.round(v * 100) + "%";
            }
            if (cell.numFmt === RP_FORMAT || cell.numFmt === RP_FORMAT_ZERO) {
                return "Rp   " + v.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            return String(v);
        };

        columns.forEach((col, i) => {
            const column = ws.getColumn(i + 1);

            if (col.fixedWidth) {
                column.width = col.fixedWidth;
                return;
            }

            let maxLen = 0;
            column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
                if (rowNumber < HEADER_ROW) return;
                const len = getDisplayText(cell).length;
                if (len > maxLen) maxLen = len;
            });
            column.width = Math.max(maxLen + 2, 6);
        });

        // ===== Download =====
        const slug = companyTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
        const fileName = "orders_report_" + slug + "_" + dayjs().format("YYYYMMDD_HHmmss") + ".xlsx";

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };
    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-max mx-4 p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-end mb-2">
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
                    >
                        &times;
                    </button>
                </div>
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                {brandName
                                    ? `Brand — ${brandName}`
                                    : productName
                                    ? `Product — ${productName}`
                                    : categoryName
                                    ? `Category — ${categoryName}`
                                    : "Products"}
                            </h3>
                            <span className="text-xs text-slate-400 dark:text-slate-500">(In Thousand Rupiah)</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-0">
                            Write Date : {window.formatDateRangeLabel(startDate, endDate)}
                        </p>
                    </div>
                    <button onClick={exportToExcel} class="text-right py-1 px-3 mr-3 font-medium rounded-md border border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="ri-file-excel-2-line text-md"></i> Export Excel
                    </button>
                </div>

                <div className="relative overflow-x-auto min-h-[200px] min-w-[600px]">
                    <div
                        className={`absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 transition-opacity duration-200 ${
                            isLoadingProducts ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                        }`}
                    >
                        <svg
                            className="animate-spin h-8 w-8 text-blue-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12" cy="12" r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                        </svg>
                    </div>

                    <div
                        className={`absolute inset-0 z-40 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 transition-opacity duration-200 ${
                            !isLoadingProducts && productsData.length === 0
                                ? "opacity-100 pointer-events-auto"
                                : "opacity-0 pointer-events-none"
                        }`}
                    >
                        <p className="text-muted text-sm">Tidak ada data</p>
                    </div>

                    <table
                        ref={tableElRef}
                        className={`w-full text-sm stripe hover transition-all duration-200 ${
                            isLoadingProducts ? "blur-sm pointer-events-none" : ""
                        }`}
                        style={{ width: "100%" }}
                    >
                        <thead></thead>
                        <tbody></tbody>
                        <tfoot>
                            <tr>
                                <th colSpan={selectedCompany === '' ? 6 : 5}></th>
                                <th style={{ textAlign: "right" }}>Grand Total</th>
                                <th style={{ textAlign: "right" }}></th>
                                <th style={{ textAlign: "left" }}></th>
                                <th style={{ textAlign: "left" }}></th>
                                <th style={{ textAlign: "left" }}></th>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};