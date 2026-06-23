const { useEffect, useState } = React;

function PurchaseOutstandingDetail() {

    const [data, setData] = useState(null);

    // 🔥 ambil id dari query param
    const getIdFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get("id");
    };
    
    useEffect(() => {
        const id = getIdFromUrl();

        if (!id) return;

        axios
            .get(`${__API_URL__}/purchase_outstanding/detail/${id}`)
            .then(res => setData(res.data))
            .catch(console.error);
    }, []);
    const formatDateTime = (dateStr) => {
        if (!dateStr) return "-";

        const d = new Date(dateStr);

        const day = String(d.getUTCDate()).padStart(2, "0");
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        const year = d.getUTCFullYear();

        const hours = String(d.getUTCHours()).padStart(2, "0");
        const minutes = String(d.getUTCMinutes()).padStart(2, "0");
        const seconds = String(d.getUTCSeconds()).padStart(2, "0");

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };
    const formatDecimal = (val) => {
        if (val === null || val === undefined || val === "") return "0.00";
        return Number(val).toFixed(2);
    };
    const formatNumber = (val) => {
        if (val === null || val === undefined || val === "") return "0.00";

        return Number(val).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
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
    
    console.log(data);
    if (!data) return <div>Loading...</div>;
    const currency =
    (data.currency_id && data.currency_id[1])
        ? data.currency_id[1]
        : "IDR";
    const amountUntaxed = data.lines.reduce((sum, l) => {
        return sum + (Number(l.subtotal) || 0);
    }, 0);
    const taxes = amountUntaxed * 0.11; // ✅ 11%
    const total = amountUntaxed + taxes;
    const currencyMap = {
        IDR: '"Rp"#,##0.00',
        USD: '"$"#,##0.00',
        EUR: '"€"#,##0.00'
    };
    const exportExcel = () => {
        const format = currencyMap[currency] || '#,##0';
        const wsData = [];

        // 🔹 HEADER INFO
        wsData.push(["Purchase Order", data.name, "", "", "", "", ""]);
        wsData.push([]);

        wsData.push([
            "Vendor",
            data.partner_id && data.partner_id[1] ? data.partner_id[1] : '-',
            "",
            "",
            "",
            "Confirmation Date",
            data.date_approve ? formatDateTime(data.date_approve) : "-"
        ]);

        wsData.push([
            "Delivery Address",
            data.x_studio_delivery_address && data.x_studio_delivery_address[1] ? data.x_studio_delivery_address[1] : '-',
            "",
            "",
            "",
            "Expected Arrival",
            data.date_planned ? formatDateTime(data.date_planned) : "-"
        ]);

        wsData.push([
            "Vendor Reference",
            data.partner_ref !== 'false' && data.partner_ref ? data.partner_ref : '-',
            "",
            "",
            "",
            "Deliver To",
            data.picking_type_id && data.picking_type_id[1] ? data.picking_type_id[1] : "-"
        ]);

        wsData.push([
            "Currency",
            data.currency_id && data.currency_id[1] ? data.currency_id[1] : '-',
            "",
            "",
            "",
            "Arrival",
            data.effective_date ? new Date(data.effective_date).toLocaleString() : "-"
        ]);

        wsData.push([]);

        // 🔹 TABLE HEADER

        wsData.push([
            "Product",
            "Analytic Distribution",
            "Quantity",
            "Received",
            "Billed",
            "Price",
            "Amount"
        ]);
        const headerRowIndex = wsData.length - 1;

        // 🔹 TABLE DATA
        data.lines
            .filter(l => Number(l.subtotal) !== 0)
            .forEach(l => {
                wsData.push([
                    l.name,
                    l.analytic_distribution.length === 1 ? l.analytic_distribution[0].name : '-',
                    formatDecimal(l.po_qty),
                    formatDecimal(l.gr_qty),
                    formatDecimal(l.qty_invoiced),
                    Math.round(l.price_unit),
                    Math.round(l.subtotal)
                ]);
            });

        // 🔹 TOTAL
        wsData.push([]);
        wsData.push([
            "", "", "", "", "",
            "Untaxed Amount",
            Math.round(amountUntaxed),
        ]);

        wsData.push([
            "", "", "", "", "",
            "Taxes",
            Math.round(taxes),
        ]);

        wsData.push([
            "", "", "", "", "",
            "Total",
            Math.round(total),
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const dataStartRow = headerRowIndex + 1;

        // jumlah baris data (yang difilter)
        const dataLength = data.lines.filter(l => Number(l.subtotal) !== 0).length;

        for (let i = 0; i < dataLength; i++) {
            const rowIndex = dataStartRow + i;

            // Price (kolom F = index 5)
            let cell = XLSX.utils.encode_cell({ r: rowIndex, c: 5 });
            if (ws[cell]) {
                ws[cell].t = "n";
                ws[cell].z = format;
            }

            // Amount (kolom G = index 6)
            cell = XLSX.utils.encode_cell({ r: rowIndex, c: 6 });
            if (ws[cell]) {
                ws[cell].t = "n";
                ws[cell].z = format;
            }
        }
        const totalStartRow = wsData.length - 3; // posisi Untaxed

        // Untaxed
        let cell = XLSX.utils.encode_cell({ r: totalStartRow, c: 6 });
        if (ws[cell]) {
            ws[cell].t = "n";
            ws[cell].z = format;
        }

        // Taxes
        cell = XLSX.utils.encode_cell({ r: totalStartRow + 1, c: 6 });
        if (ws[cell]) {
            ws[cell].t = "n";
            ws[cell].z = format;
        }

        // Total
        cell = XLSX.utils.encode_cell({ r: totalStartRow + 2, c: 6 });
        if (ws[cell]) {
            ws[cell].t = "n";
            ws[cell].z = format;
        }

        // 🎨 STYLE HEADER TABLE
        for (let col = 0; col < 7; col++) {
            const cellAddress = XLSX.utils.encode_cell({
                r: headerRowIndex,
                c: col
            });

            if (!ws[cellAddress]) continue;

            ws[cellAddress].s = {
                font: {
                    bold: true,
                    color: { rgb: "FFFF00" }
                },
                fill: {
                    patternType: "solid",
                    fgColor: { rgb: "1E3A8A" }
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center"
                }
            };
        }

        // 📏 Lebar kolom biar rapi
        ws['!cols'] = [
            { wch: 35 }, // A
            { wch: 45 }, // B
            { wch: 5 },  // C
            { wch: 5 },  // D
            { wch: 5 },  // E
            { wch: 25 }, // F
            { wch: 30 }  // G
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Purchase Detail");

        XLSX.writeFile(wb, `PO_${data.name}.xlsx`);
    };
    return (
        <div className="space-y-2" id="purchaseOrderDetail">
            <div class="flex">
                <button
                    onClick={() => window.history.back()}
                    className="mb-3 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm grow text-left"
                >
                    ← Back
                </button>
                <button onClick={exportExcel} class="text-right bg-green-500 px-2 font-bold text-white rounded-lg"><i class="ri-file-excel-line text-lg"></i> Export excel</button>
            </div>
            <h2 className="text-sm font-bold">
                Purchase Order
            </h2>

            <h2 className="text-xl font-bold mb-5">
                {data.name}
            </h2>
            <div className="grid grid-cols-4 ">
                <b>Vendor</b>
                <span>{data.partner_id && data.partner_id[1] ? data.partner_id[1] : '-'}</span>
                <b>Confirmation Date </b>
                <span>{data.date_approve ? formatDateTime(data.date_approve) : '-'}</span>


                <b>Delivery Address </b>
                <span>{data.x_studio_delivery_address && data.x_studio_delivery_address[1] ? data.x_studio_delivery_address[1] : '-'}</span>

                <b>Expected Arrival </b>
                <span>{data.date_planned ? formatDateTime(data.date_planned) : '-'}</span>


                <b>Vendor Reference </b>
                <span>{data.partner_ref !== 'false' && data.partner_ref ? data.partner_ref : '-'}</span>

                <b>Deliver To </b>
                <span>{data.picking_type_id && data.picking_type_id[1] ? data.picking_type_id[1] : '-'}</span>


                <b>Currency </b>
                <span>{data.currency_id && data.currency_id[1] ? data.currency_id[1] : '-'}</span>

                <b>Arrival </b>
                <span>{data.effective_date ? new Date(data.effective_date).toLocaleString() : '-'}</span>

            </div>

            <div className="mt-5">
                <h3 className="font-semibold mb-2">Items</h3>

                <table className="w-full border overflow-auto">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 border">Product</th>
                            <th className="p-2 border">Analytic Distribution</th>
                            <th className="p-2 border">Quantity</th>
                            <th className="p-2 border">Received</th>
                            <th className="p-2 border">Billed</th>
                            <th className="p-2 border">Price</th>
                            <th className="p-2 border">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.lines
                            .filter(l => Number(l.subtotal) !== 0)
                            .map((l, i) => (
                                <tr key={i}>
                                    <td className="whitespace-pre-line align-top text-sm">{l.name}</td>
                                    <td className="border p-2 align-top">
                                        {l.analytic_distribution.length === 1 ? l.analytic_distribution[0].name : '-'}
                                    </td>
                                    <td className="border p-2 align-top text-right">{formatDecimal(l.po_qty)}</td>
                                    <td className="border p-2 align-top text-right">{formatDecimal(l.gr_qty)}</td>
                                    <td className="border p-2 align-top text-right">{formatDecimal(l.qty_invoiced)}</td>
                                    <td className="border p-2 align-top text-right">{formatNumber(l.price_unit)}</td>
                                    <td className="border p-2 align-top text-right">{formatNumber(l.subtotal)}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end mt-6">
                <div className="w-[420px] flex-none space-y-2">

                    <div className="flex justify-between">
                        <span>Untaxed Amount :</span>
                        <span className="font-bold">{formatCurrency(amountUntaxed, currency)}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Taxes :</span>
                        <span>{formatCurrency(taxes, currency)}</span>
                    </div>

                    <div className="flex justify-between font-bold text-base border-t pt-2">
                        <span>Total :</span>
                        <span>{formatCurrency(total, currency)}</span>
                    </div>

                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(
    document.getElementById("purchaseOrderOutstandingDetailTable")
);

root.render(<PurchaseOutstandingDetail />);
