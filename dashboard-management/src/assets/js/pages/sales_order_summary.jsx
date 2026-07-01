const { useEffect, useState } = React;

const SalesOrderSummary = () => {
    const [salesOrderSummary, setSalesOrderSummary] = useState({});
    const [salesOrderMonthly, setSalesOrderMonthly] = useState({});
    const [salesOrderTopCustomer, setSalesOrderTopCustomer] = useState({});
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const chartRef2 = useRef(null);
    const chartInstance2 = useRef(null);
    useEffect(() => {
        axios.get(`${__JUBELIO_URL__}/api/sales-orders/dashboard`)
            .then(res => {
                setSalesOrderSummary(res.data.data.summary);
                setSalesOrderMonthly(res.data.data.monthly_chart);
                setSalesOrderTopCustomer(res.data.data.top_customers);
                const topItems = [...res.data.data.top_customers].sort((a, b) =>
                    Number(b.total_amount) - Number(a.total_amount)
                );

                setSalesOrderTopCustomer(topItems);
            })
            .catch(err => console.error(err));
    }, []);
    useEffect(() => {
        if (!salesOrderMonthly.length) return;
        const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];
        const categories = salesOrderMonthly.map(item =>
            monthNames[Number(item.month) - 1]
        );
        const seriesData = salesOrderMonthly.map(item => item.total_amount);

        const options = {
            series: [
                {
                    name: "Total Amount",
                    data: seriesData,
                },
            ],
            tooltip: {
                custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    const item = salesOrderMonthly[dataPointIndex];

                    return `
                        <div style="padding:10px">
                            <div><b style="color:#78aafa">\u25CD</b>&nbsp&nbsp<b>Month : ${monthNames[Number(item.month) - 1]}</b></div>
                            <div>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspAmount : ${formatCurrency(series[seriesIndex][dataPointIndex])}</div>
                            <div>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspTotal SO : ${item.total_sales_order}</div>
                        </div>
                    `;
                }
            },
            chart: {
                height: 340,
                type: "area",
                zoom: {
                    enabled: false,
                },
            },
            yaxis: {
                categories: seriesData,
                tickAmount: 9, 
                labels: {
                    formatter: function (value) {
                        return (value / 1000000).toFixed(0) + " jt";
                    }
                }
            },
            dataLabels: {
                enabled: false,
            },
            labels: categories,
            fill: {
                type: "gradient",
                gradient: {
                    opacityFrom: 0,
                    stops: [100, 100],
                },
            },
        };

        // Destroy chart lama jika ada
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        chartInstance.current = new ApexCharts(chartRef.current, options);
        chartInstance.current.render();
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [salesOrderMonthly]);
    useEffect(() => {
        if (!salesOrderTopCustomer.length) return;

        const categories = salesOrderTopCustomer.map(item => item.customer_name);
        const seriesData = salesOrderTopCustomer.map(item => item.total_amount);
        const quantity = salesOrderTopCustomer.map(item => item.total_sales_order);
        var options = {
            series: [
                {
                    name: "Customer",
                    data: seriesData,
                },
            ],
            tooltip: {
                custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    const item = salesOrderTopCustomer[dataPointIndex];

                    return `
                        <div style="padding:10px">
                            <div><b style="color:#78aafa">\u25CD</b>&nbsp&nbsp<b>${item.customer_name}</b></div>
                            <div>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspAmount : ${formatCurrency(series[seriesIndex][dataPointIndex])}</div>
                            <div>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspTotal SO : ${item.total_sales_order}</div>
                        </div>
                    `;
                }
            },
            chart: {
                height: 340,
                type: "bar",
                zoom: {
                    enabled: false,
                },
            },
            stroke: {
                show: true,
                width: 1,
            },
            colors: ["#0ea5e9"],
            xaxis: {
                categories: categories,
                axisBorder: {
                    color: "#ffffff",
                },
                tickAmount: 9, 
                labels: {
                    formatter: function (value) {
                        return (value / 1000000).toFixed(0) + " jt";
                    }
                }
            },
            yaxis: {
                labels: {
                    formatter: function(value) {
                        const words = value.toString().split(" ");
                        const lines = [];

                        for (let i = 0; i < words.length; i += 2) {
                            lines.push(words.slice(i, i + 2).join(" "));
                        }

                        return lines;
                    },
                    style: {
                        fontSize: "12px",
                        fontWeight: 600,
                        colors: ["#ffffff"]
                    }
                }
            },
            grid: {
                borderColor: "#e8e8e8",
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                },
            },
            dataLabels: {
                enabled: true,
                formatter: function (value) {
                    return formatCurrency(value);
                }
            }
        };
        if (chartInstance2.current) {
            chartInstance2.current.destroy();
        }

        chartInstance2.current = new ApexCharts(chartRef2.current, options);
        chartInstance2.current.render();
        return () => {
            if (chartInstance2.current) {
                chartInstance2.current.destroy();
            }
        };
    },[salesOrderTopCustomer]);
    const formatCurrency = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(Number(value || 0));
    };
    useEffect(() => {
        if (window.feather) {
            feather.replace();
        }
    }, [salesOrderSummary]);
    const formatJuta = (value) => {
        if (value >= 1000000) {
            return (value / 1000000).toLocaleString("id-ID", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            }) + " jt";
        }

        return value.toLocaleString("id-ID");
    };
    return (
        <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-5">

                {/* Total Purchase Orders */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i data-feather="shopping-bag" className="size-4"></i>
                        Total Sales Orders
                    </p>
                    <h4 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {salesOrderSummary.total_sales_orders}
                    </h4>
                    <p className="text-muted">
                        Today: <span className="font-semibold text-success">
                            {salesOrderSummary.today_sales_orders}
                        </span>
                    </p>
                    <p className="text-muted">
                        This Month: <span className="font-semibold text-success">
                            {salesOrderSummary.this_month_sales_orders}
                        </span>
                    </p>
                </div>

                {/* Total Amount */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i class="fa-solid fa-money-bill"></i>
                        Total Amount
                    </p>
                    <h4 className="mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(salesOrderSummary.total_amount)}
                    </h4>
                    <p className="mt-2 text-muted">
                        Average:{" "}
                        <span className="font-semibold text-success">
                            {formatCurrency(salesOrderSummary.total_amount/salesOrderSummary.total_customers)}
                        </span>
                    </p>
                </div>

                {/* Open Purchase Orders */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i data-feather="activity" className="size-4"></i>
                        Completed Sales Orders
                    </p>
                    <h4 className="mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {salesOrderSummary.completed_sales_orders}
                    </h4>
                    <p className="mt-2 text-muted">
                        Canceled:{" "}
                        <span className="font-semibold text-danger">
                            {salesOrderSummary.canceled_sales_orders}
                        </span>
                    </p>
                </div>

                {/* Total Suppliers */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i data-feather="truck" className="size-4"></i>
                        Total Customers
                    </p>
                    <h4 className="mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {salesOrderSummary.total_customers}
                    </h4>
                </div>

                {/* Highest Purchase */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i data-feather="stop-circle" className="size-4"></i>
                        Total Amount
                    </p>
                    <h4 className="mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(salesOrderSummary.total_amount)}
                    </h4>
                </div>

            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-4">
                <div class="card rounded-xs shadow p-4">
                    <h3 class="text-lg font-semibold mb-2">Monthly Chart</h3>
                    <p class="text-sm">
                        <div ref={chartRef}></div>
                    </p>
                </div>
                <div class="card rounded-xs shadow p-4">
                    <h3 class="text-lg font-semibold mb-2">Top Customers</h3>
                    <p class="text-sm">
                        <div ref={chartRef2}></div>
                    </p>
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(
    document.getElementById("sales_order_summary")
);

root.render(<SalesOrderSummary />);