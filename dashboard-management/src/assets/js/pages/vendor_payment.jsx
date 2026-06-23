const {useEffect,useState}=React;
function VendorPaymentCard(){
    const [vendorPayment,setVendorPayment]=useState([]);
    const [totalPayment,setTotalPayment]=useState([]);
    const [inProcess,setInProcess]=useState([]);
    const [paymentPaid,setPaymentPaid]=useState([]);
    const [amountPaid,setAmountPaid]=useState([]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/vendor_payment/master`)
        .then(res=>setVendorPayment(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/vendor_payment/total_payment`)
        .then(res=>setTotalPayment(res.data[0].total_payments))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/vendor_payment/in_process`)
        .then(res=>setInProcess(res.data[0].in_process_count))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/vendor_payment/payment_paid`)
        .then(res=>setPaymentPaid(res.data[0].paid_count))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/vendor_payment/amount_paid`)
        .then(res=>setAmountPaid(res.data[0].total_amount))
        .catch(err=>console.error(err));
    });
    
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
        return "Rp." + new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    };
    const StatusBadge = ({ status }) => {
        const baseClass =
            "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";

        switch (status) {
            case "paid":
                return (
                    <span className={`${baseClass} bg-green-500 text-white`}>
                        Paid
                    </span>
                );
            case "in_process":
                return (
                    <span className={`${baseClass} bg-blue-500 text-white`}>
                        In Process
                    </span>
                );
            case "draft":
                return (
                    <span className={`${baseClass} bg-yellow-400 text-black`}>
                        Draft
                    </span>
                );
            default:
                return (
                    <span className={`${baseClass} bg-gray-100 text-gray-700`}>
                        {status}
                    </span>
                );
        }
    };
    return(
        <div>
            <div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-4">

                    {/* ===== REVENUE ===== */}
                    <div className="card grid place-items-center text-center">
                        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            <i class="ri-calendar-check-fill"></i>
                        </h2>
                        <h2 className="text-base font-semibold capitalize text-slate-800 dark:text-slate-100">
                            Payments
                        </h2>

                        <h4 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {totalPayment}
                        </h4>
                    </div>

                    {/* ===== EXPENSE ===== */}
                    <div className="card grid place-items-center text-center">
                        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            <i class="ri-bank-card-2-line"></i>
                        </h2>
                        <h2 className="text-base font-semibold capitalize text-slate-800 dark:text-slate-100">
                            In Process
                        </h2>

                        <h4 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {inProcess}
                        </h4>
                    </div>

                    {/* ===== NET PROFIT ===== */}
                    <div className="card grid place-items-center text-center">
                        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            <i class="ri-wallet-fill text-green-500"></i>
                        </h2>
                        <h2 className="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">
                            Paid
                        </h2>

                        <h4 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {paymentPaid}
                        </h4>
                    </div>
                    <div className="card grid place-items-center text-center">
                        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        </h2>
                        <h2 className="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">
                            Total Amont
                        </h2>

                        <h4 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(amountPaid)}
                        </h4>
                    </div>
                </div>
            </div>
    
            <div class="flex flex-col gap-4 min-h-[calc(100vh-212px)] pt-3">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 2xl:col-span-12 order-[17] card">
                        <div class="flex items-center gap-3 mb-4">
                            <h2 class="text-base font-semibold capitalize text-slate-800 dark:text-slate-100 grow">Vendor Payments</h2>
                            <a href="#" class="px-3 py-1.5 rounded-md text-xs border border-black/20 dark:border-darkborder text-muted"><i class="align-bottom ltr:mr-1 rtl:ml-1 ri-filter-line"></i> Filters</a>
                        </div>
                        <div className="overflow-x-auto w-full">
                            <table className="border min-w-max">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Number</th>
                                        <th>Journal</th>
                                        <th>Payment Method</th>
                                        <th>Vendor</th>
                                        <th>Amount in Currency</th>
                                        <th>Amount</th>
                                        <th>State</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vendorPayment.map((p, i) => (
                                        <tr key={i}>
                                            <td>{formatDate(p.date)}</td>
                                            <td>{p.name}</td>
                                            <td>{p.journal_id[1]?p.journal_id[1]:'-'}</td>
                                            <td>{p.payment_method_line_id[1]?p.payment_method_line_id[1]:'-'}</td>
                                            <td>{p.partner_id[1]?p.partner_id[1]:'-'}</td>
                                            <td>{p.currency_id[1]?p.currency_id[1]:'-'}&nbsp;{formatCurrency(p.amount)}</td>
                                            <td>{p.amount}</td>
                                            <td className="text-center align-middle">
                                                <StatusBadge status={p.state} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
const root = ReactDOM.createRoot(
    document.getElementById("vendorPaymentTable")
);
root.render(<VendorPaymentCard />);