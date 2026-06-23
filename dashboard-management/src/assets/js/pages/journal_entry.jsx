const {useEffect,useState,useRef}=React;
function JournalEntryCard(){
    const tableRef = useRef(null);
    const [journalEntries,setJournalEntry]=useState([]);
    const [netRevenue,setNetRevenue]=useState([]);
    const [openAmount,setOpenAmount]=useState([]);
    const [debit,setDebit]=useState([]);
    const [credit,setCredit]=useState([]);
    const [averageNetRevenuePerPartner,setAverageNetRevenuePerPartner]=useState([]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/journal_entry/master`)
        .then(res=>setJournalEntry(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_entry/net_revenue`)
        .then(res=>setNetRevenue(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_entry/open_amount`)
        .then(res=>setOpenAmount(res.data[0].total_open_amount))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_entry/debit`)
        .then(res=>setDebit(res.data[0].total_debit))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_entry/credit`)
        .then(res=>setCredit(res.data[0].total_credit))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_entry/average_net_revenue_per_partner`)
        .then(res=>setAverageNetRevenuePerPartner(res.data))
        .catch(err=>console.error(err));
    }, []);
    useEffect(() => {
        if (!journalEntries.length) return;

        const tableId = '#journalEntryDataTable';

        if ($.fn.DataTable.isDataTable(tableId)) {
            $(tableId).DataTable().clear().destroy();
        }

        const table = $(tableRef.current).DataTable({
            scrollX: true,
            autoWidth: false,
            pageLength: 10
        });

        const handleResize = () => table.columns.adjust();
        $(window).on('resize', handleResize);

        return () => {
            $(window).off('resize', handleResize);
            table.destroy();
        };

    }, [journalEntries]);
    const getAverageRevenue = () => {
        if (!netRevenue.length) return 0;

        const total = netRevenue.reduce((sum, item) => {
            return sum + parseFloat(item.avg_revenue_per_partner);
        }, 0);

        return total / netRevenue.length;
    };
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
            case "posted":
                return (
                    <span className={`${baseClass} bg-green-500 text-white`}>
                        Posted
                    </span>
                );
            case "cancel":
                return (
                    <span className={`${baseClass} bg-red-500 text-white`}>
                        Cancel
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 xl:grid-cols-5">

                    {/* ===== REVENUE ===== */}
                    <div className="card">
                        <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Total Net Revenue Amount</h2>
                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(getAverageRevenue())}
                        </h4>
                    </div>

                    {/* ===== EXPENSE ===== */}
                    <div className="card">
                        <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Total Open Amount</h2>

                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(openAmount)}
                        </h4>
                    </div>

                    {/* ===== NET PROFIT ===== */}
                    <div className="card">
                        <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Sum of Debit</h2>

                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(debit)}
                        </h4>
                    </div>
                    <div className="card">
                        <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Sum of Credit</h2>

                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(credit)}
                        </h4>
                    </div>
                    <div className="card">
                        <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Average Net Revenue Per Partner</h2>

                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {/* {amountPaid} */}
                        </h4>
                    </div>
                </div>
            </div>
            <div class="flex flex-col gap-4 min-h-[calc(100vh-212px)] mt-3">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 2xl:col-span-12 order-[17] card">
                        <div class="flex items-center gap-3 mb-4">
                            <h2 class="text-base font-semibold capitalize text-slate-800 dark:text-slate-100 grow">Journal Entries</h2>
                            <a href="#" class="px-3 py-1.5 rounded-md text-xs border border-black/20 dark:border-darkborder text-muted"><i class="align-bottom ltr:mr-1 rtl:ml-1 ri-filter-line"></i> Filters</a>
                        </div>
                        <div className="overflow-x-auto w-full">
                            <table
                                id="journalEntryDataTable"
                                ref={tableRef}
                                className="display border min-w-max"
                            >
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Number</th>
                                        <th>Partner</th>
                                        <th>Reference</th>
                                        <th>Journal</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {journalEntries.map((p, i) => (
                                        <tr key={i}>
                                            <td>{formatDate(p.date)}</td>
                                            <td>{p.number}</td>
                                            <td>{p.partner[1]?p.partner[1]:'-'}</td>
                                            <td>{p.reference}</td>
                                            <td>{p.journal[1]?p.journal[1]:'-'}</td>
                                            <td>{formatCurrency(p.total)}</td>
                                            <td className="text-center align-middle">
                                                <StatusBadge status={p.status} />
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
    document.getElementById("rootJournalEntry")
);
root.render(<JournalEntryCard />);