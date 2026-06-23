const columns = [
    { label: "Cust PO No", field: "cust_po_no", index: 1, visible: true },
    { label: "New Cust PO No", field: "new_cust_po_no", index: 2, visible: true },
    { label: "Cust PO Date", field: "cust_po_date", index: 3, visible: true, type: "date" },
    { label: "GR Date", field: "gr_date", index: 4, visible: true, type: "date"},
    { label: "PO No", field: "po_no", index: 5, visible: true },
    { label: "PO Date", field: "po_date", index: 6, visible: true, type: "date" },
    { label: "PO Qty", field: "po_qty", index: 7, visible: false, type:"number" },
    { label: "GR No", field: "gr_no", index: 8, visible: false },
    { label: "GR Qty", field: "gr_qty", index: 9, visible: false, type:"number" },
    { label: "PI No", field: "pi_no", index: 10, visible: false },
    { label: "PI Ref No", field: "pi_ref_no", index: 11, visible: false },
    { label: "PI Date", field: "pi_date", index: 12, visible: false, type: "date" },
    { label: "PI Qty", field: "pi_qty", index: 13, visible: false, type:"number" },
    { label: "SO No", field: "so_no", index: 14, visible: false },
    { label: "SO Date", field: "so_date", index: 15, visible: false, type: "date" },
    { label: "SO Qty", field: "so_qty", index: 16, visible: false, type:"number" },
    { label: "Leadtime", field: "leadtime", index: 17, visible: false },
    { label: "Req. Delivery Date", field: "req_delivery_date", index: 18, visible: false, type: "date" },
    { label: "DO No", field: "do_no", index: 19, visible: false },
    { label: "DO Date", field: "do_date", index: 20, visible: false, type: "date" },
    { label: "DO Qty", field: "do_qty", index: 21, visible: false, type:"number" },
    { label: "POD Date", field: "pod_date", index: 22, visible: false, type: "date" },
    { label: "POD Qty", field: "pod_qty", index: 23, visible: false, type:"number" },
    { label: "SI No", field: "si_no", index: 24, visible: false },
    { label: "SI Date", field: "si_date", index: 25, visible: false, type: "date" },
    { label: "SI Qty", field: "si_qty", index: 26, visible: false, type:"number" },
    { label: "PR No", field: "pr_no", index: 27, visible: false },
    { label: "PR Date", field: "pr_date", index: 28, visible: false, type: "date" },
    { label: "PR Qty", field: "pr_qty", index: 29, visible: false, type:"number" },
    { label: "Customer", field: "customer", index: 30, visible: false },
    { label: "Ship To", field: "ship_to", index: 31, visible: false },
    { label: "GR/PI Amt Bef. Tax", field: "gr_pi_amt_bef_tax", index: 32, visible: false, type:"currency" },
    { label: "GR/PI Tax Amt", field: "gr_pi_tax_amt", index: 33, visible: false, type:"currency" },
    { label: "GR/PI Amt Aft. Tax", field: "gr_pi_amt_aft_tax", index: 34, visible: false, type:"currency" },
    { label: "DO RBP Amt Bef. Tax", field: "do_rbp_amt_bef_tax", index: 35, visible: false, type:"currency" },
    { label: "SI RBP Amt Bef. Tax", field: "si_rbp_amt_bef_tax", index: 36, visible: false, type:"currency" },
    { label: "PR Amt Bef. Tax", field: "pr_amt_bef_tax", index: 37, visible: false, type:"currency" },
    { label: "PO. Qty", field: "po_qty_2", index: 38, visible: false, type:"number" },
    { label: "GR. Qty", field: "gr_qty_2", index: 39, visible: false, type:"number" },
    { label: "PI. Qty", field: "pi_qty_2", index: 40, visible: false, type:"number" },
    { label: "SO. Qty", field: "so_qty_2", index: 41, visible: false, type:"number" },
    { label: "DO. Qty", field: "do_qty_2", index: 42, visible: false, type:"number" },
    { label: "POD. Qty", field: "pod_qty_2", index: 43, visible: false, type:"number" },
    { label: "SI. Qty", field: "si_qty_2", index: 44, visible: false, type:"number" },
    { label: "PR. Qty", field: "pr_qty_2", index: 45, visible: false, type:"number" },
    { label: "Messages", field: "messages", index: 46, visible: false }
];

const root = ReactDOM.createRoot(
    document.getElementById("mti_statutory_sales")
);

root.render(
    <ReusableTable
        title="MTI Statutory Sales"
        endpoint="/api/odoo/statutory-sales-report"
        columns={columns}
    />
);