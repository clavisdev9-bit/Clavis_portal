const { useEffect, useState, useRef }=React;
function JournalItemCard(){
    const tableRef = useRef(null);
    const [journalItem,setJournalItem]=useState([]);
    const [totalDebit,setTotalDebit]=useState([]);
    const [totalCredit,setTotalCredit]=useState([]);
    const [netBalance,setNetBalance]=useState([]);
    const [residualAmount,setResidualAmount]=useState([]);
    const [invoicePosted,setInvoicePosted]=useState([]);
    const [paymentMatched,setPaymentMatched]=useState([]);
    const [residualAging, setResidualAging] = useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [partnerResidual, setPartnerResidual] = useState([]);
    const chartRef2 = useRef(null);
    const chartInstance2 = useRef(null);
    const [journalDistribution, setJournalDistribution] = useState([]);
    const chartRef3 = useRef(null);
    const chartInstance3 = useRef(null);
    const [showFilter, setShowFilter] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const filterRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
            setShowFilter(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    useEffect(()=>{
        axios.get(`${__API_URL__}/journal_item/master`)
        .then(res=>setJournalItem(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_item/total_debit`)
        .then(res=>setTotalDebit(res.data[0].total_debit))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_item/total_credit`)
        .then(res=>setTotalCredit(res.data[0].total_credit))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_item/net_balance`)
        .then(res=>setNetBalance(res.data[0].net_balance))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_item/residual_amount`)
        .then(res=>setResidualAmount(res.data[0].total_residual))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_item/invoice_posted`)
        .then(res=>setInvoicePosted(res.data[0].invoices_posted))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_item/payment_matched`)
        .then(res=>setPaymentMatched(res.data[0].payments_matched))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_item/residual_aging`)
        .then(res=>setResidualAging(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_item/top_partner_residual`)
        .then(res=>setPartnerResidual(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/journal_item/journal_distribution`)
        .then(res=>setJournalDistribution(res.data))
        .catch(err=>console.error(err));
    }, []);
    const filteredJournal = journalItem.filter((item) => {
        if (!startDate && !endDate) return true;

        const d = new Date(item.date);
        const start = new Date(startDate);
        start.setHours(0,0,0,0);

        const end = new Date(endDate);
        end.setHours(23,59,59,999);

        if (start && d < new Date(start)) return false;
        if (end && d > new Date(end)) return false;

        return true;
    });
    useEffect(() => {
    if (!filteredJournal.length) return;

        const tableId = '#journalItemDataTable';

        // destroy kalau sudah ada
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

    }, [filteredJournal]);
    useEffect(() => {
        if (!residualAging.length) return;

        const categories = residualAging.map(item => item.aging_bucket);
        const seriesData = residualAging.map(item => Number(item.residual_total));

        var options = {
            series: [
                {
                    name: "PRODUCT A",
                    data: seriesData,
                },
            ],
            chart: {
                type: "bar",
                height: 300,
                stacked: true,
                toolbar: {
                    show: false,
                },
                zoom: {
                    enabled: false,
                },
            },
            dataLabels: {
                enabled: false,
            },
            colors: ["#22c55e", "#ef4444", "#0ea5e9"],

            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 10,
                    columnWidth: "25%",
                },
            },
            xaxis: {
                categories: categories,
            },
            legend: {
                show: false,
            },
            fill: {
                opacity: 1,
            },
        };

        // Destroy chart lama jika ada
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        chartInstance.current = new ApexCharts(chartRef.current, options);
        chartInstance.current.render();

        // Cleanup saat component unmount
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    },[residualAging]);
    useEffect(() => {
        if (!partnerResidual.length) return;

        const categories = partnerResidual.map(item => item.partner[1]);
        const seriesData = partnerResidual.map(item => Number(item.residual_total));

        var simplebarchart = {
            series: [
                {
                    name: "Residual Total",
                    data: seriesData,
                },
            ],
            chart: {
                height: 300,
                type: "bar",
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 1,
            },
            colors: ["#0ea5e9"],
            xaxis: {
                categories: categories,
                axisBorder: {
                    color: "#e0e6ed",
                },
            },
            yaxis: {
                opposite: false,
                reversed: false,
            },
            grid: {
                borderColor: "#e8e8e8",
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                },
            },
            fill: {
                opacity: 0.8,
            },
        };

        // Destroy chart lama jika ada
        if (chartInstance2.current) {
            chartInstance2.current.destroy();
        }

        chartInstance2.current = new ApexCharts(chartRef2.current, simplebarchart);
        chartInstance2.current.render();

        // Cleanup saat component unmount
        return () => {
            if (chartInstance2.current) {
                chartInstance2.current.destroy();
            }
        };
    },[partnerResidual]);
    useEffect(() => {
        if (!journalDistribution.length) return;

        const categories = journalDistribution.map(item => item.journal[1]);
        const totalAmount = journalDistribution.reduce(
            (sum, item) => sum + Number(item.total_amount),
            0
        );

        const seriesData = journalDistribution.map(item => {
            const value = Number(item.total_amount);
            return Number(((value / totalAmount) * 100).toFixed(2));
        });
        var basicbonut = {
            series: seriesData,
            chart: {
                height: 300,
                type: "donut",
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },
            stroke: {
                show: false,
            },
            labels: categories,
            colors: ["#0ea5e9", "#22c55e", "#ef4444", "#94989a"],
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        chart: {
                            width: 200,
                        },
                    },
                },
            ],
            legend: {
                position: "bottom",
            },
        };

        // Destroy chart lama jika ada
        if (chartInstance3.current) {
            chartInstance3.current.destroy();
        }

        chartInstance3.current = new ApexCharts(chartRef3.current, basicbonut);
        chartInstance3.current.render();

        // Cleanup saat component unmount
        return () => {
            if (chartInstance3.current) {
                chartInstance3.current.destroy();
            }
        };
    },[journalDistribution]);
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
    return(
        <div>
            <div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 xl:grid-cols-5">

                    {/* ===== REVENUE ===== */}
                    <div className="card">
                        <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Total Debit</h2>
                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(totalDebit)}
                        </h4>
                    </div>

                    {/* ===== EXPENSE ===== */}
                    <div className="card">
                        <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Total Credit</h2>

                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(totalCredit)}
                        </h4>
                    </div>

                    {/* ===== NET PROFIT ===== */}
                    <div className="card">
                        <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Net Balance</h2>

                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(netBalance)}
                        </h4>
                    </div>
                    <div className="card">
                        <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Invoices Posted</h2>

                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {invoicePosted}
                        </h4>
                    </div>
                    <div className="card">
                        <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Payments Matched</h2>

                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {paymentMatched}
                        </h4>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-4">
                    <div class="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                        <h3 class="text-lg font-semibold mb-2">Monthly debit vs credit trend</h3>
                        <p class="text-sm text-gray-600">
                            
                        </p>
                    </div>

                    <div class="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                        <h3 class="text-lg font-semibold mb-2">Residual Aging Analysis</h3>
                        <p class="text-sm text-gray-600">
                            <div ref={chartRef}></div>
                        </p>
                    </div>

                    <div class="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                        <h3 class="text-lg font-semibold mb-2">Top Accounts by Residual</h3>
                        <p class="text-sm text-gray-600 mb-2">
                            <div ref={chartRef2}/>
                        </p>
                        <p class="text-sm text-gray-600 mb-2">
                            <h3 class="text-lg font-semibold mb-2">Journal Distribution</h3>
                        </p>
                        <p class="text-sm text-gray-600">
                            <div ref={chartRef3}/>
                        </p>
                    </div>

                </div>

            </div>
            <div class="flex flex-col gap-4 min-h-[calc(100vh-212px)] mt-4">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 2xl:col-span-12 order-[17] card">
                        <div className="flex items-center gap-3 mb-4 relative" ref={filterRef}>
                            <h2 className="text-base font-semibold capitalize text-slate-800 dark:text-slate-100 grow">
                                Journal Items
                            </h2>
                            <div className="relative">
                                <button onClick={() => setShowFilter(!showFilter)} className="px-3 py-1.5 rounded-md text-xs border border-black/20 dark:border-darkborder text-muted">
                                    <i className="align-bottom ltr:mr-1 rtl:ml-1 ri-filter-line"></i>
                                    Filters
                                </button>

                                {showFilter && (
                                    <div className="absolute top-full mt-2 right-0 w-96 bg-white dark:bg-slate-800 border border-gray-200 dark:border-darkborder rounded-lg shadow-xl p-4 z-50">
                                        <h4 className="text-sm font-semibold mb-3">Date Range</h4>
                                        <div className="flex gap-3">
                                            <div className="flex-1 flex flex-col">
                                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded p-2 text-sm"/>
                                            </div>
                                            <div className="flex-1 flex flex-col">
                                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border rounded p-2 text-sm"/>
                                            </div>
                                        </div>

                                        <div className="flex justify-between mt-4">
                                            <button onClick={() => {
                                                setStartDate("");
                                                setEndDate("");
                                            }} className="text-xs text-red-500">
                                                Reset
                                            </button>
                                            <button onClick={() => setShowFilter(false)} className="px-3 py-1 text-xs bg-blue-600 text-white rounded">
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto w-full">
                           <table
                                id="journalItemDataTable"
                                ref={tableRef}
                                className="display border min-w-max"
                            >
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Journal Entry</th>
                                        <th>Account</th>
                                        <th>Partner</th>
                                        <th>Label</th>
                                        <th>Debit</th>
                                        <th>Matching</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredJournal.map((p, i) => (
                                        <tr key={i}>
                                            <td>{formatDate(p.date)}</td>
                                            <td>{p.number}</td>
                                            <td>{p.account}</td>
                                            <td>{p.partner}</td>
                                            <td>{p.name}</td>
                                            <td>{formatCurrency(p.debit)}</td>
                                            <td>{formatCurrency(p.balance)}</td>
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
    document.getElementById("rootJournal")
);
root.render(<JournalItemCard />);