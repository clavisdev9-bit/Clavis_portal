const { useEffect, useState } = React;

function UserPageManagementCard() {
    const [userData, setUserData] = useState([]);
    const [pageData, setPageData] = useState([]);
    const [checkedPage, setCheckedPage] = useState([]);

    const [selectedUser, setSelectedUser] = useState("");
    const [selectedPages, setSelectedPages] = useState([]);
    const [selectedUserPage, setSelectedUserPage] = useState([]);

    // ambil user
    useEffect(() => {
        axios.get(`${__API_URL__}/user/get_users`)
            .then(res => setUserData(res.data.rows || res.data))
            .catch(err => console.error(err));
    }, []);

    // ambil page
    useEffect(() => {
        axios.get(`${__API_URL__}/page/get_pages`)
            .then(res => setPageData(res.data.rows || res.data))
            .catch(err => console.error(err));
    }, []);
    const handleUserChange=async(e)=>{
        const userId = e.target.value;
        setSelectedUser(userId);
        try {
            const response = await axios.get(
                `${__API_URL__}/user_page/get_this_user_page`,
                {
                    params: { user_id: userId }
                }
            );
            setSelectedPages(response.data[0].map(Number));
        } catch (error) {
            setSelectedPages([]);
        }
    }

    // handle checkbox
    const handleCheckboxChange = (e) => {
        const value = Number(e.target.value);
        const isChecked = e.target.checked;

        const currentPage = pageData.find(p => p.id === value);

        setSelectedPages((prev) => {
            let updated = [...prev];

            // 🔥 kalau checkbox di-check
            if (isChecked) {
                // tambah diri sendiri
                if (!updated.includes(value)) {
                    updated.push(value);
                }

                // ✅ kalau level 1 → check semua child
                if (currentPage.level === 1) {
                    const children = pageData
                        .filter(p => p.parent_id === value)
                        .map(p => p.id);

                    updated = [...new Set([...updated, ...children])];
                }

                // ✅ kalau level 2 → check parent
                if (currentPage.level === 2) {
                    const parentId = currentPage.parent_id;
                    if (!updated.includes(parentId)) {
                        updated.push(parentId);
                    }
                }

            } else {
                // 🔥 kalau uncheck
                updated = updated.filter(id => id !== value);

                // ❌ kalau parent di-uncheck → uncheck semua child
                if (currentPage.level === 1) {
                    const children = pageData
                        .filter(p => p.parent_id === value)
                        .map(p => p.id);

                    updated = updated.filter(id => !children.includes(id));
                }

                if (currentPage.level === 2) {
                    const parentId = currentPage.parent;

                    const siblings = pageData
                        .filter(p => p.parent === parentId)
                        .map(p => p.id);

                    const stillChecked = siblings.some(id => updated.includes(id));

                    // kalau tidak ada child lain yang aktif → uncheck parent
                    if (!stillChecked) {
                        updated = updated.filter(id => id !== parentId);
                    }
                }
            }

            return updated;
        });
    };

    // 🔥 submit
    const handleSubmit = () => {
        if (!selectedUser) {
            alert("Pilih user dulu");
            return;
        }

        if (selectedPages.length === 0) {
            alert("Pilih minimal 1 page");
            return;
        }

        const payload = {
            id_user: selectedUser,
            id_page: selectedPages
        };

        axios.post(`${__API_URL__}/user_page/post_user_page`, payload)
            .then(res => {
                alert("Berhasil disimpan");

                // reset
                setSelectedUser("");
                setSelectedPages([]);
            })
            .catch(err => {
                console.error(err);
                alert("Gagal menyimpan");
            });
    };

    return (
        <div className="card m-5">

            {/* select user */}
            <div className="grid grid-cols-6 mb-3">
                <h2>Select User</h2>

                <select 
                    className="form-select col-span-5"
                    value={selectedUser}
                    onChange={handleUserChange}
                >
                    <option value="">Select User</option>
                    {userData.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.name} {user.last_name || ""}
                        </option>
                    ))}
                </select>
            </div>

            {/* checkbox page */}
            <div className="grid grid-cols-6 mb-4">
                <h2>Page</h2>

                <div className="col-span-5 space-y-2">
                    {pageData
                    .filter(page => page.level === 1)
                    .map(parent => (
                        <div key={parent.id}>
                            
                            {/* parent */}
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="form-checkbox"
                                    value={parent.id}
                                    checked={selectedPages.includes(parent.id)}
                                    onChange={handleCheckboxChange}
                                    disabled={!selectedUser}
                                />
                                <span className="font-semibold">
                                    {parent.page_label}
                                </span>
                            </label>

                            {/* children */}
                            {pageData
                                .filter(child => child.parent_id === parent.id)
                                .map(child => (
                                    <label
                                        key={child.id}
                                        className="flex items-center gap-2 pl-5"
                                    >
                                        <input
                                            type="checkbox"
                                            className="form-checkbox"
                                            value={child.id}
                                            checked={selectedPages.includes(child.id)}
                                            onChange={handleCheckboxChange}
                                            disabled={!selectedUser}
                                        />
                                        <span>{child.page_label}</span>
                                    </label>
                                ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* submit */}
            <div className="grid grid-cols-6">
                <h2></h2>
                <button 
                    onClick={handleSubmit}
                    className="w-fit btn bg-yellow-500 text-gray-800">
                    Save Changes
                </button>
            </div>

        </div>
    );
}

const root = ReactDOM.createRoot(
    document.getElementById("user_page_management")
);
root.render(<UserPageManagementCard />);