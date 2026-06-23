const columns = [
    {
        label: "Customer Name",
        field: "customer_name",
        index: 1,
        visible: true,
    },
    {
        label: "DC Code",
        field: "dc_code",
        index: 2,
        visible: true,
    },
    {
        label: "Address",
        field: "address",
        index: 3,
        width: "390px",
        className: "break-words whitespace-normal",
        visible: true,
    },
    {
        label: "Kode Pos",
        field: "zip",
        index: 4,
        visible: true,
    },
    {
        label: "Pulau",
        field: "pulau",
        index: 5,
        visible: true,
    },
    {
        label: "Propinsi",
        field: "propinsi",
        index: 6,
        visible: true,
    },
    {
        label: "Kabupaten",
        field: "kabupaten",
        index: 7,
        visible: false,
    },
    {
        label: "Kecamatan",
        field: "kecamatan",
        index: 8,
        visible: false,
    },
    {
        label: "Kelurahan",
        field: "kelurahan",
        index: 9,
        visible: false,
    },
    {
        label: "Freight Type",
        field: "freight_type",
        index: 10,
        visible: false,
    },
    {
        label: "Vendor",
        field: "vendor",
        index: 11,
        visible: false,
    },
    {
        label: "Service",
        field: "service",
        index: 12,
        visible: false,
    },
    {
        label: "City Code",
        field: "city_code",
        index: 13,
        visible: false,
    },
    {
        label: "Prev Effective Code",
        field: "prev_effective_code",
        index: 14,
        visible: false,
    },
    {
        label: "Prev Leadtime",
        field: "prev_leadtime",
        index: 15,
        visible: false,
    },
    {
        label: "Prev Min Kgs",
        field: "prev_min_kgs",
        index: 16,
        visible: false,
    },
    {
        label: "Prev Price",
        field: "prev_price",
        index: 17,
        visible: false,
    },
    {
        label: "Latest Effective Code",
        field: "latest_effective_code",
        index: 18,
        visible: false,
    },
    {
        label: "Latest Leadtime",
        field: "latest_leadtime",
        index: 19,
        visible: false,
    },
    {
        label: "Latest Min Kgs",
        field: "latest_min_kgs",
        index: 20,
        visible: false,
    },
    {
        label: "Latest Price",
        field: "latest_price",
        index: 21,
        visible: false,
    },
    {
        label: "Diff Price",
        field: "diff_price",
        index: 22,
        visible: false,
    },
    {
        label: "Latest Doc Leadtime",
        field: "latest_doc_leadtime",
        index: 23,
        visible: false,
    },
    {
        label: "Latest Doc Price",
        field: "latest_doc_price",
        index: 24,
        visible: false,
    },
    {
        label: "Lowest Min Kgs",
        field: "lowest_min_kgs",
        index: 25,
        visible: false,
    },
    {
        label: "Lowest Price",
        field: "lowest_price",
        index: 26,
        visible: false,
    },
    {
        label: "Base Vendor",
        field: "base_vendor",
        index: 27,
        visible: false,
    },
];

const root = ReactDOM.createRoot(
    document.getElementById("courierPriceList")
);

root.render(
    <ReusableTable
        title="Courier Price List"
        endpoint="/api/odoo/courier-price-list"
        columns={columns}
    />
);