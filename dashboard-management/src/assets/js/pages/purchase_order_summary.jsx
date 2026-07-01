const { useEffect, useState } = React;

const PurchaseOrderSummary = () => {
    const [purchaseOrderSummary, setPurchaseOrderSummary] = useState({});
    const [purchaseOrderMonthly, setPurchaseOrderMonthly] = useState({});
    const [purchaseOrderTopSupplier, setPurchaseOrderTopSupplier] = useState({});
    const [purchaseOrderTopItems, setPurchaseOrderTopItems] = useState({});
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const chartRef2 = useRef(null);
    const chartInstance2 = useRef(null);
    const chartRef3 = useRef(null);
    const chartInstance3 = useRef(null);
    useEffect(() => {
        axios.get(`${__JUBELIO_URL__}/api/purchase-orders/dashboard`)
            .then(res => {
                setPurchaseOrderSummary(res.data.data.summary);
                setPurchaseOrderMonthly(res.data.data.monthly_chart);
                setPurchaseOrderTopSupplier(res.data.data.top_suppliers);
                const topItems = [...res.data.data.top_items].sort((a, b) =>
                    Number(b.total_amount) - Number(a.total_amount)
                );

                setPurchaseOrderTopItems(topItems);
            })
            .catch(err => console.error(err));
    }, []);
    useEffect(() => {
        if (!purchaseOrderMonthly.length) return;
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
        const categories = purchaseOrderMonthly.map(item =>
            monthNames[Number(item.month) - 1]
        );
        const seriesData = purchaseOrderMonthly.map(item => item.total_amount);

        const options = {
            series: [
                {
                    name: "Total Amount",
                    data: seriesData,
                },
            ],
            tooltip: {
                custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    const item = purchaseOrderMonthly[dataPointIndex];

                    return `
                        <div style="padding:10px">
                            <div><b style="color:#78aafa">\u25CD</b>&nbsp&nbsp<b>Month : ${monthNames[Number(item.month) - 1]}</b></div>
                            <div>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspAmount : ${formatCurrency(series[seriesIndex][dataPointIndex])}</div>
                            <div>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspTotal PO : ${item.total_purchase_orders}</div>
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
    }, [purchaseOrderMonthly]);
    useEffect(() => {
        if (!purchaseOrderTopSupplier.length) return;

        const categories = purchaseOrderTopSupplier.map(item => item.supplier_name);
        const seriesData = purchaseOrderTopSupplier.map(item => item.total_amount);
        const quantity = purchaseOrderTopSupplier.map(item => item.total_purchase_orders);
        var options = {
            series: [
                {
                    name: "Supplier",
                    data: seriesData,
                },
            ],
            tooltip: {
                custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    const item = purchaseOrderTopSupplier[dataPointIndex];

                    return `
                        <div style="padding:10px">
                            <div><b style="color:#78aafa">\u25CD</b>&nbsp&nbsp<b>${item.supplier_name}</b></div>
                            <div>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspAmount : ${formatCurrency(series[seriesIndex][dataPointIndex])}</div>
                            <div>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspTotal PO : ${item.total_purchase_orders}</div>
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
    },[purchaseOrderTopSupplier]);
    useEffect(() => {
        if (!purchaseOrderTopItems.length) return;

        const categories = purchaseOrderTopItems.map(item => item.item_name);
        const seriesData = purchaseOrderTopItems.map(item => item.total_amount);
        const quantity = purchaseOrderTopItems.map(item => item.total_qty);
        var options = {
            series: [
                {
                    name: "Amount",
                    data: seriesData,
                },
            ],
            tooltip: {
                custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    const item = purchaseOrderTopItems[dataPointIndex];

                    return `
                        <div style="padding:10px">
                            <div><b style="color:#78aafa">\u25CD</b>&nbsp&nbsp<b>${item.item_name}</b></div>
                            <div>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspAmount : ${formatCurrency(series[seriesIndex][dataPointIndex])}</div>
                            <div>&nbsp&nbsp&nbsp&nbsp&nbsp&nbspQty : ${item.total_qty}</div>
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
                toolbar: {
                    show: false,
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
                    align: "left",
                    style: {
                        fontSize: "11px",
                        fontWeight: 600,
                        colors: ["#ffffff"]
                    },
                    formatter: function(value) {
                        const words = value.toString().split(" ");
                        const lines = [];

                        for (let i = 0; i < words.length; i += 2) {
                            lines.push(words.slice(i, i + 2).join(" "));
                        }

                        return lines;
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
        if (chartInstance3.current) {
            chartInstance3.current.destroy();
        }

        chartInstance3.current = new ApexCharts(chartRef3.current, options);
        chartInstance3.current.render();
        return () => {
            if (chartInstance3.current) {
                chartInstance3.current.destroy();
            }
        };
    },[purchaseOrderTopItems]);
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
    }, [purchaseOrderSummary]);
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
                        Total Purchase Orders
                    </p>
                    <h4 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {purchaseOrderSummary.total_purchase_orders}
                    </h4>
                    <p className="text-muted">
                        Today: <span className="font-semibold text-success">
                            {purchaseOrderSummary.today_purchase_orders}
                        </span>
                    </p>
                    <p className="text-muted">
                        This Month: <span className="font-semibold text-success">
                            {purchaseOrderSummary.this_month_purchase_orders}
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
                        {formatCurrency(purchaseOrderSummary.total_amount)}
                    </h4>
                    <p className="mt-2 text-muted">
                        Average:{" "}
                        <span className="font-semibold text-success">
                            {formatCurrency(purchaseOrderSummary.average_amount)}
                        </span>
                    </p>
                </div>

                {/* Open Purchase Orders */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i data-feather="activity" className="size-4"></i>
                        Open Purchase Orders
                    </p>
                    <h4 className="mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {purchaseOrderSummary.open_purchase_orders}
                    </h4>
                    <p className="mt-2 text-muted">
                        Closed:{" "}
                        <span className="font-semibold text-success">
                            {purchaseOrderSummary.closed_purchase_orders}
                        </span>
                    </p>
                </div>

                {/* Total Suppliers */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i data-feather="truck" className="size-4"></i>
                        Total Suppliers
                    </p>
                    <h4 className="mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {purchaseOrderSummary.total_suppliers}
                    </h4>
                    <p className="mt-2 text-muted">
                        Total Items:{" "}
                        <span className="font-semibold text-success">
                            {purchaseOrderSummary.total_items}
                        </span>
                    </p>
                </div>

                {/* Highest Purchase */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i data-feather="stop-circle" className="size-4"></i>
                        Highest Purchase
                    </p>
                    <h4 className="mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(purchaseOrderSummary.highest_purchase)}
                    </h4>
                    <p className="mt-2 text-muted">
                        Lowest:{" "}
                        <span className="font-semibold text-danger">
                            {formatCurrency(purchaseOrderSummary.lowest_purchase)}
                        </span>
                    </p>
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
                    <h3 class="text-lg font-semibold mb-2">Top Suppliers</h3>
                    <p class="text-sm">
                        <div ref={chartRef2}></div>
                    </p>
                </div>

                <div class="card rounded-xs shadow p-4">
                    <h3 class="text-lg font-semibold mb-2">Top Items</h3>
                    <p class="text-sm">
                        <div ref={chartRef3}/>
                    </p>
                </div>

            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(
    document.getElementById("purchase_order_summary")
);

root.render(<PurchaseOrderSummary />);