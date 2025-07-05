(function () {
    // Solo ejecuta si existe el botón de login
    const loginBtn = document.querySelector('.btn-login');
    if (!loginBtn) return;

    // Verifica autenticación
    if (localStorage.getItem('isAuthenticated') === 'true') {
        const userRole = localStorage.getItem('userRole');
        const isAdminOrChief = userRole === 'ADMINISTRADOR' || userRole === 'JEFE_DELEGACION';

        // Crea el botón circular con menú
        const userMenu = document.createElement('div');
        userMenu.className = 'dropdown';
        userMenu.innerHTML = `
            <button class="btn btn-user rounded-circle dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;padding:0;background:var(--primary-color);color:white;">
                <i class="fa fa-user"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                ${isAdminOrChief ? `
                    <li><a class="dropdown-item" href="gestionar_equipos.html"><i class="fa fa-users-cog me-2"></i> Gestionar equipos</a></li>
                    <li><hr class="dropdown-divider"></li>
                ` : ''}
                <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="fa fa-sign-out-alt me-2"></i> Cerrar sesión</a></li>
            </ul>
        `;
        loginBtn.parentNode.replaceChild(userMenu, loginBtn);

        // Logout handler
        document.getElementById('logoutBtn').addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('userRole');
            window.location.href = 'login.html';
        });
    }
})();
