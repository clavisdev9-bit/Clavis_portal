const {useEffect,useState}=React;
function AccountMoveCard(){
    const [account_moves,setAccountMoves]=useState([]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/account_moves/revenue`)
        .then(res=>setAccountMoves(res.data[0]))
        .catch(err=>console.error(err));
    },[]);
    if(!account_moves) return null;
    const isPositive = (value) => Number(value) >= 0;
    const ChangeBadge = ({ value }) => {
        const positive = isPositive(value);
        return (
        <span
            className={`p-1 text-sm leading-none rounded-md ${
            positive
                ? "bg-success/20 text-success"
                : "bg-red-500/20 text-red-500"
            }`}
        >
            <i className={positive ? "ri-arrow-up-line" : "ri-arrow-down-line"}></i>
            &nbsp;{formatPercent(value)}
        </span>
        );
    };
    const DiffText = ({ value }) => (
        <span
        className={`font-semibold ${
            isPositive(value) ? "text-success" : "text-red-500"
        }`}
        >
        {formatNumber(value)}
        </span>
    );
    const formatNumber = (value) =>
    new Intl.NumberFormat("id-ID").format(Number(value));

    const formatPercent = (value) => {
        const num = Number(value);

        // kalau bilangan bulat → tanpa .00
        if (Number.isInteger(num)) {
            return `${num}%`;
        }

        // selain itu → max 2 decimal, trim nol di belakang
        return `${num.toFixed(2).replace(/\.?0+$/, "")}%`;
    };
    return(
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-5">

            {/* ===== REVENUE ===== */}
            <div className="card">
                <p className="flex items-center gap-2 text-base dark:text-gray-300">
                    Revenue
                </p>
                <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    {formatNumber(account_moves.revenue_total)}
                    <ChangeBadge value={account_moves.revenue_change_pct} />
                </h4>

                <p className="mt-2 text-muted">
                    <DiffText value={account_moves.revenue_diff} /> than last month
                </p>
            </div>

            {/* ===== EXPENSE ===== */}
            <div className="card">
                <p className="flex items-center gap-2 text-base dark:text-gray-300">
                    Expenses
                </p>

                <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    {formatNumber(account_moves.expense_total)}
                    <ChangeBadge value={account_moves.expense_change_pct} />
                </h4>

                <p className="mt-2 text-muted">
                    <DiffText value={account_moves.expense_diff} /> than last month
                </p>
            </div>

            {/* ===== NET PROFIT ===== */}
            <div className="card">
                <p className="flex items-center gap-2 text-base dark:text-gray-300">
                    Net Profit
                </p>

                <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                    {formatNumber(account_moves.net_profit)}
                    <ChangeBadge value={account_moves.net_profit_change_pct} />
                </h4>

                <p className="mt-2 text-muted">
                    <DiffText value={account_moves.net_profit_diff} /> than last month
                </p>
            </div>
        </div>
    )
}
// Mount React
const root = ReactDOM.createRoot(
    document.getElementById("revenue_and_tax")
);
root.render(<AccountMoveCard />);
