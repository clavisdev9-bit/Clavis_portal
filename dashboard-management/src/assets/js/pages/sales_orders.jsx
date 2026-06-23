const { useEffect, useState, useRef }=React;
function SalesOrderCard(){
    const [totalSales,setTotalSales]=useState([]);
    const [totalOrder,setTotalOrder]=useState([]);
    const [averageOrder,setAverageOrder]=useState([]);
    const [totalMargin,setTotalMargin]=useState([]);
    const [marginPercent,setMarginPercent]=useState([]);
    const [orderInvoice,setOrderInvoice]=useState([]);
    const [salesTrend, setSalesTrend] = useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [topCustomer, setTopCustomer] = useState([]);
    const chartRef2 = useRef(null);
    const chartInstance2 = useRef(null);
    const [salesPerson, setSalesPerson] = useState([]);
    const chartRef3 = useRef(null);
    const chartInstance3 = useRef(null);
    const formatCurrency = (value) => {
        if (value == null) return "-";
        return "Rp." + new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    };
    useEffect(()=>{
        axios.get(`${__API_URL__}/sale_order/total_sales`)
        .then(res=>setTotalSales(res.data[0].total_sales))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/sale_order/total_orders`)
        .then(res=>setTotalOrder(res.data[0].total_orders))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/sale_order/average_order`)
        .then(res=>setAverageOrder(res.data[0].avg_order_value))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/sale_order/total_margin`)
        .then(res=>setTotalMargin(res.data[0].total_margin))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/sale_order/margin_percent`)
        .then(res=>setMarginPercent(res.data[0].margin_percent))
        .catch(err=>console.error(err));
        axios.get(`${__API_URL__}/sale_order/order_invoice`)
        .then(res=>setOrderInvoice(res.data[0].orders_to_invoice))
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
    }, []);
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
                    name: "Current Week",
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
                size: 0, // ⬅️ point jelas di setiap data
                strokeWidth: 1,
                strokeColors: "#000000ff",
                hover: {
                    size: 1,
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
    return (
    <div className="w-full overflow-x-auto">
        <div className="flex gap-4">

            <div className="card flex-1 min-w-0">
                <h2 className="mb-2 text-sm font-semibold">Total Sales Amount</h2>
                <h4 className="text-2xl font-bold">{formatCurrency(totalSales)}</h4>
            </div>

            <div className="card flex-1 min-w-0">
                <h2 className="mb-2 text-sm font-semibold">Total Orders</h2>
                <h4 className="text-2xl font-bold">{totalOrder}</h4>
            </div>

            <div className="card flex-1 min-w-0">
                <h2 className="mb-2 text-sm font-semibold">Average Order Value</h2>
                <h4 className="text-2xl font-bold">{formatCurrency(averageOrder)}</h4>
            </div>

            <div className="card flex-1 min-w-0">
                <h2 className="mb-2 text-sm font-semibold">Total Margin</h2>
                <h4 className="text-2xl font-bold">{totalMargin}</h4>
            </div>

            <div className="card flex-1 min-w-0">
                <h2 className="mb-2 text-sm font-semibold">Margin %</h2>
                <h4 className="text-2xl font-bold">{formatCurrency(marginPercent)}%</h4>
            </div>

            <div className="card flex-1 min-w-0">
                <h2 className="mb-2 text-sm font-semibold">Orders To Invoice</h2>
                <h4 className="text-2xl font-bold">{orderInvoice}</h4>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-4">
            <div class="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                <h3 class="text-lg font-semibold mb-2">Sales Trend</h3>
                <p class="text-sm text-gray-600">
                    <div ref={chartRef}></div>
                </p>
            </div>

            <div class="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                <h3 class="text-lg font-semibold mb-2">Top Customers</h3>
                <p class="text-sm text-gray-600 dark:text-white">
                    <div ref={chartRef2}></div>
                </p>
            </div>

            <div class="bg-white rounded-lg shadow p-4 dark:bg-gray-800">
                <h3 class="text-lg font-semibold mb-2">Sales by Salesperson</h3>
                <p class="text-sm text-gray-600 dark:text-white mb-2">
                    <div ref={chartRef3}/>
                </p>
            </div>

        </div>
    </div>
);



}
const root = ReactDOM.createRoot(
    document.getElementById("salesOrderTable")
);
root.render(<SalesOrderCard />);