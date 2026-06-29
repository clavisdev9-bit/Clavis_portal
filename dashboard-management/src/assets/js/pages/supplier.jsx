const columns = [
  {
    label: "Contact Name",
    field: "contact_name",
    index: 1,
    visible: true,
    render: (value, item) => {
      const isActive =
        item.status === "active" || item.status === 1 || item.status === true;

      return (
        <div className="flex items-center justify-between w-full gap-2">
          <span>{value}</span>

          <span
            className={`px-2 py-0.5 text-xs rounded-full border ${
              isActive
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-red-100 text-red-700 border-red-300"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      );
    },
  },
  {
    label: "Contact Full",
    field: "contact_full",
    index: 2,
    visible: true,
  },
  {
    label: "Category",
    field: "category_display",
    index: 3,
    visible: true,
  },
  {
    label: "Sync from Jubelio",
    field: "sync_from_jubelio_at",
    index: 4,
    visible: true,
    className: "text-center",
    render: (value) => {
      const isValidDate = value && !isNaN(new Date(value).getTime());

      return (
        <i
          className={`text-xl mt-1 -ml-1 ${
            isValidDate
              ? "ri-checkbox-circle-fill text-green-500"
              : "ri-close-circle-fill text-red-500"
          }`}
        ></i>
      );
    },
  },
];

const root = ReactDOM.createRoot(document.getElementById("supplier"));

root.render(
  <SupplierReusableTable
    title="Supplier"
    endpoint="/api/master-supplier"
    columns={columns}
    showFilterPanel={true}
  />,
);
