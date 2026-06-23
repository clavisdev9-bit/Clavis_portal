const {useEffect,useState}=React;
function InvoiceCard(){
    const [billingTrend,setBillingTrend]=useState([]);
    const [collectionTrend,setCollectionTrend]=useState([]);
    const [agingAnalysis,setAgingAnalysis]=useState([]);
    const chartRef = useRef(null);
    const chartPayTrend = useRef(null);
    const chartAgingAnalysis = useRef(null);
    const chartInstance = useRef(null);
    const chartInstance2 = useRef(null);
    const chartInstance3 = useRef(null);
    const tableCustomer = useRef(null);
    const [topCustomer, setTopCustomer] = useState([]);
    const tableCustomerOutstanding = useRef(null);
    const [topCustomerOutstanding, setTopCustomerOutstanding] = useState([]);
    useEffect(()=>{
        axios.get(`${__API_URL__}/invoices/billing_trend`)
        .then(res=>setBillingTrend(res.data.rows))
        .catch(err=>console.error(err));

        axios.get(`${__API_URL__}/invoices/collection_trend`)
        .then(res=>setCollectionTrend(res.data.rows))
        .catch(err=>console.error(err));
        
        axios.get(`${__API_URL__}/invoices/aging_analysis`)
        .then(res=>setAgingAnalysis(res.data.rows))
        .catch(err=>console.error(err));

        axios.get(`${__API_URL__}/invoices/top_customer`)
            .then(res => setTopCustomer(res.data.rows))
            .catch(err => console.error(err));
            
        axios.get(`${__API_URL__}/invoices/top_customer_outstanding`)
            .then(res => setTopCustomerOutstanding(res.data.rows))
            .catch(err => console.error(err));
    },[]);
    useEffect(() => {
        if (!billingTrend.length) return;

        const categories = billingTrend.map(item => item.month_name);
        const seriesData = billingTrend.map(item => item.billed_amount);

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
    }, [billingTrend]);

    useEffect(() => {
        if (!collectionTrend.length) return;

        const categories2 = collectionTrend.map(item => item.month_name);
        const seriesData2_1 = collectionTrend.map(item => item.amount_paid);
        const seriesData2_2 = collectionTrend.map(item => item.outstanding_amount);

        const options_2 = {
            chart: {
                height: 350,
                type: "area",
                stacked: true,
                toolbar: {
                    show: false,
                    autoSelected: "zoom",
                },
            },
            colors: ["#0ea5e9", "#bb45ffff"],
            dataLabels: {
                enabled: false,
            },
            stroke: {
                curve: "straight",
                width: [3, 3],
                lineCap: "round",
            },
            grid: {
                borderColor: "#e8e8e8",
                padding: {
                    left: 0,
                    right: 0,
                },
                strokeDashArray: 4,
            },
            markers: {
                size: 0,
                strokeColors: "#000000ff",
                hover: {
                    size: 0,
                },
            },
            series: [
                {
                    name: "Amount Paid",
                    data: seriesData2_1,
                },
                {
                    name: "Outstanding Amount",
                    data: seriesData2_2,
                },
            ],

            xaxis: {
                type: "month",
                categories: categories2,
                axisBorder: {
                    show: true,
                    color: "#e8e8e8",
                },
                axisTicks: {
                    show: true,
                    color: "#e8e8e8",
                },
            },
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.0,
                    opacityTo: 0.0,
                    stops: [0, 90, 100],
                },
            },

            tooltip: {
                x: {
                    format: "dd/MM/yy HH:mm",
                },
            },
            legend: {
                position: "top",
                horizontalAlign: "right",
            },
        };

        // Destroy chart lama jika ada
        if (chartInstance2.current) {
            chartInstance2.current.destroy();
        }

        chartInstance2.current = new ApexCharts(chartPayTrend.current, options_2);
        chartInstance2.current.render();
        return () => {
            if (chartInstance2.current) {
                chartInstance2.current.destroy();
            }
        };
    }, [collectionTrend]);

    useEffect(() => {
        if (!agingAnalysis.length) return;

        const categories3 = agingAnalysis.map(item => item.aging_bucket);
        const seriesData3_1 = agingAnalysis.map(item => item.outstanding_balance);

        const options_3 = {
            chart: {
                height: 350,
                type: "area",
                stacked: true,
                toolbar: {
                    show: false,
                    autoSelected: "zoom",
                },
            },
            colors: ["#0ea5e9", "#bb45ffff"],
            dataLabels: {
                enabled: false,
            },
            stroke: {
                curve: "straight",
                width: [3, 3],
                lineCap: "round",
            },
            grid: {
                borderColor: "#e8e8e8",
                padding: {
                    left: 0,
                    right: 0,
                },
                strokeDashArray: 4,
            },
            markers: {
                size: 0,
                strokeColors: "#000000ff",
                hover: {
                    size: 0,
                },
            },
            series: [
                {
                    name: "Amount Paid",
                    data: seriesData3_1,
                }
            ],

            xaxis: {
                type: "month",
                categories: categories3,
                axisBorder: {
                    show: true,
                    color: "#e8e8e8",
                },
                axisTicks: {
                    show: true,
                    color: "#e8e8e8",
                },
            },
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.0,
                    opacityTo: 0.0,
                    stops: [0, 90, 100],
                },
            },

            tooltip: {
                x: {
                    format: "dd/MM/yy HH:mm",
                },
            },
            legend: {
                position: "top",
                horizontalAlign: "right",
            },
        };

        // Destroy chart lama jika ada
        if (chartInstance3.current) {
            chartInstance3.current.destroy();
        }

        chartInstance3.current = new ApexCharts(chartAgingAnalysis.current, options_3);
        chartInstance3.current.render();
        return () => {
            if (chartInstance3.current) {
                chartInstance3.current.destroy();
            }
        };
    }, [agingAnalysis]);
    return (
        <div class="flex flex-col gap-4 min-h-[calc(100vh-212px)]">
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div class="p-5 bg-white border rounded border-slate-200 dark:bg-darklight dark:border-darkborder">
                    <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Monthly Billing Trend</h2>
                    <div ref={chartRef}></div>
                </div>
                <div class="p-5 bg-white border rounded border-slate-200 dark:bg-darklight dark:border-darkborder">
                    <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Payment Collection Trend</h2>
                    <div ref={chartPayTrend}></div>
                </div>
                <div class="p-5 bg-white border rounded border-slate-200 dark:bg-darklight dark:border-darkborder">
                    <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Aging Analysis</h2>
                    <div ref={chartAgingAnalysis}></div>
                </div>
                <div class="p-5 bg-white border rounded border-slate-200 dark:bg-darklight dark:border-darkborder">
                    <h2 class="mb-4 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">Customers with Highest Outstanding Balance</h2>
                    <div class="flex flex-col md:flex-row gap-4 text-sm">
                        <div class="basis-1/2 flex-1 bg-blue-400 overflow-x-scroll">
                            <table className="border">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Billing</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topCustomer.map((p, i) => (
                                        <tr key={i}>
                                            <td>{p.partner_id[1]?p.partner_id[1]:'-'}</td>
                                            <td>{p.total_billed}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div class="basis-1/2 flex-1 bg-blue-400 overflow-x-scroll">
                            <table className="border">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Outstanding Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topCustomerOutstanding.map((p, i) => (
                                        <tr key={i}>
                                            <td>{p.partner_id[1]?p.partner_id[1]:'-'}</td>
                                            <td>{p.outstanding_balance}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>   
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
// Mount React
const root = ReactDOM.createRoot(
    document.getElementById("invoice_statistics")
);
root.render(<InvoiceCard />);