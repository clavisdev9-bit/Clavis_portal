const {useEffect,useState,useRef}=React;
function SalesReportCard(){
    const [totalSales,setTotalSales]=useState([]);
    const [totalOrders,setTotalOrders]=useState([]);
    const [averageOrder,setAverageOrder]=useState([]);
    const [totalMargin,setTotalMargin]=useState([]);
    const [marginPercent,setMarginPercent]=useState([]);
    const [deliveryFull,setDeliveryFull]=useState([]);
    const [salesTrend, setSalesTrend] = useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [topCustomer, setTopCustomer] = useState([]);
    const chartRef2 = useRef(null);
    const chartInstance2 = useRef(null);
    const [salesPerson, setSalesPerson] = useState([]);
    const chartRef3 = useRef(null);
    const chartInstance3 = useRef(null);
    useEffect(()=>{
        axios.get(`${__API_URL__}/sales/total_sales`)
        .then(res=>setTotalSales(res.data[0].total_amount))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/sales/total_orders`)
        .then(res=>setTotalOrders(res.data[0].total_orders))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/sales/average_orders`)
        .then(res=>setAverageOrder(res.data[0].avg_order_value))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/sales/total_margin`)
        .then(res=>setTotalMargin(res.data[0].total_margin))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/sales/margin_percent`)
        .then(res => {
            const margin = Number(res.data[0].margin_percent);
            setMarginPercent(parseFloat(margin.toFixed(2)));
        })
        .catch(err => console.error(err));
        axios.get(`${__API_URL__}/sales/delivery_full`)
        .then(res=>setDeliveryFull(res.data[0].order_delivery_full))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/sale_order/sales_trend`)
        .then(res=>setSalesTrend(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/sale_order/top_customers`)
        .then(res=>setTopCustomer(res.data))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/sale_order/sales_person`)
        .then(res=>setSalesPerson(res.data))
        .catch(err=>console.error(err));
    },[]);
    useEffect(() => {
        if (!salesTrend.length) return;

        const categories = salesTrend.map(item => item.month_year);
        const seriesData = salesTrend.map(item => item.monthly_sales);

        const options = {
            chart: {
                height: 300,
                type: "area",
                fontFamily: "Inter, sans-serif",
                zoom: {
                    enabled: false,
                },
                toolbar: {
                    show: false,
                },
            },
            series: [
                {
                    name: "Amount Total",
                    data: seriesData,
                },
            ],
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 3,
                curve: "straight",
                lineCap: "butt",
            },
            dropShadow: {
                enabled: true,
                opacity: 0.8,
                blur: 10,
                left: -7,
                top: 22,
            },
            colors: ["#0ea5e9"],
            markers: {
                size: 3,
                colors: ["#0ea5e9"],
                strokeColors: "#0ea5e9",
                strokeWidth: 1,
                hover: {
                    size: 5,
                },
            },
            markers: {
                size: 3, // ⬅️ point jelas di setiap data
                strokeWidth: 1,
                colors: ["#0ea5e9"],
                strokeColors: "#0ea5e9",
                hover: {
                    size: 5,
                },
            },
            labels: categories,
            xaxis: {
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
                crosshairs: {
                    show: true,
                },
                labels: {
                    offsetX: 0,
                    offsetY: 5,
                    style: {
                        fontSize: "12px",
                        cssClass: "apexcharts-xaxis-title",
                    },
                },
                lines: {
                    show: true,    // ⬅️ aktifkan garis horizontal
                },
            },
            yaxis: {
                tickAmount: 5,
                labels: {
                    offsetX: -10,
                    offsetY: 0,
                    style: {
                        fontSize: "12px",
                        cssClass: "apexcharts-yaxis-title",
                    },
                    formatter: function (value) {
                        return (value / 1000000).toFixed(0) + " jt";
                    }
                },
                opposite: false,
                lines: {
                    show: true,    // ⬅️ aktifkan garis vertikal
                },
            },
            grid: {
                show: true,
                borderColor: "#e5e7eb", // warna grid
                strokeDashArray: 0,
                xaxis: {
                    lines: {
                        show: true,
                    },
                },
                yaxis: {
                    lines: {
                        show: true,
                    },
                },
                padding: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                },
            },
            legend: {
                show: false,
            },
            tooltip: {
                marker: {
                    show: true,
                },
                x: {
                    show: false,
                },
            },
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    inverseColors: !1,
                    opacityFrom: 0,
                    opacityTo: 0,
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
            if (chartInstance2.current) {
                chartInstance2.current.destroy();
            }
        };
    }, [salesTrend]);
    useEffect(() => {
        if (!topCustomer.length) return;

        const categories = topCustomer.map(item => item.partner_id);
        const seriesData = topCustomer.map(item => Number(item.total_sales));

        var options = {
            series: [
                {
                    name: "Amount Total",
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
            yaxis: {
                tickAmount: 5,
                labels: {
                    offsetX: -10,
                    offsetY: 0,
                    style: {
                        fontSize: "12px",
                        cssClass: "apexcharts-yaxis-title",
                    },
                    formatter: function (value) {
                        return (value / 1000000).toFixed(0) + " jt";
                    }
                },
                opposite: false,
                lines: {
                    show: true,    // ⬅️ aktifkan garis vertikal
                },
            },
            legend: {
                show: false,
            },
            fill: {
                opacity: 1,
            },
        };

        // Destroy chart lama jika ada
        if (chartInstance2.current) {
            chartInstance2.current.destroy();
        }

        chartInstance2.current = new ApexCharts(chartRef2.current, options);
        chartInstance2.current.render();

        // Cleanup saat component unmount
        return () => {
            if (chartInstance2.current) {
                chartInstance2.current.destroy();
            }
        };
    },[topCustomer]);
    useEffect(() => {
        if (!salesPerson.length) return;

        const categories = salesPerson.map(item => item.create_uid);
        const totalAmount = salesPerson.reduce(
            (sum, item) => sum + Number(item.total_sales),
            0
        );

        const seriesData = salesPerson.map(item => {
            const value = Number(item.total_sales);
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
    },[salesPerson]);
    const formatNumber = (value) => new Intl.NumberFormat("id-ID").format(Number(value));

    const formatCurrency = (value) => {
        if (value == null) return "-";
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value).replace(/^/, "Rp. ");
    };
    return(
        <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-6">

                {/* ===== REVENUE ===== */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i class="fa-solid fa-money-bill"></i>
                        Total Amount
                    </p>
                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(totalSales)}
                    </h4>
                </div>

                {/* ===== EXPENSE ===== */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i data-feather="shopping-bag" className="size-4"></i>
                        Total Sales
                    </p>

                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatNumber(totalOrders)}
                    </h4>
                </div>

                {/* ===== NET PROFIT ===== */}
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        <i data-feather="bar-chart-2" className="size-4"></i>
                        Average Order
                    </p>

                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(averageOrder)}
                    </h4>
                </div>
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        Total Margin
                    </p>

                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatCurrency(totalMargin)}
                    </h4>
                </div>
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        Margin Percent
                    </p>
                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {marginPercent} %
                    </h4>
                </div>
                <div className="card">
                    <p className="flex items-center gap-2 text-base dark:text-gray-300">
                        Delivery Full
                    </p>
                    <h4 className="flex items-center gap-4 mt-3 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        {formatNumber(deliveryFull)}
                    </h4>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-4">
                <div class="card">
                    <h3 class="text-lg font-semibold mb-2">Sales Trend</h3>
                    <p class="text-sm text-gray-600">
                        <div ref={chartRef}></div>
                    </p>
                </div>

                <div class="card">
                    <h3 class="text-lg font-semibold mb-2">Top Customers</h3>
                    <p class="text-sm text-gray-600 dark:text-white">
                        <div ref={chartRef2}></div>
                    </p>
                </div>

                <div class="card">
                    <h3 class="text-lg font-semibold mb-2">Sales by Salesperson</h3>
                    <p class="text-sm text-gray-600 dark:text-white mb-2">
                        <div ref={chartRef3}/>
                    </p>
                </div>

            </div>
        </div>
    )
}
// Mount React
const root = ReactDOM.createRoot(
    document.getElementById("sales_report_summary")
);
root.render(<SalesReportCard />);
