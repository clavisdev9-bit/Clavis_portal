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
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
                    >
                        &times;
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