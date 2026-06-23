
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
});

function loadProducts() {
    fetch(`${__API_URL__}/account_moves/top_customer`)
        .then(res => res.json())
        .then(data => {

            // Ambil categories (nama partner) & series (billed_total)
            const categories = data.map(item => item.partner_id[1]);
            const seriesData = data.map(item => Number(item.billed_total));

            renderChart(categories, seriesData);
        })
        .catch(err => console.error(err));
}

function renderChart(categories, seriesData) {
    const simplebarchart = {
        series: [
            {
                name: "Sales",
                data: seriesData,
            },
        ],
        chart: {
            height: 300,
            type: "bar",
            zoom: { enabled: false },
            toolbar: { show: false },
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

    const chart = new ApexCharts(
        document.querySelector("#simplebarchart2"),
        simplebarchart
    );
    chart.render();
}