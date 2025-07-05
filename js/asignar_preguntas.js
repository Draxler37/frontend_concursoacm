$(function () {
    let allCategorias = [];
    let allPaises = [];
    let todosLosEquipos = [];
    let paginaActual = 1;
    const equiposPorPagina = 12;

    function poblarSelectCategorias(cb, selectedId) {
        const $select = $('#filtroCategoriaEquipo, #addCategoriaEquipo');
        $select.empty();
        $select.append('<option value="">Seleccione una categoría</option>');
        $.get('http://localhost:8080/equipos/categorias', function (data) {
            allCategorias = data;
            data.forEach(function (item) {
                $select.append(`<option value="${item.id}">${item.nombre}</option>`);
            });
            if (selectedId) $select.val(String(selectedId));
            if (typeof cb === 'function') cb();
        });
    }
    function poblarSelectPaises(cb, selectedId) {
        const $select = $('#filtroPaisEquipo, #addPaisEquipo');
        $select.empty();
        $select.append('<option value="">Seleccione un país</option>');
        $.get('http://localhost:8080/paises', function (data) {
            allPaises = data;
            data.forEach(function (item) {
                $select.append(`<option value="${item.idPais}">${item.nombrePais}</option>`);
            });
            if (selectedId) $select.val(String(selectedId));
            if (typeof cb === 'function') cb();
        });
    }

    // --- Renderizado de tarjetas de equipos ---
    function renderEquipos(equipos) {
        const container = document.getElementById('equiposContainer');
        container.className = 'teams-grid';
        container.innerHTML = '';
        if (equipos.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <i class="fas fa-search" style="font-size: 2rem; color: #6c757d; margin-bottom: 1rem;"></i>
                    <p>No se encontraron equipos que coincidan con los filtros</p>
                </div>
            `;
            return;
        }
        equipos.forEach((team, index) => {
            const hasAssignments = team.cantidadPreguntasAsignadas && team.cantidadPreguntasAsignadas > 0;
            let nombreCorto = team.nombreEquipo;
            if (nombreCorto.length > 18) {
                const partes = nombreCorto.split(' ');
                if (partes.length > 1) {
                    nombreCorto = partes[0].charAt(0) + '. ' + partes.slice(1).join(' ');
                } else {
                    nombreCorto = nombreCorto.slice(0, 15) + '...';
                }
            }
            const card = document.createElement('div');
            card.className = 'team-card scale-up-bottom-left';
            card.innerHTML = `
                <div class="card-header">
                    <span class="name-team" title="${team.nombreEquipo}">${nombreCorto}</span>
                    <span class="badge ${hasAssignments ? 'used' : 'available'}">
                        ${hasAssignments ? 'ASIGNADAS' : 'SIN ASIGNAR'}
                    </span>
                </div>
                <div class="card-body">
                    <div class="team-meta">
                        <span class="team-country">
                            <i class="fas fa-flag"></i> ${team.nombrePais}
                        </span>
                        <span class="team-category">${team.categoria?.nombreCategoria || team.nombreCategoria}</span>
                    </div>
                    <div class="team-actions">
                        <button class="btn btn-view" onclick="viewAssignedQuestions(${team.idEquipo}, '${team.nombreEquipo.replace(/'/g, '\'')}')" title="Ver preguntas asignadas">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        ${!hasAssignments ? `
                        <button class="btn btn-assign" data-id="${team.idEquipo}" title="Asignar preguntas">
                            <i class="fas fa-tasks"></i> Asignar
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // --- Modal de preguntas asignadas ---
    window.viewAssignedQuestions = function (teamId, teamName) {
        const modal = document.getElementById('questionsModal');
        document.getElementById('modalTeamName').textContent = teamName;
        const questionsList = document.getElementById('assignedQuestionsList');
        questionsList.innerHTML = '';
        const credentials = btoa('claudia:yocy2000');
        $.ajax({
            url: `http://localhost:8080/equipos-preguntas/equipo/${teamId}`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`
            },
            success: function (data) {
                if (data && data.preguntas && data.preguntas.length > 0) {
                    data.preguntas.forEach(q => {
                        const questionItem = document.createElement('div');
                        questionItem.className = 'question-item';
                        questionItem.innerHTML = `
                            <span class="question-id">#${q.idPregunta}</span>
                            <span class="question-text">${q.texto}</span>
                        `;
                        questionsList.appendChild(questionItem);
                    });
                } else {
                    questionsList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-question-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                            <p>No hay preguntas asignadas a este equipo</p>
                        </div>
                    `;
                }
                modal.style.display = 'flex';
            },
            error: function (xhr) {
                let msg = 'No se pudo cargar la información de las preguntas.';
                if (xhr.status === 401) {
                    msg = 'No autorizado. Debes iniciar sesión para ver las preguntas asignadas.';
                } else if (xhr.status === 403) {
                    msg = 'No autorizado. Solo puedes ver preguntas asignadas de tu equipo.';
                } else if (xhr.responseText) {
                    msg = xhr.responseText;
                }
                questionsList.innerHTML = `<div class="empty-state text-danger">${msg}</div>`;
                modal.style.display = 'flex';
            }
        });
    };

    // Cerrar modal al hacer click en la X o fuera del contenido
    $(document).on('click', '.close-modal', function () {
        $('#questionsModal').hide();
    });
    $(document).on('click', '#questionsModal', function (e) {
        if (e.target === this) {
            $(this).hide();
        }
    });

    // --- Paginación ---
    function renderPaginacionEquipos(total, pagina, porPagina) {
        const totalPaginas = Math.ceil(total / porPagina);
        const $wrapper = $('#paginacionEquiposWrapper');
        if (totalPaginas <= 1) {
            $wrapper.hide();
            return;
        }
        $wrapper.show();
        const inicio = (pagina - 1) * porPagina + 1;
        const fin = Math.min(pagina * porPagina, total);
        let navHtml = `
            <nav aria-label="Paginación">
                <ul class="pagination justify-content-center mb-0">
                    <li class="page-item${pagina === 1 ? ' disabled' : ''}">
                        <a class="page-link" href="#" data-page="prev" aria-label="Anterior">&laquo;</a>
                    </li>`;
        let start = Math.max(1, pagina - 2);
        let end = Math.min(totalPaginas, pagina + 2);
        if (pagina <= 3) end = Math.min(5, totalPaginas);
        if (pagina >= totalPaginas - 2) start = Math.max(1, totalPaginas - 4);
        if (start > 1) {
            navHtml += `
                <li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>
                ${start > 2 ? `<li class="page-item disabled"><span class="page-link">…</span></li>` : ''}
            `;
        }
        for (let i = start; i <= end; i++) {
            navHtml += `
                <li class="page-item${i === pagina ? ' active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        if (end < totalPaginas) {
            navHtml += `
                ${end < totalPaginas - 1 ? `<li class="page-item disabled"><span class="page-link">…</span></li>` : ''}
                <li class="page-item"><a class="page-link" href="#" data-page="${totalPaginas}">${totalPaginas}</a></li>
            `;
        }
        navHtml += `
                <li class="page-item${pagina === totalPaginas ? ' disabled' : ''}">
                    <a class="page-link" href="#" data-page="next" aria-label="Siguiente">&raquo;</a>
                </li>
                </ul>
            </nav>
        `;
        $wrapper.html(`
            <div class="container-xl d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
                <div class="text-sm text-muted">
                    Mostrando <span class="fw-bold">${inicio}</span> a <span class="fw-bold">${fin}</span>
                    de <span class="fw-bold">${total}</span> resultados
                </div>
            ${navHtml}
            </div>
        `);
        $wrapper.find('.page-link').off('click').on('click', function (e) {
            e.preventDefault();
            const accion = $(this).data('page');
            let nueva = pagina;
            if (accion === 'prev') nueva = Math.max(1, pagina - 1);
            else if (accion === 'next') nueva = Math.min(totalPaginas, pagina + 1);
            else nueva = parseInt(accion, 10);
            if (nueva !== pagina) {
                paginaActual = nueva;
                renderEquiposPaginados(todosLosEquiposFiltrados());
            }
        });
    }

    // --- Contadores de equipos ---
    function animateCounter(element, start, end, duration) {
        const range = end - start;
        let startTime = null;
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const value = Math.floor(progress * range + start);
            element.textContent = value;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = end;
            }
        }
        requestAnimationFrame(step);
    }

    // --- Contadores de equipos desde backend ---
    function cargarContadoresEquipos() {
        $.get('http://localhost:8080/equipos-preguntas/contadores', function (data) {
            animateCounter(document.getElementById('totalEquipos'), 0, data.total, 600);
            animateCounter(document.getElementById('equiposConPreguntas'), 0, data.conPreguntas, 600);
            animateCounter(document.getElementById('equiposSinPreguntas'), 0, data.sinPreguntas, 600);
        });
    }

    function renderEquiposPaginados(equipos) {
        const inicio = (paginaActual - 1) * equiposPorPagina;
        const fin = inicio + equiposPorPagina;
        renderEquipos(equipos.slice(inicio, fin));
        renderPaginacionEquipos(equipos.length, paginaActual, equiposPorPagina);
    }

    // --- MODAL DE ERROR/ADVERTENCIA CENTRAL ---
    function mostrarModalErrorAsignar(msg, tipo = 'error', callbackConfirm, opciones = {}) {
        const $modal = $('#modalErrorAsignar');
        const $msg = $('#modalErrorAsignarMsg');
        const $h4 = $modal.find('h4');
        const $icon = $h4.find('i');
        const $span = $h4.find('span');
        const $btnCancelar = $modal.find('#btnCancelarAsignar');
        const $btnConfirmar = $modal.find('#btnConfirmarAsignar');

        $modal.find('.modal-dialog').css({ minWidth: '340px', maxWidth: '95vw' });
        if (tipo === 'advertencia' && typeof callbackConfirm === 'function') {
            $msg.html(msg);
            $h4.removeClass('text-danger').addClass('text-warning');
            $icon.removeClass().addClass('fa fa-exclamation-triangle text-warning');
            $span.text('Advertencia');
            $btnCancelar.show();
            // Cambiar texto e icono según opciones
            if (opciones.soloUnEquipo) {
                $btnConfirmar
                    .removeClass('btn-danger').addClass('btn-primary')
                    .show()
                    .html('<i class="fa fa-user-check me-2"></i>Asignar')
                    .off('click').on('click', function () {
                        cerrarModalAsignar();
                        callbackConfirm();
                    });
            } else {
                $btnConfirmar
                    .removeClass('btn-danger').addClass('btn-primary')
                    .show()
                    .html('<i class="fa fa-users me-2"></i>Asignar a todos')
                    .off('click').on('click', function () {
                        cerrarModalAsignar();
                        callbackConfirm();
                    });
            }
            $modal.removeClass('d-none');
            $('body').addClass('modal-open');
            $modal.find('.modal-dialog').addClass('blur-in').removeClass('blur-out');
            setTimeout(() => {
                $modal.find('.modal-dialog').removeClass('blur-in');
            }, 200);
        } else {
            cerrarModalAsignar();
            mostrarToastError(msg);
        }
    }
    function cerrarModalAsignar() {
        const $modal = $('#modalErrorAsignar');
        $modal.find('.modal-dialog').removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $modal.addClass('d-none');
            $('body').removeClass('modal-open');
            $modal.find('.modal-dialog').removeClass('blur-out');
        }, 400);
    }
    $(document).on('click', '#btnCancelarAsignar, #modalErrorAsignar .close-modal, #modalErrorAsignar .modal-backdrop', cerrarModalAsignar);
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && !$('#modalErrorAsignar').hasClass('d-none')) {
            cerrarModalAsignar();
        }
    });

    // --- TOAST DE ERROR (igual que participantes.js) ---
    if (!document.getElementById('errorToast')) {
        const toastHtml = `\
        <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 2000;">
            <div id="errorToast" class="toast align-items-center text-bg-danger border-0" role="alert"
                aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        Error de conexión con el servidor. Por favor, inténtalo nuevamente.
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
                        aria-label="Cerrar"></button>
                </div>
            </div>
        </div>`;
        $(document.body).append(toastHtml);
    }
    function mostrarToastError(msg) {
        const toastEl = document.getElementById('errorToast');
        if (toastEl) {
            toastEl.querySelector('.toast-body').textContent = msg || 'Error de conexión con el servidor. Por favor, inténtalo nuevamente.';
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }
    }

    // --- Buscar equipos ---
    window.buscarEquipos = function () {
        const nombre = $('#filtroNombreEquipo').val().trim();
        const idCategoria = $('#filtroCategoriaEquipo').val();
        const idPais = $('#filtroPaisEquipo').val();
        const asignado = getAsignadoFiltro();
        let url = 'http://localhost:8080/equipos-preguntas/buscar-equipos-asignacion?';
        if (nombre) url += `nombre=${encodeURIComponent(nombre)}&`;
        if (idCategoria) url += `idCategoria=${idCategoria}&`;
        if (idPais) url += `idPais=${idPais}&`;
        if (asignado !== null) url += `asignado=${asignado}&`;
        url = url.replace(/&$/, '');
        $.get(url, function (data) {
            todosLosEquipos = data;
            paginaActual = 1;
            renderEquiposPaginados(todosLosEquipos);
        }).fail(function (xhr, status, error) {
            $('#equiposContainer').html('<div class="col-12 text-center text-danger">No se pudo cargar la lista de equipos.</div>');
            mostrarToastError('Error de conexión con el servidor. Por favor, inténtalo nuevamente.');
        });
    }

    function getAsignadoFiltro() {
        const val = $('#filtroAsignado').val();
        if (val === 'true') return true;
        if (val === 'false') return false;
        return null;
    }

    // Mostrar/ocultar filtros avanzados
    let filtrosVisibles = false;
    $('#toggleFiltrosEquiposBtn').on('click', function () {
        filtrosVisibles = !filtrosVisibles;
        const $panel = $('#filtrosAvanzadosEquipos');
        if (filtrosVisibles) {
            $panel.addClass('show');
            $(this).addClass('active');
        } else {
            $panel.removeClass('show');
            $(this).removeClass('active');
        }
    });

    // --- Filtros y búsqueda ---
    function todosLosEquiposFiltrados() {
        let equipos = todosLosEquipos;
        const texto = $('#filtroNombreEquipo').val()?.trim().toLowerCase() || '';
        const filtroAsignacion = $('#filtroAsignacionPreguntas').val();
        if (texto) {
            equipos = equipos.filter(e => e.nombreEquipo.toLowerCase().includes(texto) || (e.pais?.nombre || '').toLowerCase().includes(texto));
        }
        if (filtroAsignacion === 'con') {
            equipos = equipos.filter(e => e.preguntasAsignadas && e.preguntasAsignadas.length > 0);
        } else if (filtroAsignacion === 'sin') {
            equipos = equipos.filter(e => !e.preguntasAsignadas || e.preguntasAsignadas.length === 0);
        }
        return equipos;
    }

    // Cambiado el selector aquí para que funcione el input de búsqueda
    $('#filtroNombreEquipo').on('input', function () {
        paginaActual = 1;
        renderEquiposPaginados(todosLosEquiposFiltrados());
    });
    $('#filtroAsignacionPreguntas').on('change', function () {
        paginaActual = 1;
        renderEquiposPaginados(todosLosEquiposFiltrados());
    });
    $('#filtroCategoriaEquipo, #filtroPaisEquipo, #filtroAsignado').on('change', function () {
        paginaActual = 1;
        buscarEquipos();
    });

    // --- Asignar preguntas a un equipo ---
    $(document).off('click', '.btn-assign').on('click', '.btn-assign', function () {
        const $btn = $(this);
        const idEquipo = $btn.data('id');
        if (!idEquipo) return;
        mostrarModalErrorAsignar('¿Desea asignar preguntas a este equipo?', 'advertencia', function () {
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Asignando...');
            $.ajax({
                url: `http://localhost:8080/equipos-preguntas/asignar/${idEquipo}`,
                method: 'POST',
                success: function () {
                    $btn.removeClass('btn-assign').addClass('btn-success').html('<i class="fas fa-check"></i> Asignado');
                    setTimeout(() => buscarEquipos(), 900);
                },
                error: function (xhr) {
                    $btn.prop('disabled', false)
                        .removeClass('btn-success btn-danger')
                        .addClass('btn-assign btn-primary')
                        .html('<i class="fas fa-tasks"></i> Asignar');
                    mostrarToastError(xhr.responseText || 'No se pudo asignar preguntas.');
                }
            });
        }, { soloUnEquipo: true });
    });

    // --- Asignar a todos ---
    $('#btnAsignarTodos').off('click').on('click', function () {
        const $btn = $(this);
        if ($btn.prop('disabled')) return;
        mostrarModalErrorAsignar('¿Estás seguro de asignar preguntas a todos los equipos sin asignación previa?', 'advertencia', function () {
            $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Asignando...');
            $.ajax({
                url: 'http://localhost:8080/equipos-preguntas/asignar-todos',
                method: 'POST',
                success: function () {
                    $btn.removeClass('btn-primary').addClass('btn-success').html('<i class="fas fa-check"></i> ¡Completado!');
                    setTimeout(() => {
                        $btn.prop('disabled', false).removeClass('btn-success').addClass('btn-primary').html('<i class="fa fa-plus me-2"></i>Asignar a todos');
                        buscarEquipos();
                    }, 1200);
                },
                error: function (xhr) {
                    $btn.prop('disabled', false)
                        .removeClass('btn-success btn-danger')
                        .addClass('btn-primary')
                        .html('<i class="fa fa-plus me-2"></i>Asignar a todos');
                    mostrarToastError(xhr.responseText || 'No se pudo asignar preguntas a todos.');
                }
            });
        });
    });

    // --- Modal cerrar ---
    $('#modalPreguntasEquipo').on('hidden.bs.modal', function () {
        $('#listaPreguntasAsignadas').empty();
    });

    // Inicializar selects y cargar equipos
    poblarSelectCategorias();
    poblarSelectPaises();
    buscarEquipos();
    cargarContadoresEquipos();

    if (!document.getElementById('errorToast')) {
        const toastHtml = `\
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div id="errorToast" class="toast align-items-center text-bg-danger border-0" role="alert"
                aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        Error de conexión con el servidor. Por favor, inténtalo nuevamente.
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
                        aria-label="Cerrar"></button>
                </div>
            </div>
        </div>`;
        $(document.body).append(toastHtml);
    }

    function mostrarToastError(msg) {
        const toastEl = document.getElementById('errorToast');
        if (toastEl) {
            toastEl.querySelector('.toast-body').textContent = msg || 'Error de conexión con el servidor. Por favor, inténtalo nuevamente.';
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }
    }
});
