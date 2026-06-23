const checkAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    // skip login page
    if (window.location.pathname === "/login.html") {
        return;
    }

    const id_user = localStorage.getItem("id_user");

    try {
        // ambil id page user
        const response = await axios.get(
            `${__API_URL__}/user_page/get_this_user_page`,
            {
                params: { user_id: id_user }
            }
        );

        const pageIds = response.data[0].map(Number);

        // ambil detail page
        const pageResponse = await axios.get(
            `${__API_URL__}/page/get_this_user_page_2`,
            {
                params: { id_page: pageIds.join(",") }
            }
        );

        const pages = pageResponse.data;

        // halaman sekarang
        const currentPage = window.location.pathname
            .replace("/", "")
            .replace(".html", "");

        // cek apakah user punya akses
        const hasAccess = pages.some(
            item => item.page_name === currentPage
        );

        // kalau tidak punya akses → redirect
        if (!hasAccess) {
            const defaultPage = pages.find(item => item.level === 2);

            if (defaultPage) {
                window.location.href =
                    "/" + defaultPage.page_name + ".html";
            }
        }

    } catch (err) {
        console.error("Gagal fetch:", err);
    }
};

checkAuth();