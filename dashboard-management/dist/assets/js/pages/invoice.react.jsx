const { useEffect, useRef, useState } = React;

function InvoiceTable() {
    const tableRef = useRef(null);
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
        axios.get(`${__API_URL__}/invoices/master`)
            .then(res => setInvoices(res.data))
            .catch(err => console.error(err));
    }, []); 
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatCurrency = (value) => {
        if (value == null) return "-";
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value).replace(/^/, "Rp. ");
    };
    const renderPaymentState = (state) => {
        switch (state) {
            case "in_payment":
                return `
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                        In Payment
                    </span>
                `;
            case "not_paid":
                return `
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                        Not Paid
                    </span>
                `;
            case "reversed":
                return `
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-black">
                        Reversed
                    </span>
                `;
            default:
                return `
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        ${state}
                    </span>
                `;
        }
    };
    useEffect(() => {
        if (!invoices.length) return;

        // Destroy jika sudah ada
        if ($.fn.DataTable.isDataTable(tableRef.current)) {
            $(tableRef.current).DataTable().destroy();
        }

        $(tableRef.current).DataTable({
            data: invoices.map(p => [
                `<strong>${p.name}</strong>`,
                (p.partner_id && p.partner_id[1]) ? p.partner_id[1] : "-",
                formatDate(p.invoice_date),
                formatDate(p.invoice_date_due),
                formatCurrency(p.amount_total),
                renderPaymentState(p.payment_state)
            ]),
            scrollX: true,              // 🔥 PENTING
            autoWidth: false,
            columns: [
                { title: "Number" },
                { title: "Customer" },
                { title: "Invoice Date" },
                { title: "Due Date" },
                { title: "Total" },
                { title: "Status"},
            ]
        });
    }, [invoices]);

    return (
        <table
            ref={tableRef}
            className="min-w-[640px] w-full"
        />
    );
}

// Mount React
const root = ReactDOM.createRoot(
    document.getElementById("InvoiceTableRoot")
);
root.render(<InvoiceTable />);
