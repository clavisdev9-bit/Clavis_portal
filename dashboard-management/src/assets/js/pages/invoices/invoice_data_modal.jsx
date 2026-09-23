const brandKeywordMap = {
    'PANASONIC': ['PANASONIC'],
    'HOT WHEELS': ['HOT WHEELS', 'HOTWHEELS'],
    'BARBIE': ['BARBIE'],
    'PAWS NOVA': ['SAMSAM', 'SAMSAMX'],
    'AMERICAN APPAREL': ['AMERICAN APPAREL'],
    'GILDAN': ['GILDAN'],
};

function getBrandName(template, lineName) {
    // 1. kalau x_studio_brand sudah array (brand resmi dari Odoo), pakai itu
    if (template.x_studio_brand && Array.isArray(template.x_studio_brand)) {
        return template.x_studio_brand[1] || "-";
    }

    // 2. fallback: cocokkan dari nama produk/line, sesuai urutan brandKeywordMap
    const name = (template.name || lineName || "").toUpperCase();
    for (const brandName in brandKeywordMap) {
        const keywords = brandKeywordMap[brandName];
        if (keywords.some((keyword) => name.includes(keyword.toUpperCase()))) {
            return brandName;
        }
    }

    // 3. tidak match apapun
    return "No Brand";
}
window.InvoiceDataModal = function InvoiceDataModal({
    show, onClose, startDate, endDate, filterType, selectedCompany,
    initialToInvoice, initialSelectedCustomer, initialOutstandingBalance, initialAmountPaidPositive,
    initialAging, dateTabs = null,
}) {
    const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
    const [invoiceData, setInvoiceData] = useState([]);
    const [toInvoice, setToInvoice] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [outstandingBalance, setOutstandingBalance] = useState(false);
    const [amountPaidPositive, setAmountPaidPositive] = useState(false);
    const [aging, setAging] = useState("");
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const hasTabs = Array.isArray(dateTabs) && dateTabs.length > 0;
    const activeTab = hasTabs ? (dateTabs[activeTabIndex] || dateTabs[0]) : null;
    // kalau dateTabs diberikan, tanggal yang dipakai untuk fetch mengikuti tab aktif;
    // kalau tidak, tetap pakai startDate/endDate/filterType dari props seperti semula
    const effectiveStartDate = hasTabs ? activeTab.startDate : startDate;
    const effectiveEndDate = hasTabs ? activeTab.endDate : endDate;
    const effectiveFilterType = hasTabs ? (activeTab.filterType || "day") : filterType;

    const invoiceTableElRef = React.useRef(null);
    const dataTableInstanceRef = React.useRef(null);

    // terapkan preset filter (dari tombol di luar, misal kartu KPI) setiap
    // kali modal dibuka
    useEffect(() => {
        if (show) {
            setSelectedCustomer(initialSelectedCustomer || "");
            setToInvoice(initialToInvoice || "");
            setOutstandingBalance(!!initialOutstandingBalance);
            setAmountPaidPositive(!!initialAmountPaidPositive);
            setAging(initialAging || "");
            setActiveTabIndex(0);
        }
    }, [show, initialToInvoice, initialSelectedCustomer, initialOutstandingBalance, initialAmountPaidPositive, initialAging]);

    // fetch invoices
    useEffect(() => {
        const params = {};
        if (effectiveStartDate && effectiveEndDate && effectiveFilterType) {
            params.start_date = effectiveStartDate;
            params.end_date = effectiveEndDate;
            params.filter_type = effectiveFilterType;
        }
        if (selectedCompany) {
            params.company_id = selectedCompany;
        }
        if (selectedCustomer) {
            params.partner_id = selectedCustomer;
        }
        if (toInvoice) {
            params.invoice_status = toInvoice;
        }
        if (outstandingBalance) {
            params.outstanding_balance = true;
        }
        if (amountPaidPositive) {
            params.amount_paid_positive = true;
        }
        if (aging) {
            params.aging = aging;
        }
        setIsLoadingInvoice(true);
        axios.get(`${__API_URL__}/invoices/company_invoices`, { params })
            .then(res => {
                setInvoiceData(res.data);
            })
            .catch(console.error)
            .finally(() => {
                setIsLoadingInvoice(false);
            });
    }, [effectiveStartDate, effectiveEndDate, effectiveFilterType, selectedCompany, selectedCustomer, toInvoice, outstandingBalance, amountPaidPositive, aging]);

    // render datatable — hanya jalan kalau elemen <table> sudah ter-mount
    // (yaitu saat modal sedang terbuka)
    useEffect(() => {
        if (!invoiceTableElRef.current) return;
        const targetEl = invoiceTableElRef.current;

        // hancurkan instance lama LEBIH DULU, sebelum cek invoiceData
        // kosong — kalau tidak, tabel dari data sebelumnya tertinggal di
        // DOM (cuma disembunyikan lewat opacity) dan bikin container jadi
        // setinggi tabel lama itu, padahal seharusnya collapse ke
        // min-h-[200px] saat "Tidak ada data" tampil
        if (dataTableInstanceRef.current) {
            dataTableInstanceRef.current.destroy();
            dataTableInstanceRef.current = null;
        }

        if (!invoiceData.length) return;

        // format currency KHUSUS modal ini, dalam satuan ribuan rupiah —
        // beda dari window.formatCurrency (K/M/B) yang dipakai di halaman
        // lain. Contoh: 50.000.000 -> "Rp. 50.000", 500.000 -> "Rp. 500"
        const formatCurrencyThousand = (value) => {
            const amount = Number(value);
            if (isNaN(amount)) return "-";
            return `Rp. ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(amount / 1000)}`;
        };

        // format ala accounting: "Rp." & nominal dibungkus dalam kotak
        // lebar TETAP (bukan w-full — supaya jaraknya tidak ikut melebar
        // mengikuti lebar kolom), kotak itu sendiri didorong rata kanan
        // sel lewat ml-auto. Hasilnya: "Rp." tetap sejajar antar baris,
        // nominal tetap rata kanan, tapi jarak keduanya pendek & konsisten
        const formatCurrencyAccounting = (value) => {
            const amount = Number(value);
            if (isNaN(amount)) return "-";
            const formatted = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(amount / 1000);
            return `<span class="flex w-20 ml-auto justify-between"><span class="shrink-0">Rp.</span><span>${formatted}</span></span>`;
        };

        const paymentStateBadge = (state) => {
            const stateMap = {
                not_paid: { label: "Not Paid", className: "bg-danger/20 text-danger" },
                paid: { label: "Paid", className: "bg-success/20 text-success" },
                partial: { label: "Partial", className: "bg-warning/20 text-warning" },
                in_payment: { label: "In Payment", className: "bg-info/20 text-info" },
            };
            const config = stateMap[state] || { label: state, className: "bg-slate-100 text-slate-600" };
            return `<span class="px-2 py-1 rounded-md text-xs font-medium ${config.className}">${config.label}</span>`;
        };

        // Bangun HTML tabel produk untuk child row.
        // Beda dari OrderDataModal: sumber baris produk ada di
        // rowData.invoice_origin[].lines[], bukan rowData.order_line[] langsung
        // (1 invoice bisa berasal dari beberapa sales order sekaligus)
        const buildProductDetailHtml = (rowData) => {
            const invoiceOrigins = rowData.invoice_origin;

            if (!invoiceOrigins || !Array.isArray(invoiceOrigins) || invoiceOrigins.length === 0) {
                return `<div class="p-3 text-sm text-muted">Tidak ada detail produk</div>`;
            }
            const getLastSegment = (str) => {
                if (!str || typeof str !== "string") return "-";
                const parts = str.split("/");
                return parts[parts.length - 1].trim();
            };

            const allLines = [];
            invoiceOrigins.forEach((o) => {
                if (o.lines && Array.isArray(o.lines)) {
                    o.lines.forEach((line) => {
                        if (line.quantity && line.quantity !== 0) {
                            allLines.push(line);
                        }
                    });
                }
            });

            if (allLines.length === 0) {
                return `<div class="p-3 text-sm bg-blue-400 text-muted">Tidak ada detail produk</div>`;
            }

            let rows = "";
            allLines.forEach((line) => {
                const template = line.product_template || {};
                // kalau product_template null/tidak ada template.name,
                // jatuh ke line.name (nama mentah baris, mis. baris
                // manual/bebas tanpa produk terdaftar)
                const productName = template.name || line.name || "-";
                const brandRaw = getBrandName(template, line.name);
                const categRaw = template.categ_id && Array.isArray(template.categ_id)
                    ? template.categ_id[1]
                    : "-";

                const brand = getLastSegment(brandRaw);
                const categName = getLastSegment(categRaw);

                rows += `
                    <tr class="border-b border-slate-100 dark:border-slate-700">
                        <td class="py-1.5 px-2 max-w-[200px] whitespace-normal break-words">${productName}</td>
                        <td class="py-1.5 px-2">${brand}</td>
                        <td class="py-1.5 px-2">${categName}</td>
                        <td class="py-1.5 px-2 text-right">${formatCurrencyThousand(line.price_unit)}</td>
                        <td class="py-1.5 px-2 text-right">${line.quantity}</td>
                        <td class="py-1.5 px-2 text-right">${formatCurrencyThousand(line.price_subtotal)}</td>
                    </tr>
                `;
            });

            return `
                <div class="p-3 bg-slate-50 dark:bg-slate-900">
                    <div class="max-h-[250px] overflow-y-auto">
                        <table class="w-full text-xs">
                            <thead class="sticky top-0 bg-blue-200 dark:bg-slate-900">
                                <tr class="border-b bg-blue-200 border-slate-200 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                                    <th class="py-1.5 px-2">Product Name</th>
                                    <th class="py-1.5 px-2">Brand</th>
                                    <th class="py-1.5 px-2">Category</th>
                                    <th class="py-1.5 px-2 text-right">Price Unit</th>
                                    <th class="py-1.5 px-2 text-right">Qty</th>
                                    <th class="py-1.5 px-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        };

        const baseColumns = [
            {
                title: "No",
                data: null,
                className: "text-center",
                // TIDAK pakai render meta.row di sini — meta.row adalah
                // index di data ASLI (sebelum sorting), bukan posisi
                // tampilan setelah di-sort. Nomornya diisi lewat
                // drawCallback di bawah, yang jalan SETELAH DataTables
                // selesai sorting/paging.
            },
            {
                title: "Invoice Date",
                data: "invoice_date",
                render: function (data, type) {
                    // untuk sorting/type internal DataTables, pakai nilai
                    // tanggal asli (ISO) supaya urut kronologis; untuk
                    // tampilan (display/filter), pakai format "DD MMM YYYY"
                    if (type === "sort" || type === "type") {
                        return data;
                    }
                    return dayjs(data).format("DD MMM YYYY");
                }
            },
            {
                title: "Customer",
                data: "customer_name",
            },
            {
                title: "Untaxed Amount",
                data: function (row) {
                    return Number(row.amount_total || 0) - Number(row.amount_tax || 0);
                },
                className: "text-left",
                render: function (data, type) {
                    // untuk sorting/type internal DataTables, pakai angka
                    // asli supaya urut numerik; untuk tampilan (display/
                    // filter), pakai format accounting ("Rp." sejajar,
                    // nominal rata kiri)
                    if (type === "sort" || type === "type") {
                        return data;
                    }
                    return formatCurrencyAccounting(data);
                }
            },
            {
                title: "Tax",
                data: "amount_tax",
                className: "text-left",
                render: function (data, type) {
                    if (type === "sort" || type === "type") {
                        return data;
                    }
                    return formatCurrencyAccounting(data);
                }
            },
            {
                title: "Total",
                data: "amount_total",
                className: "text-left",
                render: function (data, type) {
                    if (type === "sort" || type === "type") {
                        return data;
                    }
                    return formatCurrencyAccounting(data);
                }
            },
            {
                title: "Paid",
                data: "amount_paid",
                className: "text-left",
                render: function (data, type) {
                    if (type === "sort" || type === "type") {
                        return data;
                    }
                    return formatCurrencyAccounting(data);
                }
            },
            {
                title: "Outstanding",
                data: "amount_residual",
                className: "text-left",
                render: function (data, type) {
                    if (type === "sort" || type === "type") {
                        return data;
                    }
                    return `<span class="text-purple font-medium">${formatCurrencyAccounting(data)}</span>`;
                }
            },
            {
                title: "Status",
                data: "payment_state",
                render: function (data) {
                    return paymentStateBadge(data);
                }
            },
            {
                title: "Due Date",
                data: "invoice_date_due",
                render: function (data, type) {
                    if (type === "sort" || type === "type") {
                        return data;
                    }
                    return dayjs(data).format("DD MMM YYYY");
                }
            },
        ];

        // Sisipkan kolom Company di posisi index 1 (setelah "No"), khusus saat selectedCompany kosong
        const columns = selectedCompany === ''
            ? [
                baseColumns[0],
                {
                    title: "Company",
                    data: "company_name",
                },
                ...baseColumns.slice(1),
            ]
            : baseColumns;

        // index kolom Untaxed Amount/Tax/Total/Paid/Outstanding bergeser +1
        // kalau kolom Company ikut disisipkan (saat selectedCompany === '')
        const colOffset = selectedCompany === '' ? 1 : 0;
        const untaxedCol = 3 + colOffset;
        const taxCol = 4 + colOffset;
        const totalCol = 5 + colOffset;
        const paidCol = 6 + colOffset;
        const outstandingCol = 7 + colOffset;

        const table = $(targetEl).DataTable({
            data: invoiceData,
            destroy: true,
            pageLength: 10,
            lengthMenu: [10, 25, 50, 100],
            order: [[selectedCompany === '' ? 2 : 1, "desc"]],
            columns: columns,
            language: {
                search: "Search:",
                info: "Showing _START_ to _END_ of _TOTAL_ invoices",
                paginate: {
                    previous: "Prev",
                    next: "Next",
                },
            },
            createdRow: function (row) {
                $(row).css("cursor", "pointer");
            },
            drawCallback: function (settings) {
                // isi nomor "No" SETELAH DataTables selesai sorting/paging
                // — i di sini adalah posisi tampilan saat ini (sesuai
                // urutan sort yang aktif, yaitu invoice_date desc), bukan
                // index data asli
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

                [untaxedCol, taxCol, totalCol, paidCol, outstandingCol].forEach((colIndex) => {
                    const sum = sumColumn(colIndex);
                    $(api.column(colIndex).footer()).html(
                        `<span class="font-semibold">${formatCurrencyAccounting(sum)}</span>`
                    );
                });
            },
        });

        dataTableInstanceRef.current = table;

        // Event klik baris untuk expand/collapse child row
        $(targetEl).off("click", "tbody tr").on("click", "tbody tr", function () {
            const tr = $(this);
            const row = table.row(tr);

            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass("shown");
            } else {
                table.rows().every(function () {
                    if (this.child.isShown()) {
                        this.child.hide();
                        $(this.node()).removeClass("shown");
                    }
                });

                row.child(buildProductDetailHtml(row.data())).show();
                tr.addClass("shown");
            }
        });

        return () => {
            if (dataTableInstanceRef.current) {
                dataTableInstanceRef.current.destroy();
                dataTableInstanceRef.current = null;
            }
        };
    }, [invoiceData, selectedCompany, toInvoice, show]);

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
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Invoice Data
                        </h3>
                        <span className="text-dark dark:text-white">(In Thousand Rupiah)</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
                    >
                        &times;
                    </button>
                </div>
                {hasTabs && (
                    <div className="flex gap-1 mb-3 border-b border-slate-200 dark:border-slate-700">
                        {dateTabs.map((tab, idx) => (
                            <button
                                key={tab.label}
                                onClick={() => setActiveTabIndex(idx)}
                                className={`px-4 py-1.5 text-sm rounded-t-md border-b-2 -mb-px transition-colors ${
                                    idx === activeTabIndex
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400 font-semibold"
                                        : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
                <div className="relative overflow-x-auto min-h-[200px]">
                    <div
                        className={`absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 transition-opacity duration-200 ${
                            isLoadingInvoice ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
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
                                cx="12"
                                cy="12"
                                r="10"
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
                            !isLoadingInvoice && invoiceData.length === 0
                                ? "opacity-100 pointer-events-auto"
                                : "opacity-0 pointer-events-none"
                        }`}
                    >
                        <p className="text-muted text-sm">Tidak ada data</p>
                    </div>

                    <table
                        ref={invoiceTableElRef}
                        className={`w-full text-sm stripe hover transition-all duration-200 ${
                            isLoadingInvoice ? "blur-sm pointer-events-none" : ""
                        }`}
                        style={{ width: "100%" }}
                    >
                        <thead></thead>
                        <tbody></tbody>
                        <tfoot>
                            <tr>
                                <th colSpan={selectedCompany === '' ? 3 : 2}></th>
                                <th style={{ textAlign: "right" }}>Grand Total</th>
                                <th style={{ textAlign: "left" }}></th>
                                <th style={{ textAlign: "left" }}></th>
                                <th style={{ textAlign: "left" }}></th>
                                <th style={{ textAlign: "left" }}></th>
                                <th style={{ textAlign: "left" }}></th>
                                <th colSpan={2}></th>
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