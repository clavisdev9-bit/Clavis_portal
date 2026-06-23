const columns = [
    {
        label: "DC Approved By",
        field: "dc_approved_by",
        index: 1,
        visible: true,
    },
    {
        label: "DC Approved At",
        field: "dc_approved_at",
        index: 2,
        visible: true,
    },
    {
        label: "Customer Code",
        field: "customer.id",
        index: 3,
        visible: true,
    },
    {
        label: "Customer Name",
        field: "customer.name",
        index: 4,
        visible: true,
    },
    {
        label: "DC Code",
        field: "dc_code",
        index: 5,
        visible: true,
    },
    {
        label: "DC Name",
        field: "dc_name",
        index: 6,
        visible: true,
    },
    {
        label: "City",
        field: "city",
        index: 7,
        visible: false,
    },
    {
        label: "Area",
        field: "area",
        index: 8,
        visible: false,
    },
    {
        label: "Min Lead Day",
        field: "min_lead_day",
        index: 9,
        visible: false,
    },
    {
        label: "Max Lead Day",
        field: "max_lead_day",
        index: 10,
        visible: false,
    },
    {
        label: "DC Address",
        field: "dc_address",
        index: 11,
        visible: false,
    },
    {
        label: "Phone 1",
        field: "phone_1",
        index: 12,
        visible: false,
    },
    {
        label: "Phone 2",
        field: "phone_2",
        index: 13,
        visible: false,
    },
    {
        label: "Kode Pos",
        field: "kode_pos",
        index: 14,
        visible: false,
    },
    {
        label: "Pulau",
        field: "pulau",
        index: 15,
        visible: false,
    },
    {
        label: "Propinsi",
        field: "propinsi",
        index: 16,
        visible: false,
    },
    {
        label: "Kabupaten",
        field: "kabupaten",
        index: 17,
        visible: false,
    },
    {
        label: "Kecamatan",
        field: "kecamatan",
        index: 18,
        visible: false,
    },
    {
        label: "Kelurahan",
        field: "kelurahan",
        index: 19,
        visible: false,
    },
]

const root = ReactDOM.createRoot(
    document.getElementById("dc")
);

root.render(
    <ReusableTable
        title="DC"
        endpoint="/api/odoo/dc"
        columns={columns}
    />
);