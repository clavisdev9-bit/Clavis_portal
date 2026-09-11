window.CompanyTabs = function CompanyTabs({ companies, selectedCompany, onCompanyClick, onContentScroll, contentRef, children }) {
    return (
        <div class="grid grid-cols-1">
            <div>
                <ul className="flex flex-nowrap overflow-x-auto -mb-px text-sm text-center border-b border-slate-200 dark:border-darkborder">
                    {companies.map((company) => (
                        <li key={company.id} className="ltr:mr-2 rtl:ml-2 flex-shrink-0">
                            <button type="button" onClick={() => onCompanyClick(company.id)}
                                className={`inline-flex p-4 ${
                                    selectedCompany === company.id
                                        ? "text-purple border-b-2 border-purple"
                                        : "text-muted border-b-2 border-transparent rounded-t-lg hover:text-purple hover:border-purple"
                                }`}
                            >
                                {company.name}
                            </button>
                        </li>
                    ))}
                </ul>

                <div ref={contentRef} onScroll={onContentScroll}
                    className="mt-3 text-[13px] flex overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory hide-scrollbar"
                >
                    {children}
                </div>
            </div>
        </div>
    );
};