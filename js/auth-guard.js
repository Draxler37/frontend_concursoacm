(function () {
    const allowedPages = ['login.html', 'index.html', ''];
    const currentPage = window.location.pathname.split('/').pop();
    if (!allowedPages.includes(currentPage)) {
        if (localStorage.getItem('isAuthenticated') !== 'true') {
            window.location.href = 'login.html';
        }
    }
})();
