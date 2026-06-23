const columns = [
    { label: "Cust PO No", field: "cust_po_no", index: 1, visible: true },
    { label: "PO Date", field: "po_date", index: 2, visible: true, type: "date" },
    { label: "GR No", field: "gr_no", index: 3, visible: true },
    { label: "GR Date", field: "gr_date", index: 4, visible: true, type: "date" },
    { label: "Exp Date", field: "exp_date", index: 5, visible: true, type: "date" },
    { label: "Customer", field: "customer", index: 6, visible: true },
    { label: "Customer Alias", field: "customer_alias", index: 7, visible: false },
    { label: "DC Name", field: "dc_name", index: 8, visible: false },
    { label: "Area", field: "area", index: 9, visible: false },
    { label: "Total SKU", field: "total_sku", index: 10, visible: false, type: "number" },
    { label: "Qty SO", field: "qty_so", index: 11, visible: false, type: "number" },
    { label: "Qty SO CTN", field: "qty_so_ctn", index: 12, visible: false, type: "number" },
    { label: "Qty GR", field: "qty_gr", index: 13, visible: false, type: "number" },
    { label: "Qty GRN CTN", field: "qty_grn_ctn", index: 14, visible: false, type: "number" },
    { label: "Qty DO", field: "qty_do", index: 15, visible: false, type: "number" },
    { label: "Qty DO CTN", field: "qty_do_ctn", index: 16, visible: false, type: "number" },
    { label: "Amt Bef. Tax", field: "amt_bef_tax", index: 17, visible: false, type: "number" },
    { label: "Last Status", field: "last_status", index: 18, visible: false },
    { label: "Last Update", field: "last_update", index: 19, visible: false, type: "date" },
    { label: "Messages", field: "messages", index: 20, visible: false }
];

const root = ReactDOM.createRoot(
    document.getElementById("outstanding_pi")
);

root.render(
    <ReusableTable
        title="Outstanding PI"
        endpoint="/api/odoo/outstanding-pi"
        columns={columns}
    />
);