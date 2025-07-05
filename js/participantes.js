function renderParticipantes(participantes) {
    const container = document.getElementById('participantesContainer');
    container.innerHTML = '';
    if (participantes.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">No se encontraron participantes.</div>';
        document.body.classList.remove('animating-participantes');
        return;
    }
    // Oculta scroll durante la animación
    document.body.classList.add('animating-participantes');
    let animCount = participantes.length;
    participantes.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'col-12 col-sm-6 col-lg-4 d-flex';
        card.innerHTML = `
            <div class="card participante-card h-100 animate__animated animate__fadeInUp" style="animation-delay:${idx * 60}ms; position:relative;">
                <div class="card-body d-flex flex-column h-100 p-3">
                    <div class="d-flex flex-row h-100 align-items-start">
                        <div class="perfil-fija me-3 flex-shrink-0 d-flex align-items-start justify-content-start" style="min-width:72px;max-width:72px;">
                            <img src="../static/images/perfil_participante_defecto.svg" class="rounded-circle perfil-img" alt="Perfil" width="64" height="64">
                        </div>
                        <div class="datos-participante flex-grow-1 d-flex flex-column justify-content-between h-100">
                            <div class="d-flex justify-content-between align-items-start">
                                <h5 class="card-title mb-1 text-break" style="word-break:break-word;max-width:calc(100% - 80px);">${p.nombre}</h5>
                                <span class="ms-2 mt-1"><i class="fa-solid fa-flag"></i> ${p.nombrePais || ''}</span>
                            </div>
                            <div class="flex-grow-1">
                                <p class="mb-1"><strong>Sexo:</strong> ${p.sexo === 'M' ? 'Masculino' : (p.sexo === 'F' ? 'Femenino' : p.sexo)}</p>
                                <p class="mb-1"><strong>Edad:</strong> ${p.edad}</p>
                            </div>
                            <div>
                                <p class="mb-0 text-break" style="word-break:break-word;"><strong>Equipo:</strong> ${p.nombreEquipo || '-'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="participante-actions position-absolute end-0 bottom-0 p-2 d-flex gap-2">
                        <button class="btn btn-sm btn-light border shadow-sm btn-editar-participante" title="Editar" data-id="${p.idParticipante}"><i class="fa fa-pen"></i></button>
                        <button class="btn btn-sm btn-light border shadow-sm btn-eliminar-participante" title="Eliminar" data-id="${p.idParticipante}"><i class="fa fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
        // Detectar fin de animación en la última tarjeta
        card.querySelector('.participante-card').addEventListener('animationend', function () {
            animCount--;
            if (animCount === 0) {
                document.body.classList.remove('animating-participantes');
            }
        }, { once: true });
        container.appendChild(card);
    });
}

$(function () {
    let allPaises = [];
    let allEquipos = [];
    let allRegiones = [];

    function poblarSelectPaises(regionId) {
        const $select = $('#filtroPais');
        $select.empty();
        $select.append('<option value="">Seleccione un país</option>');
        if (regionId) {
            $.get(`http://localhost:8080/paises?regionId=${regionId}`, function (data) {
                data.forEach(function (item) {
                    $select.append(`<option value="${item.idPais}">${item.nombrePais}</option>`);
                });
            });
        } else {
            $select.append('<option disabled>Seleccione una región</option>');
        }
    }
    function poblarSelectEquipos(regionId, paisId) {
        const $select = $('#filtroEquipo');
        $select.empty();
        $select.append('<option value="">Seleccione un equipo</option>');
        if (paisId) {
            $.get(`http://localhost:8080/equipos?paisId=${paisId}`, function (data) {
                data.forEach(function (item) {
                    $select.append(`<option value="${item.idEquipo}">${item.nombreEquipo}</option>`);
                });
            });
        } else {
            $select.append('<option disabled>Seleccione un país</option>');
        }
    }
    function poblarSelectRegiones() {
        const $select = $('#filtroRegion');
        $select.empty();
        $select.append('<option value="">Seleccione una región</option>');
        allRegiones.forEach(function (item) {
            $select.append(`<option value="${item.idRegion}">${item.nombreRegion}</option>`);
        });
    }
    // Cargar todos los datos base una sola vez
    $.get('http://localhost:8080/paises', function (data) {
        allPaises = data;
        poblarSelectPaises();
    });
    $.get('http://localhost:8080/equipos', function (data) {
        allEquipos = data;
        poblarSelectEquipos();
    });
    $.get('http://localhost:8080/regiones', function (data) {
        allRegiones = data;
        poblarSelectRegiones();
    });

    let paginaActual = 1;
    const participantesPorPagina = 12;
    let todosLosParticipantes = [];

    function renderPaginacionBootstrap(total, pagina, porPagina) {
        const totalPaginas = Math.ceil(total / porPagina);
        const $wrapper = $('#paginacionWrapper');

        // Si sólo cabe en una página o no hay resultados, lo ocultamos y salimos
        if (totalPaginas <= 1) {
            $wrapper.hide();
            return;
        }

        // Si hay más de una página, lo mostramos
        $wrapper.show();

        const inicio = (pagina - 1) * porPagina + 1;
        const fin = Math.min(pagina * porPagina, total);

        // Construcción del <nav> con la lista de páginas
        let navHtml = `
            <nav aria-label="Paginación">
                <ul class="pagination justify-content-center mb-0">
                    <li class="page-item${pagina === 1 ? ' disabled' : ''}">
                        <a class="page-link" href="#" data-page="prev" aria-label="Anterior">&laquo;</a>
                    </li>`;

        // Lógica para mostrar “…” y páginas numéricas
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

        // Inyectamos todo dentro del footer, con container para alinear el contenido
        $wrapper.html(`
            <div class="container-xl d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
                <div class="text-sm text-muted">
                    Mostrando <span class="fw-bold">${inicio}</span> a <span class="fw-bold">${fin}</span>
                    de <span class="fw-bold">${total}</span> resultados
                </div>
            ${navHtml}
            </div>
        `);

        // Evento para manejar clicks en los enlaces de paginación
        $wrapper.find('.page-link').off('click').on('click', function (e) {
            e.preventDefault();
            const accion = $(this).data('page');
            let nueva = pagina;
            if (accion === 'prev') nueva = Math.max(1, pagina - 1);
            else if (accion === 'next') nueva = Math.min(totalPaginas, pagina + 1);
            else nueva = parseInt(accion, 10);

            if (nueva !== pagina) {
                paginaActual = nueva;
                renderParticipantesPaginados(todosLosParticipantes);
            }
        });
    }



    function renderParticipantesPaginados(participantes) {
        const inicio = (paginaActual - 1) * participantesPorPagina;
        const fin = inicio + participantesPorPagina;
        renderParticipantes(participantes.slice(inicio, fin));
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'JEFE_DELEGACION' && window.handleDelegationChief) {
            window.handleDelegationChief();
        }
        else if (userRole === 'PARTICIPANTE' && window.handleParticipant) {
            window.handleParticipant();
        }
        renderPaginacionBootstrap(participantes.length, paginaActual, participantesPorPagina);
    }

    // Toast de error (agregar al final del body si no existe)
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

    function mostrarToastError() {
        const toastEl = document.getElementById('errorToast');
        if (toastEl) {
            const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
            toast.show();
        }
    }

    // --- FUNCIÓN GLOBAL ---
    window.buscarParticipantes = function () {
        const nombre = $('#filtroNombre').val().trim();
        const idPais = $('#filtroPais').val();
        const idEquipo = $('#filtroEquipo').val();
        const idRegion = $('#filtroRegion').val();
        let url = 'http://localhost:8080/participantes/buscar?';
        if (nombre) url += `nombre=${encodeURIComponent(nombre)}&`;
        if (idPais) url += `idPais=${idPais}&`;
        if (idEquipo) url += `idEquipo=${idEquipo}&`;
        if (idRegion) url += `idRegion=${idRegion}&`;
        url = url.replace(/&$/, '');
        $.get(url, function (data) {
            todosLosParticipantes = data;
            paginaActual = 1;
            renderParticipantesPaginados(todosLosParticipantes);
        }).fail(function (xhr, status, error) {
            console.error('Error al buscar participantes:', error);
            $('#participantesContainer').html('<div class="col-12 text-center text-danger">No se pudo cargar la lista de participantes.</div>');
            mostrarToastError();
        });
    }

    // Búsqueda live: al cambiar el input filtra inmediatamente
    $('#filtroNombre').on('input', function () {
        buscarParticipantes();
    });

    // Al cambiar cualquier filtro
    $('#filtroRegion').on('change', function () {
        const idRegion = $(this).val();
        poblarSelectPaises(idRegion);
        $('#filtroEquipo').empty().append('<option value="">Seleccione un equipo</option>');
        buscarParticipantes();
    });
    $('#filtroPais').on('change', function () {
        const idPais = $(this).val();
        poblarSelectEquipos(null, idPais);
        buscarParticipantes();
    });
    $('#filtroEquipo').on('change', function () {
        buscarParticipantes();
    });

    // Mostrar/ocultar filtros avanzados con animación y cambio de icono
    let filtrosVisibles = false;
    let filtroBtnActivo = false;
    $('#toggleFiltrosBtn').on('mousedown', function (e) {
        e.preventDefault(); // Evita perder el foco al hacer click
        filtroBtnActivo = !filtroBtnActivo;
        if (filtroBtnActivo) {
            $(this).addClass('active').focus();
        } else {
            $(this).removeClass('active').blur();
        }
    });
    $('#toggleFiltrosBtn').on('blur', function () {
        if (!filtroBtnActivo) {
            $(this).removeClass('active');
        }
    });
    $('#toggleFiltrosBtn').on('keypress', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            filtroBtnActivo = !filtroBtnActivo;
            if (filtroBtnActivo) {
                $(this).addClass('active').focus();
            } else {
                $(this).removeClass('active').blur();
            }
        }
    });
    $('#toggleFiltrosBtn').on('click keypress', function (e) {
        if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') {
            filtrosVisibles = !filtrosVisibles;
            const $panel = $('#filtrosAvanzados');
            const $btn = $(this);
            const $selects = $('#filtroEquipo, #filtroPais, #filtroRegion');
            if (filtrosVisibles) {
                $panel.addClass('show');
                $btn.addClass('active');
                $selects.prop('disabled', false); // Habilita selects
            } else {
                $panel.removeClass('show');
                $btn.removeClass('active');
                $selects.prop('disabled', true); // Deshabilita selects
            }
        }
    });
    // Al cargar la página, asegura el estado correcto de los selects según visibilidad
    $(function () {
        const $panel = $('#filtrosAvanzados');
        const $selects = $('#filtroEquipo, #filtroPais, #filtroRegion');
        if (!$panel.hasClass('show')) {
            $selects.prop('disabled', true);
        } else {
            $selects.prop('disabled', false);
        }
    });

    // Cargar todos los participantes al inicio
    buscarParticipantes();
});

// --- MODAL AÑADIR PARTICIPANTE ---
$(document).ready(function () {
    // Botón para abrir modal (añadir)
    $('#btnAddParticipante').on('click', function () {
        // Cambia el texto y botón ANTES de mostrar el modal
        $('#modalAddParticipante h2').text('Añadir Participante');
        $('#formAddParticipante button[type="submit"]').html('<i class="fa fa-floppy-disk me-2"></i>Guardar');
        $('#formAddParticipante').removeData('edit-id');
        $('#modalAddParticipante').removeClass('d-none');
        $('body').addClass('modal-open');
        const $dialog = $('#modalAddParticipante .modal-dialog');
        $dialog.removeClass('blur-out').addClass('blur-in');
        setTimeout(() => {
            $dialog.removeClass('blur-in');
        }, 200);
        cargarPaisesModal();
    });
    // Botón cancelar o click fuera del modal
    $('#btnCancelarAddParticipante, #modalAddParticipante .modal-backdrop').on('click', function () {
        cerrarModalParticipante();
    });
    // Cerrar modal with Escape
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && !$('#modalAddParticipante').hasClass('d-none')) {
            cerrarModalParticipante();
        }
    });
    // Acciones de editar participante
    $(document).on('click', '.btn-editar-participante', function () {
        const id = $(this).data('id');
        // Obtener datos del participante
        $.get(`http://localhost:8080/participantes/${id}`, function (p) {
            // Rellenar el formulario con los datos
            $('#addNombre').val(p.nombre);
            $('#addNumCarnet').val(p.numCarnet);
            $('#addEdad').val(p.edad);
            $('#addSexo').val(p.sexo);
            cargarPaisesModal(function () {
                setTimeout(function () {
                    if (p.pais && typeof p.pais.idPais !== 'undefined') {
                        $('#addPais').val(String(p.pais.idPais)).trigger('change');
                    } else if (p.nombrePais) {
                        let found = false;
                        $('#addPais option').each(function () {
                            if ($(this).text().trim() === p.nombrePais.trim()) {
                                $('#addPais').val($(this).val()).trigger('change');
                                found = true;
                                return false;
                            }
                        });
                        if (!found) {
                            console.warn('No se encontró el país por nombre:', p.nombrePais);
                        }
                    }
                }, 0);
            });
            // Cambia el texto y botón ANTES de mostrar el modal
            $('#formAddParticipante').data('edit-id', id);
            $('#modalAddParticipante h2').text('Editar Participante');
            $('#formAddParticipante button[type="submit"]').html('<i class="fa fa-floppy-disk me-2"></i>Guardar Cambios');
            // Mostrar modal
            $('#modalAddParticipante').removeClass('d-none');
            $('body').addClass('modal-open');
            const $dialog = $('#modalAddParticipante .modal-dialog');
            $dialog.removeClass('blur-out').addClass('blur-in');
            setTimeout(() => {
                $dialog.removeClass('blur-in');
            }, 200);
        });
    });
    // Eliminar participante con modal
    let participanteAEliminar = null;
    $(document).on('click', '.btn-eliminar-participante', function () {
        participanteAEliminar = $(this).data('id');
        $('#modalEliminarParticipante').removeClass('d-none');
        $('body').addClass('modal-eliminar-open');
        const $dialog = $('#modalEliminarParticipante .modal-dialog');
        $dialog.removeClass('blur-out').addClass('blur-in');
        setTimeout(() => {
            $dialog.removeClass('blur-in');
        }, 200);
    });
    // Confirmar eliminación
    $('#btnConfirmarEliminarParticipante').on('click', function () {
        if (!participanteAEliminar) return;
        const id = participanteAEliminar;
        $('#btnConfirmarEliminarParticipante').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Eliminando...');
        $.ajax({
            url: `http://localhost:8080/participantes/${id}`,
            method: 'DELETE',
            success: function () {
                cerrarModalEliminarParticipante();
                setTimeout(() => {
                    buscarParticipantes();
                }, 400);
            },
            error: function (xhr) {
                // Mostrar error en el modal, no alert
                $('#modalEliminarParticipante .add-error-msg').remove();
                const $modalContent = $('#modalEliminarParticipante .modal-content');
                const $dFlex = $modalContent.find('.d-flex:has(button[id="btnConfirmarEliminarParticipante"])').first();
                let msg = 'Error al eliminar el participante: ' + (xhr.responseJSON?.message || xhr.statusText);
                if ($dFlex.length) {
                    $dFlex.before('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                } else {
                    $modalContent.prepend('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                }
                $('#btnConfirmarEliminarParticipante').prop('disabled', false).html('<i class="fa fa-trash me-2"></i>Eliminar');
            }
        });
    });
    // Cancelar eliminación
    $('#btnCancelarEliminarParticipante').on('click', function () {
        cerrarModalEliminarParticipante();
    });
    function cerrarModalEliminarParticipante(cb) {
        const $dialog = $('#modalEliminarParticipante .modal-dialog');
        $dialog.removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $('#modalEliminarParticipante').addClass('d-none');
            $('body').removeClass('modal-eliminar-open');
            $dialog.removeClass('blur-out');
            if (cb) cb();
        }, 400);
    }
    // Modificar submit para actualizar si es edición
    $('#formAddParticipante').off('submit').on('submit', function (e) {
        e.preventDefault();
        const $btn = $('#formAddParticipante button[type="submit"]');
        const $errorMsg = $('#formAddParticipante .add-error-msg');
        $errorMsg.remove();
        $btn.prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...');
        const participante = {
            nombre: $('#addNombre').val().trim(),
            numCarnet: $('#addNumCarnet').val().trim(),
            edad: parseInt($('#addEdad').val(), 10),
            sexo: $('#addSexo').val(),
            pais: { idPais: parseInt($('#addPais').val(), 10) }
        };
        const editId = $(this).data('edit-id');
        let ajaxOpts = {
            url: 'http://localhost:8080/participantes',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(participante),
        };
        if (editId) {
            ajaxOpts.url = `http://localhost:8080/participantes/${editId}`;
            ajaxOpts.method = 'PUT';
        }
        ajaxOpts.success = function () {
            $btn.html('<span class="fa fa-check me-2" style="color:#fff;"></span>Guardado')
                .removeClass('btn-primary').addClass('btn-success');
            $btn.css({ transition: 'background 0.4s, color 0.4s' });
            setTimeout(() => {
                cerrarModalParticipante();
                // El reset visual del botón y del edit-id se hace después de cerrar el modal
                setTimeout(() => {
                    $btn.prop('disabled', false)
                        .removeClass('btn-success').addClass('btn-primary')
                        .html('<i class="fa fa-floppy-disk me-2"></i>' + (editId ? 'Guardar Cambios' : 'Guardar'));
                    $('#formAddParticipante').removeData('edit-id');
                    // Recargar la lista manteniendo los filtros actuales
                    buscarParticipantes();
                }, 400); // pequeño delay para asegurar que el modal ya está oculto
            }, 800); // 400ms para el check + 400ms para la animación de cierre
        };
        ajaxOpts.error = function (xhr) {
            let msg = 'Error al ' + (editId ? 'actualizar' : 'añadir') + ' participante: ' + (xhr.responseJSON?.message || xhr.statusText);
            // Elimina cualquier mensaje de error previo en todo el modal
            $('#formAddParticipante .add-error-msg').remove();
            // Busca el contenedor correcto para insertar el error
            const $modalContent = $('#modalAddParticipante .modal-content');
            // Busca el primer .d-flex que contenga el botón submit
            const $dFlex = $modalContent.find('.d-flex:has(button[type="submit"])').first();
            if ($dFlex.length) {
                $dFlex.before('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
            } else {
                $modalContent.prepend('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
            }
            $btn.prop('disabled', false)
                .removeClass('btn-success').addClass('btn-primary')
                .html('<i class="fa fa-floppy-disk me-2"></i>' + (editId ? 'Guardar Cambios' : 'Guardar'));
            if (xhr.status === 0) {
                mostrarToastError();
            }
        };
        $.ajax(ajaxOpts);
    });
    // Al cerrar modal, restaurar estado de formulario
    function cerrarModalParticipante() {
        const $dialog = $('#modalAddParticipante .modal-dialog');
        $dialog.removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $('#modalAddParticipante').addClass('d-none');
            $('body').removeClass('modal-open');
            $dialog.removeClass('blur-out');
            $('#formAddParticipante')[0].reset();
            $('#formAddParticipante').removeData('edit-id');
            // Ya NO cambiamos el texto aquí
        }, 400);
    }
    // Modificar cargarPaisesModal para callback
    function cargarPaisesModal(cb) {
        const $select = $('#addPais');
        $select.empty();
        $select.append('<option value="">Seleccione un país</option>');
        $.get('http://localhost:8080/paises', function (data) {
            data.forEach(function (item) {
                $select.append(`<option value="${item.idPais}">${item.nombrePais}</option>`);
            });
            if (typeof cb === 'function') cb();
        });
    }
});