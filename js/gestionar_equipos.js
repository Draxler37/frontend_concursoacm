$(document).ready(function () {
    checkAuth();
    // Variables globales
    let idPais = null;
    let equipos = [];
    let participantesEnEquipo = [];
    let participantesDisponibles = [];
    let equipoSeleccionado = null;

    // Función para obtener el token de autenticación
    function getAuthToken() {
        return localStorage.getItem('authToken');
    }

    // Función para verificar autenticación
    function checkAuth() {
        if (!localStorage.getItem('isAuthenticated')) {
            window.location.href = 'login.html';
        }
    }

    // Toast de error (similar al de participantes.js)
    if (!document.getElementById('errorToast')) {
        const toastHtml = `\
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div id="errorToast" class="toast align-items-center text-bg-danger border-0" role="alert"
                aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body" id="errorToastMessage">
                        Error de conexión con el servidor. Por favor, inténtalo nuevamente.
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
                        aria-label="Cerrar"></button>
                </div>
            </div>
        </div>`;
        $(document.body).append(toastHtml);
    }

    function mostrarError(mensaje) {
        const toastEl = document.getElementById('errorToast');
        const toastMessage = document.getElementById('errorToastMessage');
        if (toastEl && toastMessage) {
            toastMessage.textContent = mensaje;
            const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
            toast.show();
        } else {
            console.error(mensaje);
        }
    }

    // Obtener el idPais del jefe de delegación autenticado
    function obtenerIdPaisJefeDelegacion() {
        const username = localStorage.getItem('username');
        $.ajax({
            url: `http://localhost:8080/jefes-delegacion/pais?nombre=${username}`,
            method: 'GET',
            success: function (response) {
                idPais = response;
                cargarEquiposPorPais();
            },
            error: function () {
                mostrarError('No se pudo obtener la información del país');
            }
        });
    }

    // Cargar equipos por país
    function cargarEquiposPorPais() {
        $('#loading-equipos').show();
        $('#equipos-list').hide();
        $('#no-equipos').hide();

        $.ajax({
            url: `http://localhost:8080/equipos?paisId=${idPais}`,
            method: 'GET',
            success: function (response) {
                equipos = response;
                renderEquipos();
            },
            error: function () {
                mostrarError('Error al cargar los equipos');
            }
        });
    }

    // Renderizar la lista de equipos
    function renderEquipos() {
        const $equiposList = $('#equipos-list');
        $equiposList.empty();

        if (equipos.length === 0) {
            $('#loading-equipos').hide();
            $('#no-equipos').show();
            return;
        }

        equipos.forEach(equipo => {
            const $li = $('<li class="list-group-item">')
                .text(`${equipo.nombreEquipo} (${equipo.nombreCategoria})`)
                .data('id', equipo.idEquipo)
                .click(function () {
                    seleccionarEquipo(equipo);
                });

            $equiposList.append($li);
        });

        $('#loading-equipos').hide();
        $equiposList.show();
    }

    // Seleccionar un equipo
    function seleccionarEquipo(equipo) {
        equipoSeleccionado = equipo;
        $('#equipos-list li').removeClass('active');
        $(`#equipos-list li[data-id="${equipo.idEquipo}"]`).addClass('active');

        // Mostrar información del equipo seleccionado
        $('#nombre-equipo-seleccionado').text(equipo.nombreEquipo);
        $('#categoria-equipo-seleccionado').text(`Categoría: ${equipo.nombreCategoria}`);
        $('#equipo-seleccionado-info').show();
        $('#sin-equipo-seleccionado').hide();
        $('#contenido-gestion').show();

        // Cargar participantes del equipo
        cargarParticipantesEnEquipo();
        // Cargar participantes disponibles
        cargarParticipantesDisponibles();
    }

    // Cargar participantes que están en el equipo
    function cargarParticipantesEnEquipo() {
        $.ajax({
            url: `http://localhost:8080/participantes/buscar?idPais=${idPais}&idEquipo=${equipoSeleccionado.idEquipo}`,
            method: 'GET',
            success: function (response) {
                participantesEnEquipo = response;
                renderParticipantesEnEquipo();
            },
            error: function () {
                mostrarError('Error al cargar los participantes del equipo');
            }
        });
    }

    // Renderizar participantes en el equipo
    function renderParticipantesEnEquipo() {
        const $list = $('#participantes-equipo-list');
        $list.empty();

        if (participantesEnEquipo.length === 0) {
            $list.append('<li class="list-group-item text-muted">No hay participantes en este equipo</li>');
            return;
        }

        participantesEnEquipo.forEach(participante => {
            const $li = $(`
                <li class="list-group-item">
                    <div class="participant-info">
                        <div class="participant-name">${participante.nombre}</div>
                        <div class="participant-details">${participante.numCarnet} | ${participante.edad} años</div>
                    </div>
                    <button class="btn btn-action btn-remove" data-id="${participante.idParticipante}">
                        <i class="fas fa-user-minus"></i> Quitar
                    </button>
                </li>
            `);

            $li.find('.btn-remove').click(function () {
                quitarParticipanteDelEquipo(participante.idParticipante);
            });

            $list.append($li);
        });
    }

    // Cargar participantes disponibles (sin equipo)
    function cargarParticipantesDisponibles() {
        $.ajax({
            url: `http://localhost:8080/participantes/sin-equipo/pais/${idPais}`,
            method: 'GET',
            success: function (response) {
                participantesDisponibles = response;
                renderParticipantesDisponibles();
            },
            error: function () {
                mostrarError('Error al cargar los participantes disponibles');
            }
        });
    }

    // Renderizar participantes disponibles
    function renderParticipantesDisponibles() {
        const $list = $('#participantes-disponibles-list');
        $list.empty();

        if (participantesDisponibles.length === 0) {
            $list.append('<li class="list-group-item text-muted">No hay participantes disponibles</li>');
            return;
        }

        participantesDisponibles.forEach(participante => {
            const $li = $(`
                <li class="list-group-item">
                    <div class="participant-info">
                        <div class="participant-name">${participante.nombre}</div>
                        <div class="participant-details">${participante.numCarnet} | ${participante.edad} años</div>
                    </div>
                    <button class="btn btn-action btn-add" data-id="${participante.idParticipante}">
                        <i class="fas fa-user-plus"></i> Agregar
                    </button>
                </li>
            `);

            $li.find('.btn-add').click(function () {
                agregarParticipanteAlEquipo(participante.idParticipante);
            });

            $list.append($li);
        });
    }

    // Quitar participante del equipo
    function quitarParticipanteDelEquipo(idParticipante) {
        checkAuth();

        $.ajax({
            url: `http://localhost:8080/participantes/${idParticipante}/quitar-equipo/${equipoSeleccionado.idEquipo}`,
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${getAuthToken()}`
            },
            success: function () {
                cargarParticipantesEnEquipo();
                cargarParticipantesDisponibles();
            },
            error: function (xhr) {
                if (xhr.status === 401) {
                    mostrarError('No autorizado - Sesión expirada');
                    localStorage.clear();
                    window.location.href = 'login.html';
                } else {
                    const errorMsg = xhr.responseJSON?.message || xhr.responseText || 'Error al quitar al participante del equipo';
                    mostrarError(errorMsg);
                }
            }
        });
    }

    // Agregar participante al equipo
    function agregarParticipanteAlEquipo(idParticipante) {
        checkAuth();

        $.ajax({
            url: `http://localhost:8080/participantes/${idParticipante}/asignar-equipo/${equipoSeleccionado.idEquipo}`,
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${getAuthToken()}`
            },
            success: function () {
                cargarParticipantesEnEquipo();
                cargarParticipantesDisponibles();
            },
            error: function (xhr) {
                if (xhr.status === 401) {
                    mostrarError('No autorizado - Sesión expirada');
                    localStorage.clear();
                    window.location.href = 'login.html';
                } else {
                    const errorMsg = xhr.responseJSON?.message || xhr.responseText || 'Error al agregar al participante al equipo';
                    mostrarError(errorMsg);
                }
            }
        });
    }

    // Inicialización
    obtenerIdPaisJefeDelegacion();
});