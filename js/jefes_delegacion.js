function renderJefesDelegacion(jefes) {
    const container = document.getElementById('jefesDelegacionContainer');
    container.innerHTML = '';
    if (jefes.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">No se encontraron jefes de delegación.</div>';
        document.body.classList.remove('animating-jefesdelegacion');
        return;
    }
    // Oculta scroll durante la animación
    document.body.classList.add('animating-jefesdelegacion');
    let animCount = jefes.length;
    jefes.forEach((j, idx) => {
        const card = document.createElement('div');
        card.className = 'col-12 col-sm-6 col-lg-4 d-flex';
        card.innerHTML = `
            <div class="card jefe-delegacion-card h-100 animate__animated animate__fadeInUp" style="animation-delay:${idx * 60}ms; position:relative;">
                <div class="card-body d-flex flex-column h-100 p-3">
                    <div class="d-flex flex-row h-100 align-items-start">
                        <div class="perfil-fija me-3 flex-shrink-0 d-flex align-items-start justify-content-start" style="min-width:72px;max-width:72px;">
                            <img src="../static/images/perfil_participante_defecto.svg" class="rounded-circle perfil-img" alt="Perfil" width="64" height="64">
                        </div>
                        <div class="datos-jefe-delegacion flex-grow-1 d-flex flex-column justify-content-between h-100">
                            <div class="d-flex justify-content-between align-items-start">
                                <h5 class="card-title mb-1 text-break" style="word-break:break-word;max-width:calc(100% - 80px);">${j.nombreParticipante}</h5>
                                <span class="ms-2 mt-1"><i class="fa-solid fa-flag"></i> ${j.nombrePais || ''}</span>
                            </div>
                            <div class="flex-grow-1">
                                <p class="mb-1"><strong>Región:</strong> ${j.nombreRegion || '-'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="jefe-delegacion-actions position-absolute end-0 bottom-0 p-2 d-flex gap-2">
                        <button class="btn btn-sm btn-light border shadow-sm btn-eliminar-jefe-delegacion" title="Eliminar" data-id="${j.idJefe}"><i class="fa fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
        // Detectar fin de animación en la última tarjeta
        card.querySelector('.jefe-delegacion-card').addEventListener('animationend', function () {
            animCount--;
            if (animCount === 0) {
                document.body.classList.remove('animating-jefesdelegacion');
            }
        }, { once: true });
        container.appendChild(card);
    });
}

$(function () {
    let allPaises = [];
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
    $.get('http://localhost:8080/regiones', function (data) {
        allRegiones = data;
        poblarSelectRegiones();
    });

    let paginaActual = 1;
    const jefesPorPagina = 12;
    let todosLosJefes = [];

    function renderPaginacionBootstrap(total, pagina, porPagina) {
        const totalPaginas = Math.ceil(total / porPagina);
        const $wrapper = $('#paginacionWrapper');

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

        // Evento para manejar clicks en los enlaces de paginación
        $wrapper.find('.page-link').off('click').on('click', function (e) {
            e.preventDefault();
            const accion = $(this).data('page');
            let nueva = paginaActual;
            if (accion === 'prev') nueva = Math.max(1, paginaActual - 1);
            else if (accion === 'next') nueva = Math.min(totalPaginas, paginaActual + 1);
            else nueva = parseInt(accion, 10);

            if (nueva !== paginaActual) {
                paginaActual = nueva;
                renderJefesDelegacionPaginados(window._ultimosFiltrados || []);
            }
        });
    }

    // Elimina la función renderJefesDelegacion duplicada y factoriza para que solo exista la versión paginada
    function renderJefesDelegacionPaginados(jefes) {
        window._ultimosFiltrados = jefes;
        const inicio = (paginaActual - 1) * jefesPorPagina;
        const fin = inicio + jefesPorPagina;
        const paginaJefes = jefes.slice(inicio, fin);
        const container = document.getElementById('jefesDelegacionContainer');
        container.innerHTML = '';
        if (paginaJefes.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted">No se encontraron jefes de delegación.</div>';
            document.body.classList.remove('animating-jefesdelegacion');
        } else {
            document.body.classList.add('animating-jefesdelegacion');
            let animCount = paginaJefes.length;
            paginaJefes.forEach((j, idx) => {
                const card = document.createElement('div');
                card.className = 'col-12 col-sm-6 col-lg-4 d-flex';
                card.innerHTML = `
                    <div class="card jefe-delegacion-card h-100 animate__animated animate__fadeInUp" style="animation-delay:${idx * 60}ms; position:relative;">
                        <div class="card-body d-flex flex-column h-100 p-3">
                            <div class="d-flex flex-row h-100 align-items-start">
                                <div class="perfil-fija me-3 flex-shrink-0 d-flex align-items-start justify-content-start" style="min-width:72px;max-width:72px;">
                                    <img src="../static/images/perfil_participante_defecto.svg" class="rounded-circle perfil-img" alt="Perfil" width="64" height="64">
                                </div>
                                <div class="datos-jefe-delegacion flex-grow-1 d-flex flex-column justify-content-between h-100">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <h5 class="card-title mb-1 text-break" style="word-break:break-word;max-width:calc(100% - 80px);">${j.nombreParticipante}</h5>
                                        <span class="ms-2 mt-1"><i class="fa-solid fa-flag"></i> ${j.nombrePais || ''}</span>
                                    </div>
                                    <div class="flex-grow-1">
                                        <p class="mb-1"><strong>Sexo:</strong> ${j.sexo === 'M' ? 'Masculino' : (j.sexo === 'F' ? 'Femenino' : j.sexo || '-')}</p>
                                        <p class="mb-1"><strong>Edad:</strong> ${j.edad !== undefined ? j.edad : '-'}</p>
                                        <p class="mb-1"><strong>Región:</strong> ${j.nombreRegion || '-'}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="jefe-delegacion-actions position-absolute end-0 bottom-0 p-2 d-flex gap-2">
                                <button class="btn btn-sm btn-light border shadow-sm btn-eliminar-jefe-delegacion" title="Eliminar" data-id="${j.idJefe}"><i class="fa fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `;
                // Detectar fin de animación en la última tarjeta
                card.querySelector('.jefe-delegacion-card').addEventListener('animationend', function () {
                    animCount--;
                    if (animCount === 0) {
                        document.body.classList.remove('animating-jefesdelegacion');
                    }
                }, { once: true });
                container.appendChild(card);
            });
        }
        renderJefesDelegacion(paginaJefes);
        renderPaginacionBootstrap(jefes.length, paginaActual, jefesPorPagina);
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'JEFE_DELEGACION' && window.handleDelegationChief) {
            window.handleDelegationChief();
        }
        else if (userRole === 'PARTICIPANTE' && window.handleParticipant) {
            window.handleParticipant();
        }
    }

    function aplicarFiltrosJefesDelegacion() {
        const nombre = $('#filtroNombre').val().trim().toLowerCase();
        const idPais = $('#filtroPais').val();
        const idRegion = $('#filtroRegion').val();
        let filtrados = todosLosJefes;
        if (nombre) {
            filtrados = filtrados.filter(j => j.nombreParticipante.toLowerCase().includes(nombre));
        }
        if (idPais) {
            filtrados = filtrados.filter(j => String(j.idPais) === String(idPais));
        }
        if (idRegion) {
            filtrados = filtrados.filter(j => String(j.idRegion) === String(idRegion));
        }
        // Solo reiniciar a la primera página si el filtro cambió
        paginaActual = 1;
        renderJefesDelegacionPaginados(filtrados);
    }

    // Cargar todos los jefes de delegación con país y región al inicio
    function cargarJefesDelegacionConPaisRegion() {
        $.get('http://localhost:8080/jefes-delegacion/con-pais-region', function (data) {
            todosLosJefes = data;
            renderJefesDelegacionPaginados(todosLosJefes);
        });
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
    window.buscarJefesDelegacion = function () {
        const nombre = $('#filtroNombre').val().trim();
        const idPais = $('#filtroPais').val();
        const idRegion = $('#filtroRegion').val();
        let url = 'http://localhost:8080/jefes-delegacion/buscar?';
        if (nombre) url += `nombre=${encodeURIComponent(nombre)}&`;
        if (idPais) url += `idPais=${idPais}&`;
        if (idRegion) url += `idRegion=${idRegion}&`;
        url = url.replace(/&$/, '');
        $.get(url, function (data) {
            todosLosJefes = data;
            paginaActual = 1;
            renderJefesDelegacionPaginados(todosLosJefes);
        }).fail(function (xhr, status, error) {
            console.error('Error al buscar jefes de delegación:', error);
            $('#jefesDelegacionContainer').html('<div class="col-12 text-center text-danger">No se pudo cargar la lista de jefes de delegación.</div>');
            mostrarToastError();
        });
    }

    // Búsqueda live: al cambiar el input filtra inmediatamente
    $('#filtroNombre').on('input', function () {
        aplicarFiltrosJefesDelegacion();
    });

    // Al cambiar cualquier filtro
    $('#filtroRegion').on('change', function () {
        const idRegion = $(this).val();
        poblarSelectPaises(idRegion);
        aplicarFiltrosJefesDelegacion();
    });
    $('#filtroPais').on('change', function () {
        aplicarFiltrosJefesDelegacion();
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
            const $selects = $('#filtroPais, #filtroRegion');
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
        const $selects = $('#filtroPais, #filtroRegion');
        if (!$panel.hasClass('show')) {
            $selects.prop('disabled', true);
        } else {
            $selects.prop('disabled', false);
        }
    });

    // Cargar todos los jefes de delegación al inicio
    cargarJefesDelegacionConPaisRegion();
});

// --- MODAL AÑADIR JEFE DELEGACION ---
$(document).ready(function () {
    // Botón para abrir modal (añadir)
    $('#btnAddJefeDelegacion').on('click', function () {
        $('#modalAddJefeDelegacion h2').text('Añadir Jefe Delegación');
        $('#formAddJefeDelegacion button[type="submit"]').html('<i class="fa fa-floppy-disk me-2"></i>Guardar');
        $('#formAddJefeDelegacion').removeData('edit-id');
        $('#modalAddJefeDelegacion').removeClass('d-none');
        $('body').addClass('modal-open');
        const $dialog = $('#modalAddJefeDelegacion .modal-dialog');
        $dialog.removeClass('blur-out').addClass('blur-in');
        setTimeout(() => {
            $dialog.removeClass('blur-in');
        }, 200);
        cargarPaisesModal();
        $('#formAddJefeDelegacion')[0].reset();
        $('#addUsuario').closest('.mb-3').show();
        $('#addContrasena').closest('.mb-3').show();
        $('#formAddJefeDelegacion .add-error-msg').remove();
    });
    // Botón cancelar o click fuera del modal
    $('#btnCancelarAddJefeDelegacion, #modalAddJefeDelegacion .modal-backdrop').on('click', function () {
        cerrarModalJefeDelegacion();
    });
    // Cerrar modal with Escape
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && !$('#modalAddJefeDelegacion').hasClass('d-none')) {
            cerrarModalJefeDelegacion();
        }
    });
    // Eliminar jefe de delegación con modal
    let jefeDelegacionAEliminar = null;
    $(document).on('click', '.btn-eliminar-jefe-delegacion', function () {
        jefeDelegacionAEliminar = $(this).data('id');
        $('#modalEliminarJefeDelegacion').removeClass('d-none');
        $('body').addClass('modal-eliminar-open');
        const $dialog = $('#modalEliminarJefeDelegacion .modal-dialog');
        $dialog.removeClass('blur-out').addClass('blur-in');
        setTimeout(() => {
            $dialog.removeClass('blur-in');
        }, 200);
    });
    // Confirmar eliminación
    $('#btnConfirmarEliminarJefeDelegacion').off('click').on('click', function () {
        if (!jefeDelegacionAEliminar) return;
        const id = jefeDelegacionAEliminar;
        $('#btnConfirmarEliminarJefeDelegacion').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Eliminando...');
        $.ajax({
            url: `http://localhost:8080/jefes-delegacion/${id}`,
            method: 'DELETE',
            success: function () {
                cerrarModalEliminarJefeDelegacion(function () {
                    window.buscarJefesDelegacion();
                });
            },
            error: function (xhr) {
                $('#modalEliminarJefeDelegacion .add-error-msg').remove();
                const $modalContent = $('#modalEliminarJefeDelegacion .modal-content');
                const $dFlex = $modalContent.find('.d-flex:has(button[id="btnConfirmarEliminarJefeDelegacion"])').first();
                let msg = 'Error al eliminar jefe de delegación: ' + (xhr.responseJSON?.message || xhr.statusText);
                if ($dFlex.length) {
                    $dFlex.before('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                } else {
                    $modalContent.prepend('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                }
                $('#btnConfirmarEliminarJefeDelegacion').prop('disabled', false).html('<i class="fa fa-trash me-2"></i>Eliminar');
            }
        });
    });
    // Cancelar eliminación
    $('#btnCancelarEliminarJefeDelegacion').on('click', function () {
        cerrarModalEliminarJefeDelegacion();
    });
    function cerrarModalEliminarJefeDelegacion(cb) {
        const $dialog = $('#modalEliminarJefeDelegacion .modal-dialog');
        $dialog.removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $('#modalEliminarJefeDelegacion').addClass('d-none');
            $('body').removeClass('modal-eliminar-open');
            if (cb) cb();
        }, 400);
    }
    // Modificar submit para actualizar si es edición
    $('#formAddJefeDelegacion').off('submit').on('submit', function (e) {
        e.preventDefault();
        const $btn = $('#formAddJefeDelegacion button[type="submit"]');
        $('#formAddJefeDelegacion .add-error-msg').remove();
        $btn.prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...');
        const jefeDelegacion = {
            nombre: $('#addNombre').val().trim(),
            numCarnet: $('#addNumCarnet').val().trim(),
            edad: parseInt($('#addEdad').val(), 10),
            sexo: $('#addSexo').val(),
            pais: { idPais: parseInt($('#addPais').val(), 10) },
            usuario: $('#addUsuario').val().trim(),
            contraseña: $('#addContrasena').val()
        };
        let ajaxOpts = {
            url: 'http://localhost:8080/jefes-delegacion',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(jefeDelegacion),
        };
        ajaxOpts.success = function () {
            cerrarModalJefeDelegacion();
            setTimeout(() => {
                window.buscarJefesDelegacion();
            }, 400);
        };
        ajaxOpts.error = function (xhr) {
            $('#formAddJefeDelegacion .add-error-msg').remove();
            const $modalContent = $('#modalAddJefeDelegacion .modal-content');
            const $dFlex = $modalContent.find('.d-flex:has(button[type="submit"])').first();
            let msg = 'Error al añadir jefe de delegación: ' + (xhr.responseJSON?.message || xhr.statusText);
            if ($dFlex.length) {
                $dFlex.before('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
            } else {
                $modalContent.prepend('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
            }
            $btn.prop('disabled', false).html('<i class="fa fa-floppy-disk me-2"></i>Guardar');
        };
        $.ajax(ajaxOpts);
    });
    // Al cerrar modal, restaurar estado de formulario
    function cerrarModalJefeDelegacion() {
        const $dialog = $('#modalAddJefeDelegacion .modal-dialog');
        $dialog.removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $('#modalAddJefeDelegacion').addClass('d-none');
            $('body').removeClass('modal-open');
            $('#formAddJefeDelegacion')[0].reset();
            $('#formAddJefeDelegacion').removeData('edit-id');
        }, 400);
    }
    // Modificar cargarPaisesModal para callback
    function cargarPaisesModal(cb) {
        const $select = $('#addPais');
        $select.empty();
        $select.append('<option value="">Seleccione un país</option>');
        $.get('http://localhost:8080/paises', function (data) {
            data.forEach(function (pais) {
                $select.append(`<option value="${pais.idPais}">${pais.nombrePais}</option>`);
            });
            if (cb) cb();
        });
    }
});