$(function () {
    let allCategorias = [];
    let allPaises = [];
    let paginaActual = 1;
    const equiposPorPagina = 12;
    let todosLosEquipos = [];

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

    function renderEquipos(equipos) {
        const container = document.getElementById('equiposContainer');
        container.innerHTML = '';
        if (equipos.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted">No se encontraron equipos.</div>';
            document.body.classList.remove('animating-equipos');
            return;
        }
        // Oculta scroll durante la animación
        document.body.classList.add('animating-equipos');
        let animCount = equipos.length;
        equipos.forEach((e, idx) => {
            const card = document.createElement('div');
            card.className = 'col-12 col-sm-6 col-lg-4 d-flex';
            card.innerHTML = `
                <div class="card equipo-card h-100 animate__animated animate__fadeInUp" style="animation-delay:${idx * 60}ms; position:relative;">
                    <div class="card-body d-flex flex-column h-100 p-3">
                        <div class="d-flex flex-row h-100 align-items-start">
                            <div class="perfil-fija me-3 flex-shrink-0 d-flex align-items-start justify-content-start" style="min-width:72px;max-width:72px;">
                                <img src="../static/images/perfil_equipo_defecto.svg" class="rounded-circle perfil-img" alt="Perfil" width="64" height="64">
                            </div>
                            <div class="datos-equipo flex-grow-1 d-flex flex-column justify-content-between h-100">
                                <div class="d-flex justify-content-between align-items-start">
                                    <h5 class="card-title mb-1 text-break">${e.nombreEquipo}</h5>
                                    <span class="ms-2 mt-1"><i class="fa-solid fa-flag"></i> ${e.nombrePais || ''}</span>
                                </div>
                                <div class="flex-grow-1">
                                    <p class="mb-1"><strong>Categoría:</strong> ${e.nombreCategoria || '-'}</p>
                                </div>
                            </div>
                        </div>
                        <div class="equipo-actions position-absolute end-0 bottom-0 p-2 d-flex gap-2">
                            <button class="btn btn-sm btn-light border shadow-sm btn-editar-equipo" title="Editar" data-id="${e.idEquipo}"><i class="fa fa-pen"></i></button>
                            <button class="btn btn-sm btn-light border shadow-sm btn-eliminar-equipo" title="Eliminar" data-id="${e.idEquipo}"><i class="fa fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
            // Detectar fin de animación en la última tarjeta
            card.querySelector('.equipo-card').addEventListener('animationend', function () {
                animCount--;
                if (animCount === 0) {
                    document.body.classList.remove('animating-equipos');
                }
            }, { once: true });
            container.appendChild(card);
        });
    }

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
                renderEquiposPaginados(todosLosEquipos);
            }
        });
    }

    function renderEquiposPaginados(equipos) {
        const inicio = (paginaActual - 1) * equiposPorPagina;
        const fin = inicio + equiposPorPagina;
        renderEquipos(equipos.slice(inicio, fin));
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'JEFE_DELEGACION' && window.handleDelegationChief) {
            window.handleDelegationChief();
        }
        else if (userRole === 'PARTICIPANTE' && window.handleParticipant) {
            window.handleParticipant();
        }
        renderPaginacionEquipos(equipos.length, paginaActual, equiposPorPagina);
    }

    // --- FILTRO NOMBRE, PAÍS, CATEGORÍA ---
    $('#filtroNombreEquipo').on('input', function () { buscarEquipos(); });
    $('#filtroCategoriaEquipo').on('change', function () { buscarEquipos(); });
    $('#filtroPaisEquipo').on('change', function () { buscarEquipos(); });

    window.buscarEquipos = function () {
        const nombre = $('#filtroNombreEquipo').val().trim();
        const idCategoria = $('#filtroCategoriaEquipo').val();
        const idPais = $('#filtroPaisEquipo').val();
        let url = 'http://localhost:8080/equipos/buscar?';
        if (nombre) url += `nombre=${encodeURIComponent(nombre)}&`;
        if (idCategoria) url += `idCategoria=${idCategoria}&`;
        if (idPais) url += `idPais=${idPais}&`;
        url = url.replace(/&$/, '');
        $.get(url, function (data) {
            todosLosEquipos = data;
            paginaActual = 1;
            renderEquiposPaginados(todosLosEquipos);
        }).fail(function (xhr, status, error) {
            console.error('Error al buscar equipos:', error);
            $('#equiposContainer').html('<div class="col-12 text-center text-danger">No se pudo cargar la lista de equipos.</div>');
        });
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

    // --- MODAL AÑADIR/EDITAR EQUIPO ---
    // Botón para abrir modal (añadir)
    $('#btnAddEquipo').on('click', function () {
        $('#modalAddEquipo h2').text('Añadir Equipo');
        $('#formAddEquipo button[type="submit"]').html('<i class="fa fa-floppy-disk me-2"></i>Guardar');
        $('#formAddEquipo').removeData('edit-id');
        $('#modalAddEquipo').removeClass('d-none');
        $('body').addClass('modal-equipo-open');
        const $dialog = $('#modalAddEquipo .modal-dialog');
        $dialog.removeClass('blur-out').addClass('blur-in');
        setTimeout(() => { $dialog.removeClass('blur-in'); }, 200);
        poblarSelectPaises(function () {
            poblarSelectCategorias();
        });
        // Limpiar selects y campos
        $('#addPaisEquipo').val('');
        $('#addCategoriaEquipo').val('');
        $('#addNombreEquipo').val('');
    });
    // Botón cancelar o click fuera del modal
    $('#btnCancelarAddEquipo, #modalAddEquipo .modal-backdrop').on('click', function () {
        cerrarModalEquipo();
    });
    // Cerrar modal con Escape
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && !$('#modalAddEquipo').hasClass('d-none')) {
            cerrarModalEquipo();
        }
    });
    function cerrarModalEquipo() {
        const $dialog = $('#modalAddEquipo .modal-dialog');
        $dialog.removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $('#modalAddEquipo').addClass('d-none');
            $('body').removeClass('modal-equipo-open');
            $dialog.removeClass('blur-out');
            $('#formAddEquipo')[0].reset();
            $('#formAddEquipo').removeData('edit-id');
            $('#formAddEquipo .add-error-msg').remove();
        }, 400);
    }
    // Editar equipo
    $(document).on('click', '.btn-editar-equipo', function () {
        const id = $(this).data('id');
        $.get(`http://localhost:8080/equipos/${id}`, function (e) {
            $('#addNombreEquipo').val(e.nombreEquipo);
            $('#formAddEquipo').data('edit-id', id);
            $('#modalAddEquipo h2').text('Editar Equipo');
            $('#formAddEquipo button[type="submit"]').html('<i class="fa fa-floppy-disk me-2"></i>Guardar Cambios');
            $('#modalAddEquipo').removeClass('d-none');
            $('body').addClass('modal-equipo-open');
            const $dialog = $('#modalAddEquipo .modal-dialog');
            $dialog.removeClass('blur-out').addClass('blur-in');
            setTimeout(() => { $dialog.removeClass('blur-in'); }, 200);
            poblarSelectPaises(function () {
                // Selección SOLO por nombre
                let paisNombre = e.nombrePais || (e.pais && e.pais.nombrePais);
                let paisSeleccionado = false;
                if (paisNombre) {
                    $('#addPaisEquipo option').each(function () {
                        if ($(this).text().trim() === paisNombre.trim()) {
                            $('#addPaisEquipo').val($(this).val()).trigger('change');
                            paisSeleccionado = true;
                            return false;
                        }
                    });
                    if (!paisSeleccionado) {
                        console.warn('No se encontró el país por nombre:', paisNombre);
                    }
                }
                poblarSelectCategorias(function () {
                    // Selección SOLO por nombre para categoría
                    let catNombre = e.nombreCategoria || (e.equipoCategoria && e.equipoCategoria.nombreCategoria);
                    let catSeleccionada = false;
                    if (catNombre) {
                        $('#addCategoriaEquipo option').each(function () {
                            if ($(this).text().trim() === catNombre.trim()) {
                                $('#addCategoriaEquipo').val($(this).val()).trigger('change');
                                catSeleccionada = true;
                                return false;
                            }
                        });
                        if (!catSeleccionada) {
                            console.warn('No se encontró la categoría por nombre:', catNombre);
                        }
                    }
                });
            });
        });
    });
    // Eliminar equipo con modal
    let equipoAEliminar = null;
    $(document).on('click', '.btn-eliminar-equipo', function () {
        equipoAEliminar = $(this).data('id');
        $('#modalEliminarEquipo').removeClass('d-none');
        $('body').addClass('modal-equipo-open');
        const $dialog = $('#modalEliminarEquipo .modal-dialog');
        $dialog.removeClass('blur-out').addClass('blur-in');
        setTimeout(() => { $dialog.removeClass('blur-in'); }, 200);
    });
    // Confirmar eliminación
    $('#btnConfirmarEliminarEquipo').on('click', function () {
        if (!equipoAEliminar) return;
        const id = equipoAEliminar;
        $('#btnConfirmarEliminarEquipo').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Eliminando...');
        $.ajax({
            url: `http://localhost:8080/equipos/${id}`,
            method: 'DELETE',
            success: function () {
                cerrarModalEliminarEquipo();
                setTimeout(() => { buscarEquipos(); }, 400);
            },
            error: function (xhr) {
                // Mostrar error en el modal, no alert
                $('#modalEliminarEquipo .add-error-msg').remove();
                const $modalContent = $('#modalEliminarEquipo .modal-content');
                const $dFlex = $modalContent.find('.d-flex:has(button[id="btnConfirmarEliminarEquipo"])').first();
                let msg = 'Error al eliminar el equipo: ' + (xhr.responseJSON?.message || xhr.statusText);
                if ($dFlex.length) {
                    $dFlex.before('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                } else {
                    $modalContent.prepend('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                }
                $('#btnConfirmarEliminarEquipo').prop('disabled', false).html('<i class="fa fa-trash me-2"></i>Eliminar');
            }
        });
    });
    $('#btnCancelarEliminarEquipo').on('click', function () {
        cerrarModalEliminarEquipo();
    });
    function cerrarModalEliminarEquipo(cb) {
        const $dialog = $('#modalEliminarEquipo .modal-dialog');
        $dialog.removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $('#modalEliminarEquipo').addClass('d-none');
            $('body').removeClass('modal-equipo-open');
            $dialog.removeClass('blur-out');
            if (cb) cb();
        }, 400);
    }
    // --- TOAST DE ERROR VISUAL ---
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
    // Submit añadir/editar equipo
    $('#formAddEquipo').off('submit').on('submit', function (e) {
        e.preventDefault();
        const $btn = $('#formAddEquipo button[type="submit"]');
        const $errorMsg = $('#formAddEquipo .add-error-msg');
        $errorMsg.remove();
        $btn.prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...');
        const equipo = {
            nombreEquipo: $('#addNombreEquipo').val().trim(),
            equipoCategoria: { idEquipoCategoria: parseInt($('#addCategoriaEquipo').val(), 10) },
            pais: { idPais: parseInt($('#addPaisEquipo').val(), 10) }
        };
        const editId = $(this).data('edit-id');
        let ajaxOpts = {
            url: 'http://localhost:8080/equipos',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(equipo),
        };
        if (editId) {
            ajaxOpts.url = `http://localhost:8080/equipos/${editId}`;
            ajaxOpts.method = 'PUT';
        }
        ajaxOpts.success = function () {
            $btn.html('<span class="fa fa-check me-2" style="color:#fff;"></span>Guardado')
                .removeClass('btn-primary').addClass('btn-success');
            $btn.css({ transition: 'background 0.4s, color 0.4s' });
            setTimeout(() => {
                cerrarModalEquipo();
                setTimeout(() => {
                    $btn.prop('disabled', false)
                        .removeClass('btn-success').addClass('btn-primary')
                        .html('<i class="fa fa-floppy-disk me-2"></i>' + (editId ? 'Guardar Cambios' : 'Guardar'));
                    $('#formAddEquipo').removeData('edit-id');
                    buscarEquipos();
                }, 400);
            }, 800);
        };
        ajaxOpts.error = function (xhr) {
            let msg = 'Error al ' + (editId ? 'actualizar' : 'añadir') + ' equipo: ' + (xhr.responseJSON?.message || xhr.statusText);
            $('#formAddEquipo .add-error-msg').remove();
            const $modalContent = $('#modalAddEquipo .modal-content');
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
    function cerrarModalEquipo() {
        const $dialog = $('#modalAddEquipo .modal-dialog');
        $dialog.removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $('#modalAddEquipo').addClass('d-none');
            $('body').removeClass('modal-equipo-open');
            $dialog.removeClass('blur-out');
            $('#formAddEquipo')[0].reset();
            $('#formAddEquipo').removeData('edit-id');
            $('#formAddEquipo .add-error-msg').remove();
        }, 400);
    }
    // Inicializar selects y cargar equipos
    poblarSelectCategorias();
    poblarSelectPaises();
    buscarEquipos();
});
