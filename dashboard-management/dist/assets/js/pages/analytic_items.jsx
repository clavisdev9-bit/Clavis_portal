const { useEffect, useState, useRef }=React;
function AnalyticItemsCard(){
    const [analyticItems,setAnalyticItems]=useState([]);
    const [totalRevenue,setTotalRevenue]=useState([]);
    const [transactionAccount,setTransactionAccount]=useState([]);
    
    const [revenue,setRevenue]=useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    
    const [distributionProject,setDistributionProject]=useState([]);
    const chartRef3 = useRef(null);
    const chartInstance3 = useRef(null);

    const [partnerDistribution,setPartnerDistribution]=useState([]);
    const chartRef2 = useRef(null);
    const chartInstance2 = useRef(null);

    useEffect(()=>{
        axios.get(`${__API_URL__}/analytic_item/master`)
        .then(res=>setAnalyticItems(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/analytic_item/total_revenue`)
        .then(res=>setTotalRevenue(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/analytic_item/get_transaction_account`)
        .then(res=>setTransactionAccount(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/analytic_item/revenue`)
        .then(res=>setRevenue(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/analytic_item/distribution_project`)
        .then(res=>setDistributionProject(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/analytic_item/partner_distribution`)
        .then(res=>setPartnerDistribution(res.data))
        .catch(err=>console.error(err));
    }, []);
    useEffect(() => {
        if (!revenue.length) return;

        const categories = revenue.map(item => item.date);
        const seriesData1 = revenue.map(item => Number(item.revenue));
        const seriesData2 = revenue.map(item => Number(item.costs));

        const options = {
            chart: {
                height: 350,
                type: "area",
                stacked: false,
                toolbar: { show: false },
            },
            colors: ["#0e12e9ff", "#c56322ff"],
            dataLabels: { enabled: false },
            stroke: {
                curve: "smooth",
                width: [3, 3],
            },
            grid: {
                borderColor: "#e8e8e8",
                strokeDashArray: 4,
            },
            series: [
                { name: "Revenue", data: seriesData1 },
                { name: "Costs", data: seriesData2 },
            ],
            xaxis: {
                categories: categories,
                axisBorder: { show: true },
                axisTicks: { show: true },
            },
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.4,
                    opacityTo: 0.3,
                    stops: [0, 90, 100],
                },
            },
            legend: {
                position: "top",
                horizontalAlign: "right",
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
    }, [revenue]);
    useEffect(() => {
        if (!distributionProject.length) return;

        const categories = distributionProject.map(item => item.project_name[1]);
        const totalAmount = distributionProject.reduce(
            (sum, item) => sum + Number(item.total_amount),
            0
        );

        const seriesData = distributionProject.map(item => {
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
        if (chartInstance2.current) {
            chartInstance2.current.destroy();
        }

        chartInstance2.current = new ApexCharts(chartRef2.current, basicbonut);
        chartInstance2.current.render();

        // Cleanup saat component unmount
        return () => {
            if (chartInstance2.current) {
                chartInstance2.current.destroy();
            }
        };
    },[distributionProject]);
    useEffect(() => {
        if (!partnerDistribution.length) return;

        const categories = partnerDistribution.map(item => item.partner_name[1]);
        const seriesData = partnerDistribution.map(item => Number(item.total_contribution));

        var options = {
            series: [
                {
                    name: "Total Contribution",
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
        if (chartInstance3.current) {
            chartInstance3.current.destroy();
        }

        chartInstance3.current = new ApexCharts(chartRef3.current, options);
        chartInstance3.current.render();

        // Cleanup saat component unmount
        return () => {
            if (chartInstance3.current) {
                chartInstance3.current.destroy();
            }
        };
    },[partnerDistribution]);
    
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
                        <h2 className="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Total Revenue</h2>
                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(
                            totalRevenue && totalRevenue.length
                                ? totalRevenue[0].total_revenue
                                : null
                            )}
                        </h4>
                    </div>

                    {/* ===== EXPENSE ===== */}
                    <div className="card">
                        <h2 className="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Total Costs</h2>

                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(
                            totalRevenue && totalRevenue.length
                                ? totalRevenue[0].total_costs
                                : null
                            )}
                        </h4>
                    </div>

                    {/* ===== NET PROFIT ===== */}
                    <div className="card">
                        <h2 className="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Net Margin</h2>

                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(
                            totalRevenue && totalRevenue.length
                                ? totalRevenue[0].net_margin
                                : null
                            )}
                        </h4>
                    </div>
                    <div className="card">
                        <h2 className="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Number Of Transaction</h2>

                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {transactionAccount && transactionAccount.length
                            ? transactionAccount[0].transaction_count
                            : "-"}
                        </h4>
                    </div>
                    <div className="card">
                        <h2 className="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Average Trequiation</h2>

                        <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(
                            transactionAccount && transactionAccount.length
                                ? totalRevenue[0].average_transaction_size
                                : null
                            )}
                        </h4>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-4">
                    <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                        <h3 className="text-lg font-semibold mb-2">Revenue VS Costs</h3>
                        <p className="text-sm text-gray-600">
                            <div ref={chartRef}></div>
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                        <h3 className="text-lg font-semibold mb-2">Distribution by Project</h3>
                        <p className="text-sm text-gray-600">
                            <div ref={chartRef2}/>
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                        <h3 className="text-lg font-semibold mb-2">Partner Contribution</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            <div ref={chartRef3}/>
                        </p>
                    </div>

                </div>

            </div>
            <div className="flex flex-col gap-4 min-h-[calc(100vh-212px)]">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 2xl:col-span-12 order-[17] card">
                        <div className="overflow-x-auto w-full">
                            <table className="border min-w-max">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Project</th>
                                        <th>Partner</th>
                                        <th>Amount(IDR)</th>
                                        <th>Joantal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticItems.map((p, i) => (
                                        <tr key={i}>
                                            <td>{formatDate(p.date)}</td>
                                            <td>{p.name}</td>
                                            <td>{p.project[1]?p.project[1]:'-'}</td>
                                            <td>{p.partner[1]?p.partner[1]:'-'}</td>
                                            <td>{formatCurrency(p.amount)}</td>
                                            <td>{p.journal[1]?p.journal[1]:'-'}</td>
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
    document.getElementById("analyticItemsTable")
);
root.render(<AnalyticItemsCard />);