const {useEffect,useState,useRef,useMemo}=React;
function SalesReportCard(){
    const [activeTab, setActiveTab] = useState("profile");
    const contentRef = useRef(null);
    const tabs = ["profile", "dashboard", "settings", "contacts"];
    const handleTabClick = (tab) => {
        setActiveTab(tab);

        const index = tabs.indexOf(tab);

        if (contentRef.current) {
            contentRef.current.scrollTo({
                left: index * contentRef.current.clientWidth,
                behavior: "smooth",
            });
        }
    };
    const handleContentScroll = (e) => {
        const container = e.currentTarget;

        const index = Math.round(
            container.scrollLeft / container.clientWidth
        );

        const currentTab = tabs[index];

        if (currentTab && currentTab !== activeTab) {
            setActiveTab(currentTab);
        }
    };
    return(
        <div className="grid grid-cols-12 gap-4 mt-2">
            <div className="card col-span-12">

                {/* TAB HEADER */}
                <div>

                    <ul className="flex flex-wrap -mb-px text-sm text-center border-b border-slate-200 dark:border-darkborder">

                        {/* PROFILE */}
                        <li className="ltr:mr-2 rtl:ml-2">
                            <button
                                type="button"
                                onClick={() => handleTabClick("profile")}
                                className={`inline-flex p-4 ${
                                    activeTab === "profile"
                                        ? "text-purple border-b-2 border-purple"
                                        : "text-muted border-b-2 border-transparent rounded-t-lg hover:text-purple hover:border-purple"
                                }`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    className="w-5 h-5 ltr:mr-2 rtl:ml-2"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M20 22H18V20C18 18.3431 16.6569 17 15 17H9C7.34315 17 6 18.3431 6 20V22H4V20C4 17.2386 6.23858 15 9 15H15C17.7614 15 20 17.2386 20 20V22ZM12 13C8.68629 13 6 10.3137 6 7C6 3.68629 8.68629 1 12 1C15.3137 1 18 3.68629 18 7C18 10.3137 15.3137 13 12 13ZM12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                                    />
                                </svg>

                                Profile
                            </button>
                        </li>


                        {/* DASHBOARD */}
                        <li className="ltr:mr-2 rtl:ml-2">
                            <button
                                type="button"
                                onClick={() => handleTabClick("dashboard")}
                                className={`inline-flex p-4 ${
                                    activeTab === "dashboard"
                                        ? "text-purple border-b-2 border-purple"
                                        : "text-muted border-b-2 border-transparent rounded-t-lg hover:text-purple hover:border-purple"
                                }`}
                            >
                                Dashboard
                            </button>
                        </li>


                        {/* SETTINGS */}
                        <li className="ltr:mr-2 rtl:ml-2">
                            <button
                                type="button"
                                onClick={() => handleTabClick("settings")}
                                className={`inline-flex p-4 ${
                                    activeTab === "settings"
                                        ? "text-purple border-b-2 border-purple"
                                        : "text-muted border-b-2 border-transparent rounded-t-lg hover:text-purple hover:border-purple"
                                }`}
                            >
                                Settings
                            </button>
                        </li>


                        {/* CONTACTS */}
                        <li className="ltr:mr-2 rtl:ml-2">
                            <button
                                type="button"
                                onClick={() => handleTabClick("contacts")}
                                className={`inline-flex p-4 ${
                                    activeTab === "contacts"
                                        ? "text-purple border-b-2 border-purple"
                                        : "text-muted border-b-2 border-transparent rounded-t-lg hover:text-purple hover:border-purple"
                                }`}
                            >
                                Contacts
                            </button>
                        </li>


                        {/* DISABLED */}
                        <li>
                            <button
                                type="button"
                                disabled
                                className="inline-block p-4 rounded-t-lg cursor-not-allowed text-muted"
                            >
                                Disabled
                            </button>
                        </li>

                    </ul>


                    {/* TAB CONTENT */}
                    <div ref={contentRef} onScroll={handleContentScroll} className="mt-3 text-[13px] flex overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory">

                        <div className="min-w-full flex-shrink-0 snap-start">
                            <p className="text-slate-800 dark:text-slate-100">
                                Lorem Ipsum is simply dummy text of the printing and
                                typesetting industry. Lorem Ipsum has been the industry's
                                standard dummy text ever since the 1500s.
                            </p>
                        </div>


                        {/* DASHBOARD */}
                        <div className="min-w-full flex-shrink-0 snap-start">
                            <p className="text-slate-800 dark:text-slate-100">
                                It is a long established fact that a reader will be
                                distracted by the readable content of a page when
                                looking at its layout.
                            </p>
                        </div>


                        {/* SETTINGS */}
                        <div className="min-w-full flex-shrink-0 snap-start">
                            <p className="text-slate-800 dark:text-slate-100">
                                Contrary to popular belief, Lorem Ipsum is not simply
                                random text. It has roots in a piece of classical
                                Latin literature from 45 BC.
                            </p>
                        </div>


                        {/* CONTACTS */}
                        <div className="min-w-full flex-shrink-0 snap-start">
                            <p className="text-slate-800 dark:text-slate-100">
                                There are many variations of passages of Lorem Ipsum
                                available, but the majority have suffered alteration.
                            </p>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    )
}
// Mount React
const root = ReactDOM.createRoot(
    document.getElementById("sales_report_summary")
);
root.render(<SalesReportCard />);
