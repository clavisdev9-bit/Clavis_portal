const {useEffect,useState,useRef}=React;
function PageManagementCard(){
    const tableRef = useRef(null);
    const [pageData,setPageData]=useState([]);
    const [allPageData,setAllPageData]=useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [idPage, setIdPage]=useState("NEW DATA");
    const [isEdit, setIsEdit] = useState(false);
    const [name, setName] = useState("");
    const [label, setLabel] = useState("");
    const [logo, setLogo] = useState("");
    const [level, setLevel] = useState("");
    const [parent, setParent] = useState("");
    const fetchAllPages = () => {
        axios.get(`${__API_URL__}/page/get_pages`)
        .then(res => {
            setAllPageData(res.data.rows || res.data);
        })
        .catch(err => console.error(err));
    };
    const fetchParentPages = () => {
        axios.get(`${__API_URL__}/page/get_parent_pages`)
        .then(res => {
            setPageData(res.data.rows || res.data);
        })
        .catch(err => console.error(err));
    };
    useEffect(() => {
        fetchAllPages();
        fetchParentPages();
    }, []);
    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            id: idPage,
            page_name: name,
            page_label: label,
            logo: logo,
            level: level,
            parent: parent
        };

        axios.post(`${__API_URL__}/page/post_page`, payload)
        .then(res => {
            alert("Data berhasil disimpan");

            // reset form
            setIdPage("NEW DATA");
            setName("");
            setLabel("");
            setLogo("");
            setLevel("");
            setParent("");
            fetchParentPages();
            fetchAllPages();
        })
        .catch(err => {
            console.error(err);
            alert("Gagal menyimpan data");
        });
    };
    useEffect(() => {
        if (!allPageData.length) return;

        if ($.fn.DataTable.isDataTable(tableRef.current)) {
            $(tableRef.current).DataTable().destroy();
        }

        const table = $(tableRef.current).DataTable({
            destroy: true,
            scrollX: true,
            autoWidth: false,
            dom: 'Blfrtip',
            data: allPageData,
            columns: [
                { data: "page_label", title: "Page Label" },
                { data: "logo", title: "Logo" },
                { data: "page_name", title: "Link" },
                { data: "level", title: "Level" },
                { data: "parent", title: "Parent" },
            ],
            createdRow: function(row) {
                $(row).addClass('clickable-row');
            }
        });
        $(tableRef.current).off('click', 'tbody tr');

        $(tableRef.current).on('click', 'tbody tr', function () {

            const $rows = $(tableRef.current).find('tbody tr');

            $rows.removeClass('selected-row');
            $(this).addClass('selected-row');

            // 🔥 ambil data row
            const rowData = table.row(this).data();

            console.log(rowData);

            // 🔥 isi form
            setSelectedId(rowData.id);
            setIdPage(rowData.id);
            setName(rowData.page_name || "");
            setLabel(rowData.page_label || "");
            setLogo(rowData.logo || "");
            setLevel(rowData.level || "");
            setParent(rowData.parent_id || "");
            setIsEdit(true);
        });
        setTimeout(() => table.columns.adjust(), 100);

    }, [allPageData]);
    const resetForm=()=>{
        setIdPage("NEW DATA");
        setName("");
        setLabel("");
        setLogo("");
        setLevel("");
        setParent("");
        setIsEdit(false);
    }
    return (
        <div className="card m-5 px-8">
            <form onSubmit={handleSubmit}>
                <div class="grid grid-cols-4 mb-4">
                    <h2 class="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">ID</h2>
                    <input type="text" value={idPage} class="form-input col-span-2" placeholder="NEW DATA" required disabled></input>
                </div>
                <div class="grid grid-cols-4 mb-4">
                    <h2 class="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">Link</h2>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} class="form-input col-span-2" placeholder="Link Name" required></input>
                </div>
                <div class="grid grid-cols-4 mb-4">
                    <h2 class="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">Label</h2>
                    <input type="text" class="form-input col-span-2" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Page Label" required></input>
                </div>
                <div class="grid grid-cols-4 mb-4">
                    <h2 class="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">Logo</h2>
                    <input type="text" class="form-input col-span-2" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="Logo"></input>
                </div>
                <div class="grid grid-cols-4 mb-4">
                    <h2 class="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">Level</h2>
                    <input type="number" class="form-input col-span-2" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Page Level" required></input>
                </div>
                <div class="grid grid-cols-4 mb-4">
                    <h2 class="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">Parent</h2>
                    <select class="form-select col-span-2" value={parent} onChange={(e) => setParent(e.target.value)}>
                        <option>Select Parent</option>
                        {pageData.map(page => (
                            <option key={page.id} value={page.id}>
                                {page.page_label}
                            </option>
                        ))}
                    </select>
                </div>
                <div class="grid grid-cols-4 mb-4 gap-4">
                    <div class=""></div>
                    <div className="col-start-2 flex gap-2">
                        <button
                        type="submit"
                        className={`btn text-white transition-all duration-300 bg-purple border-purple hover:bg-purple/[0.85] hover:border-purple/[0.85]"`}
                        >
                            {isEdit ? "UPDATE" : "SUBMIT"}
                        </button>
                        <button type="button" class="btn bg-danger border-danger text-white transition-all duration-300 hover:bg-danger/[0.85] hover:border-danger/[0.85]" onClick={resetForm}>
                            CLEAR 
                        </button>
                    </div>
                    
                </div>
            </form>
            <table
                ref={tableRef}
                className="min-w-[640px] w-full"
                id="tablePurchaseOrderOutstanding"
            />
        </div>
    );
}

const root = ReactDOM.createRoot(
    document.getElementById("page_management")
);
root.render(<PageManagementCard />);