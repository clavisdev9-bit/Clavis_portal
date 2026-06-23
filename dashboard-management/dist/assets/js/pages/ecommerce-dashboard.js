/*
-------------------------------------------------------------------------
* Template Name    : Sliced Pro - Tailwind CSS Admin & Dashboard Template   * 
* Author           : SRBThemes                                              *
* Version          : 1.0.0                                                  *
* Created          : October 2024                                           *
* File Description : ecommerce dashboard init Js File                       *
*------------------------------------------------------------------------
*/

//Product Views
async function loadChart() {
    async function fetchData() {
        const response = await fetch(`${__API_URL__}/product`);
        const json = await response.json();
        console.log(json);
        const names = json.map(item => item.name);
        const quantities = json.map(item => item.stock);

        return { names, quantities };
    }

    // Load pertama kali
    const { names, quantities } = await fetchData();

    var options = {
        series: [{
            name: 'Quantity',
            data: quantities
        }],
        chart: {
            type: 'bar',
            height: 235,
            sparkline: { enabled: true },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: { enabled: false },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: names
        }
    };

    // Ganti nama variabel chart → barChart
    var barChart = new ApexCharts(
        document.querySelector("#productViewsCharts"),
        options
    );

    barChart.render();

    // Auto Update Setiap 3 Detik
    setInterval(async () => {
        const updatedData = await fetchData();

        barChart.updateOptions({
            series: [{
                name: "Quantity",
                data: updatedData.quantities
            }],
            xaxis: {
                categories: updatedData.names
            }
        });

    }, 3000);
}

loadChart();
let percentChart = null;

async function loadPercentChart() {
    const response = await fetch(`${__API_URL__}/product`);
    const json = await response.json();

    const item_name = json.map(item => item.name);
    const quantities = json.map(item => item.stock);

    const chartEl = document.querySelector("#chart6");

    // Jika elemen chart tidak ada (karena dihapus saat tab berubah)
    if (!chartEl) return;

    // Jika chart instance ada tetapi HTML container kosong → destroy
    if (percentChart && !chartEl.innerHTML.trim()) {
        percentChart.destroy();
        percentChart = null;
    }

    // Jika chart belum dibuat → buat chart
    if (!percentChart) {
        const options = {
            series: quantities,
            chart: {
                height: 270,
                type: "donut",
            },
            colors: ["#0ea5e9","rgba(8, 73, 134, 0.33)", "#50cd89", "#ef4444", "#eab308"],
            legend: {
                position: 'bottom'
            },
            fill: {
                type: 'gradient',
            },
            labels: item_name,
        };

        percentChart = new ApexCharts(chartEl, options);
        percentChart.render();
    } else {
        // Update data jika chart sudah ada
        percentChart.updateSeries(quantities);
        percentChart.updateOptions({ labels: item_name });
    }
}

// Load pertama
loadPercentChart();

// Polling tiap 3 detik
setInterval(loadPercentChart, 3000);


//incomeExpenseChart
var options = {
    series: [{
        name: 'Income',
        data: [31, 40, 28, 51, 42, 109, 100]
    }, {
        name: 'Expense',
        data: [11, 32, 45, 32, 34, 52, 41]
    }],
    chart: {
        height: 240,
        type: 'area',
        sparkline: { enabled: !0 },
    },
    dataLabels: {
        enabled: false
    },
    stroke: {
        curve: 'smooth',
        width: 2,
    },
    fill: {
        gradient: {
            enabled: true,
            opacityFrom: 0.55,
            opacityTo: 0
        }
    },
    xaxis: {
        categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
    colors: ["#0ea5e9", "#ef4444"],
    tooltip: {
        y: {
            formatter: function (val) {
                return "$" + val + "k"
            }
        }
    }
};

var chart = new ApexCharts(document.querySelector("#incomeExpenseChart"), options);
chart.render();