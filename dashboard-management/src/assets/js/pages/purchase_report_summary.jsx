const {useEffect,useState}=React;
function PurchaseReportCard(){
    console.log('tes');
    const [totalPurchase,setTotalPurchae]=useState([]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/purchase/total_purchase`)
        .then(res=>setTotalPurchae(res.data[0].total_amount))
        .catch(err=>console.error(err));
    },[]);
    const formatNumber = (value) => new Intl.NumberFormat("id-ID").format(Number(value));

    const formatCurrency = (value) => {
        if (value == null) return "-";
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value).replace(/^/, "Rp. ");
    };
    return(
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-5">

            {/* ===== REVENUE ===== */}
            <div className="card">
                <p className="flex items-center gap-2 text-base dark:text-gray-300">
                    <i data-feather="shopping-bag" className="size-4"></i>
                    Total Purchase
                </p>
                <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    {formatCurrency(totalPurchase)}
                </h4>
            </div>

            {/* ===== EXPENSE ===== */}
            <div className="card">
                {/* <p className="flex items-center gap-2 text-base dark:text-gray-300">
                    Total Amount Billed
                </p>

                <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    {formatCurrency(totalBilled.total_billed)}
                </h4> */}
            </div>

            {/* ===== NET PROFIT ===== */}
            <div className="card">
                {/* <p className="flex items-center gap-2 text-base dark:text-gray-300">
                    Total Amount Paid
                </p>

                <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    {formatCurrency(totalBilled.total_paid)}
                </h4> */}
            </div>
            <div className="card">
                {/* <p className="flex items-center gap-2 text-base dark:text-gray-300">
                    Outstanding Balance
                </p>

                <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    {formatCurrency(totalBilled.outstanding_balance)}
                </h4> */}
            </div>
            <div className="card">
                {/* <p className="flex items-center gap-2 text-base dark:text-gray-300">
                    Average Days to Payment
                </p>

                <div className="flex items-start gap-6 mt-3">
                    <h4 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatNumber(averageDaysToPayment)}%
                    </h4>

                    <h4 className="flex flex-col text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        <span>{formatNumber(percentPaidOnTime)}%</span>
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            Paid on Time
                        </span>
                    </h4>
                </div> */}
            </div>
        </div>
    )
}
// Mount React
const root = ReactDOM.createRoot(
    document.getElementById("purchase_report_summary")
);
root.render(<PurchaseReportCard />);
