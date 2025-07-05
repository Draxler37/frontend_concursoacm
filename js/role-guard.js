(function () {
    // Solo ejecuta si el usuario está autenticado
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) return;

    const userRole = localStorage.getItem('userRole');

    // Función para mostrar todos los elementos ocultables (para reinicializar)
    function showAllElements() {
        document.querySelectorAll('.btn-editar, .btn-eliminar, .btn-editar-equipo, .btn-eliminar-equipo, .btn-editar-participante, .btn-eliminar-participante, .btn-eliminar-jefe-delegacion, .btn-editar-pregunta, .btn-eliminar-pregunta').forEach(el => el.style.display = '');
        document.querySelectorAll('#btnAddEquipo, #btnAddParticipante, #btnAddJefeDelegacion, #btnAddPregunta').forEach(el => el.style.display = '');
        document.querySelectorAll('#btnAsignarTodos, #btnAsignarSolo').forEach(el => el.style.display = '');
        document.querySelectorAll('.nav-item').forEach(el => el.style.display = '');
        document.querySelectorAll('.btn-jefe-delegacion').forEach(el => el.style.display = '');
    }

    // Utilidad para forzar el ocultamiento aunque tengan !important
    function forceHideElement(el) {
        el.style.setProperty('display', 'none', 'important');
    }

    // Función para manejar los elementos que deben ocultarse para JEFE_DELEGACION
    function handleDelegationChief() {
        console.log('[role-guard] Ejecutando handleDelegationChief, DOM ready:', document.readyState);
        showAllElements(); // Primero muestra todo para limpiar estados anteriores

        // Oculta botones de añadir y eliminar en todas las páginas
        document.querySelectorAll('#btnAddEquipo, #btnAddParticipante, #btnAddJefeDelegacion, #btnAddPregunta').forEach(forceHideElement);
        document.querySelectorAll('.btn-eliminar, .btn-eliminar-equipo, .btn-eliminar-participante, .btn-eliminar-jefe-delegacion, .btn-editar, .btn-editar-equipo, .btn-editar-participante, .btn-editar-pregunta').forEach(el => el.style.display = 'none');

        // Oculta botones de asignar (común a ambos roles)
        document.querySelectorAll('#btnAsignarTodos, #btnAsignarSolo').forEach(forceHideElement);

        // Oculta elementos del menú específicos para JEFE_DELEGACION
        const menuItemsToHide = [
            'preguntas.html',
            'respuestas.html',
            'regiones.html',
            'responder_preguntas.html'
        ];

        // Buscar todos los elementos li que contengan enlaces a las páginas a ocultar
        document.querySelectorAll('.nav-item').forEach(li => {
            const link = li.querySelector('a[href]');
            if (link) {
                const href = link.getAttribute('href');
                if (menuItemsToHide.some(item => href.includes(item))) {
                    li.style.display = 'none';
                    console.log('[role-guard] Ocultando <li> para', href);
                }
            }
        });

        // Oculta botones específicos
        document.querySelectorAll('.btn-jefe-delegacion').forEach(el => el.style.display = 'none');
    }
    window.handleDelegationChief = handleDelegationChief; // Exporta la función

    // Función para manejar los elementos que deben ocultarse para PARTICIPANTE
    function handleParticipant() {
        showAllElements(); // Primero muestra todo para limpiar estados anteriores

        // Oculta botones de añadir y eliminar en todas las páginas
        document.querySelectorAll('#btnAddEquipo, #btnAddParticipante, #btnAddJefeDelegacion, #btnAddPregunta').forEach(forceHideElement);
        document.querySelectorAll('.btn-eliminar, .btn-eliminar-equipo, .btn-eliminar-participante, .btn-eliminar-jefe-delegacion, .btn-editar, .btn-editar-equipo, .btn-editar-participante, .btn-editar-pregunta').forEach(el => el.style.display = 'none');

        // Oculta elementos del menú específicos para PARTICIPANTE
        const menuItemsToHide = [
            'preguntas.html',
            'respuestas.html',
            'regiones.html',
            'asignar_preguntas.html'
        ];

        document.querySelectorAll('.nav-item').forEach(li => {
            const link = li.querySelector('a[href]');
            if (link) {
                const href = link.getAttribute('href');
                if (menuItemsToHide.some(item => href.includes(item))) {
                    li.style.display = 'none';
                }
            }
        });

        // Oculta cualquier botón de asignar (común a ambos roles)
        document.querySelectorAll('#btnAsignarTodos, #btnAsignarSolo').forEach(forceHideElement);
    }
    window.handleParticipant = handleParticipant; // Exporta la función

    // Ejecuta la función correcta al cargar el DOM
    if (userRole === 'JEFE_DELEGACION') {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            handleDelegationChief();
        } else {
            document.addEventListener('DOMContentLoaded', handleDelegationChief);
        }
    }
    if (userRole === 'PARTICIPANTE') {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            handleParticipant();
        } else {
            document.addEventListener('DOMContentLoaded', handleParticipant);
        }
    }
    if (userRole === 'ADMINISTRADOR') {
        // Si es ADMINISTRADOR, no oculta nada
        showAllElements();
    }
})();