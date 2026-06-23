const { useEffect, useState, useRef } = React;

function AccountMoveCard() {
    const [accountMoves, setAccountMoves] = useState([]);
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Fetch data
    useEffect(() => {
        axios
            .get(`${__API_URL__}/account_moves/get_vat_summary`)
            .then(res => setAccountMoves(res.data))
            .catch(err => console.error(err));
    }, []);

    // Render / update chart
    useEffect(() => {
        if (!accountMoves.length) return;

        const categories = accountMoves.map(item => item.month_name);
        const seriesData1 = accountMoves.map(item => Number(item.output_vat));
        const seriesData2 = accountMoves.map(item => Number(item.input_vat));

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
                { name: "OUTPUT", data: seriesData1 },
                { name: "INPUT", data: seriesData2 },
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
    }, [accountMoves]);

    return (
        <div ref={chartRef} id="areachart2"></div>
    );
}

const root = ReactDOM.createRoot(
    document.getElementById("areachart2")
);
root.render(<AccountMoveCard />);
