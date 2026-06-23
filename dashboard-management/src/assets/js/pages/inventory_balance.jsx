const columns = [
    {
        label: "Brand",
        field: "brand",
        index: 1,
        visible: true,
    },
    {
        label: "Product Code",
        field: "product_code",
        index: 2,
        visible: true,
    },
    {
        label: "Product Name",
        field: "product_name",
        index: 3,
        visible: true,
    },
    {
        label: "Location",
        field: "location",
        index: 4,
        visible: true,
    },
    {
        label: "Std Pack",
        field: "std_pack",
        index: 5,
        visible: true,
        type: "number",
    },
    {
        label: "Balance Qty",
        field: "balance_qty",
        index: 6,
        visible: true,
        type: "number",
    },
];

const root = ReactDOM.createRoot(
    document.getElementById("inventory_balance")
);

root.render(
    <ReusableTable
        title="Inventory Balance"
        endpoint="/api/odoo/inventory-balance"
        columns={columns}
    />
);