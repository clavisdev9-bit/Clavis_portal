const { useEffect, useRef, useState } = React;

function PaymentTable() {
    const tableRef = useRef(null);
    const [payments, setPayment] = useState([]);

    useEffect(() => {
        axios.get(`${__API_URL__}/payment/master`)
            .then(res => setPayment(res.data.rows))
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
    useEffect(() => {
        if (!payments.length) return;

        // Destroy jika sudah ada
        if ($.fn.DataTable.isDataTable(tableRef.current)) {
            $(tableRef.current).DataTable().destroy();
        }

        $(tableRef.current).DataTable({
            data: payments.map(p => {
                const isPaid = p.state === 'Paid';

                return [
                    formatDate(p.date),
                    p.name,
                    (p.journal_id && p.journal_id[1]) ? p.journal_id[1] : "-",
                    (p.payment_method_line_id && p.payment_method_line_id[1]) ? p.payment_method_line_id[1] : "-",
                    (p.partner_id && p.partner_id[1]) ? p.partner_id[1] : "-",
                    p.amount_in_currency,
                    p.amount,
                    `
                    <span class="
                        inline-flex items-center
                        px-3 py-1
                        text-xs font-semibold
                        rounded-full
                        ${isPaid
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'}
                    ">
                        ${isPaid ? 'Paid' : 'In Process'}
                    </span>
                    `
                ];
            }),
            scrollX: true,              // 🔥 PENTING
            autoWidth: false,
            columns: [
                { title: "Date" },
                { title: "Number" },
                { title: "Journal" },
                { title: "Payment Method" },
                { title: "Customer" },
                { title: "Amount In Currency" },
                { title: "Amount" },
                { 
                    title: "State",
                    className: "text-center"
                },
            ]
        });
    }, [payments]);

    return (
        <table
            ref={tableRef}
            className="min-w-[640px] w-full"
        />
    );
}

// Mount React
const root = ReactDOM.createRoot(
    document.getElementById("PaymentTableRoot")
);
root.render(<PaymentTable />);
