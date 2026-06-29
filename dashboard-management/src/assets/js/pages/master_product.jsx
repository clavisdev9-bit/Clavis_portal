const columns = [
  {
    label: "Thumbnail",
    field: "thumbnail",
    index: 1,
    type: "image",
    visible: true,
  },
  {
    label: "Item Name",
    field: "item_name",
    index: 2,
    width: "390px",
    className: "break-words whitespace-normal",
    visible: true,
  },
  {
    label: "SKU",
    field: "sku",
    index: 3,
    visible: true,
  },
  {
    label: "Category",
    field: "category_name",
    index: 4,
    visible: true,
  },
  {
    label: "Price",
    field: "price",
    index: 5,
    type: "currency",
    visible: true,
  },
  {
    label: "Stock",
    field: "stock",
    index: 6,
    type: "number",
    visible: true,
  },
  {
    label: "Is Bundle",
    field: "is_bundle",
    index: 7,
    type: "boolean",
    visible: true,
  },
  {
    label: "Channel Count",
    field: "channel_count",
    index: 8,
    visible: true,
  },
];

const root = ReactDOM.createRoot(document.getElementById("masterProduk"));

root.render(
  <JubelioReusableTable
    title="Master Produk"
    endpoint="/api/master-products"
    columns={columns}
    showFilterPanel={true}
  />,
);
