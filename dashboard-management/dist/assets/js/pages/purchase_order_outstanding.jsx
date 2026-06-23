const {useEffect,useState,useRef}=React;
function PurchaseOutstandingCard(){
    const tableRef = useRef(null);
    const [purchaseOutstanding,setPurchaseOutstanding]=useState([]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/purchase_outstanding/master`)
        .then(res=>setPurchaseOutstanding(res.data))
        .catch(err=>console.error(err));
    },[]);
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };
    const formatCurrency = (value, currency = "IDR") => {
        if (value == null) return "-";

        // mapping locale biar format sesuai negara
        const localeMap = {
            IDR: "id-ID",
            EUR: "de-DE",
            USD: "en-US"
        };

        const locale = localeMap[currency] || "en-US";

        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const renderStatusBadge = (status) => {
        const baseClass =
            "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";

        switch (status) {
            case "purchase":
                return `<span class="${baseClass} bg-green-500 text-white">Purchase Order</span>`;

            case "draft":
                return `<span class="${baseClass} bg-yellow-400 text-black">Draft</span>`;

            default:
                return `<span class="${baseClass} bg-gray-100 text-gray-700">${status}</span>`;
        }
    };
    useEffect(() => {
        if (!purchaseOutstanding.length) return;

        if ($.fn.DataTable.isDataTable(tableRef.current)) {
            $(tableRef.current).DataTable().destroy();
        }

        const table = $(tableRef.current).DataTable({
            destroy: true,
            scrollX: true,
            autoWidth: false,
            dom: 'Blfrtip',
            data: purchaseOutstanding.map(p => {
                const currency =
                (p.currency_id && p.currency_id[1]) ? p.currency_id[1] : "IDR";

                return [
                    p.origin,
                    `<strong>${p.name}</strong>`,
                    (p.partner_id && p.partner_id[1]) ? p.partner_id[1] : "-",
                    (p.company_id && p.company_id[1]) ? p.company_id[1] : "-",
                    (p.lines[0].analytic_distribution[0] && p.lines[0]) ? p.lines[0].analytic_distribution[0].name : "-",
                    formatDate(p.date_order),
                    (p.user_id && p.user_id[1]) ? p.user_id[1] : "-",
                    p.origin,
                    `<strong>${formatCurrency(p.amount_total, currency)}</strong>`,
                    renderStatusBadge(p.state),
                    p.id
                ];
            }),
            columns: [
                { title: "Reference No" },
                { title: "Reference" },
                { title: "Vendor" },
                { title: "Company" },
                { title: "Analytic Distribution" },
                { title: "Order Deadline" },
                { title: "Buyer" },
                { title: "Source Document" },
                { title: "Total" },
                { title: "Status" },
                { visible: false }
            ],
            createdRow: function(row) {
                $(row).addClass('clickable-row');
            }
        });
        const exportToExcel = () => {
            const headers = [
                "Reference No", "Reference", "Vendor", "Company",
                "Analytic Distribution", "Order Deadline",
                "Buyer", "Source Document", "Total", "Status"
            ];
            const currencyMap = {
                IDR: '"Rp"#,##0.00',
                USD: '"$"#,##0.00',
                EUR: '"€"#,##0.00'
            };
            const data = purchaseOutstanding.map(p => {
                const currency =
                    (p.currency_id && p.currency_id[1]) ? p.currency_id[1] : "IDR";

                return [
                    p.origin==='false'?'-':p.origin,
                    p.name,
                    (p.partner_id && p.partner_id[1]) || "-",
                    (p.company_id && p.company_id[1]) || "-",
                    (p.lines[0].analytic_distribution[0] && p.lines[0]) ? p.lines[0].analytic_distribution[0].name : "-",
                    new Date(p.date_order),
                    (p.user_id && p.user_id[1]) || "-",
                    p.origin==='false'?'-':p.origin,
                    Math.round(p.amount_total),
                    p.state
                ];
            });

            const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
            data.forEach((row, rowIndex) => {
                const currency =
                    (purchaseOutstanding[rowIndex].currency_id &&
                    purchaseOutstanding[rowIndex].currency_id[1]) || "IDR";

                const format = currencyMap[currency] || '#,##0'; // fallback

                const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: 8 });

                if (ws[cellAddress]) {
                    ws[cellAddress].t = "n";
                    ws[cellAddress].z = format;
                }
            });
            // 🎨 STYLE HEADER
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

            // Auto width
            ws['!cols'] = headers.map(() => ({ wch: 20 }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Purchase");
            const randomText = Math.random().toString(36).substring(2, 8);
            const randomDate = Date.now();
            XLSX.writeFile(wb, `Purchase outstanding ${randomDate} ${randomText}.xlsx`);
        };
        $('#exportExcel').on('click', function () {
            exportToExcel();
        });
        $(tableRef.current).on('click', 'tbody tr', function () {
            const $rows = $(tableRef.current).find('tbody tr');

            $rows.removeClass('selected-row'); // reset semua jadi putih
            $(this).addClass('selected-row');  // aktifkan yang diklik
        });
        $(document).on('click', function (e) {
            if (!$(e.target).closest(tableRef.current).length) {
                table.$('tr.selected-row').removeClass('selected-row');
            }
        });
        $(tableRef.current).on('dblclick', 'tbody tr', function () {
            const rowData = table.row(this).data();
            console.log(rowData);
            const id = rowData[10];
            window.location.href = `purchase_order_outstanding_detail.html?id=${id}`;
        });

        setTimeout(() => table.columns.adjust(), 100);

    }, [purchaseOutstanding]);
    
    return (
        <table
            ref={tableRef}
            className="min-w-[640px] w-full"
            id="tablePurchaseOrderOutstanding"
        />
    );
}
const root = ReactDOM.createRoot(
    document.getElementById("purchaseOrderOutstandingTable")
);
root.render(<PurchaseOutstandingCard />);