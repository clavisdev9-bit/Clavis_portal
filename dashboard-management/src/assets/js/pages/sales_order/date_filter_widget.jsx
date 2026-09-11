const { DatePicker } = antd;
const { RangePicker } = DatePicker;

window.DateFilterWidget = function DateFilterWidget({
    isOpen, setIsOpen,
    filterLabel,
    selectedRadio, onRadioChange,
    defaultDates, onRangeChange,
    monthDates, onMonthRangeChange,
    yearDates, onYearRangeChange,
}) {
    const dateFilterOptions = [
        { value: "today", label: "Today" },
        { value: "yesterday", label: "Yesterday" },
        { value: "last 7 days", label: "Last 7 Days" },
        { value: "this week", label: "Weekly" },
        { value: "this month", label: "Monthly" },
        { value: "this year", label: "Yearly" },
        { value: "custom", label: "Custom" },
    ];
    const rangePresets = [
        { label: 'Today', value: [dayjs(), dayjs()] },
        { label: 'Last 7 Days', value: [dayjs().subtract(7, 'day'), dayjs()] },
        { label: 'Last 14 Days', value: [dayjs().subtract(14, 'day'), dayjs()] },
        { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
        { label: 'last 60 Days', value: [dayjs().subtract(90, 'day'), dayjs()] },
    ];

    return (
        <div class="grid grid-cols-1">
            <div className="flex">
                <button type="button" onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center px-4 pb-2 text-muted ${isOpen ? "!text-black dark:!text-white" : ""}`}
                >
                    <div className="flex">
                        <i className="fa-solid fa-filter dark:text-white text-sm"></i>
                        <span className="ml-2 dark:text-white text-dark">Filter</span>
                        &nbsp;| {filterLabel}
                        <div className={`ltr:ml-auto rtl:mr-auto transition-transform duration-300 pt-1 ${isOpen ? "rotate-180" : ""}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5">
                                <path fill="currentColor" d="M11.9997 13.1714L16.9495 8.22168L18.3637 9.63589L11.9997 15.9999L5.63574 9.63589L7.04996 8.22168L11.9997 13.1714Z"/>
                            </svg>
                        </div>
                    </div>
                </button>
                <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-darkborder/40 rounded-xl w-fit">
                    {dateFilterOptions.map((option) => (
                        <label key={option.value}
                            className={`relative flex items-center px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 select-none ${
                                selectedRadio === option.value
                                    ? "bg-white dark:bg-slate-800 text-purple shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            }`}
                        >
                            <input type="radio" name="radio-one" className="sr-only"
                                checked={selectedRadio === option.value}
                                onChange={() => onRadioChange(option.value)}
                            />
                            {option.label}
                        </label>
                    ))}
                </div>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="px-4 py-2 space-y-2 border-t text-muted border-slate-200 dark:border-darkborder">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex flex-col">
                            <label className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-300">Date</label>
                            <RangePicker presets={rangePresets} value={defaultDates} onChange={onRangeChange}
                                className={defaultDates ? "range-picker-date active" : "range-picker-date"}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-300">Month</label>
                            <RangePicker picker="month" value={monthDates} onChange={onMonthRangeChange}
                                className={monthDates ? "range-picker-month active" : "range-picker-month"}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-300">Year</label>
                            <RangePicker picker="year" value={yearDates} onChange={onYearRangeChange}
                                className={yearDates ? "range-picker-year active" : "range-picker-year"}
                                id={{ start: "startInput", end: "endInput" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};