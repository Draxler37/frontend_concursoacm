$(function () {
    // Variables globales
    let paginaActual = 1;
    const preguntasPorPagina = 12;
    let todasLasPreguntas = [];

    // Función para renderizar preguntas (se completará luego)
    function renderPreguntas(preguntas) {
        const container = document.getElementById('preguntasContainer');
        container.innerHTML = '';
        if (preguntas.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted">No se encontraron preguntas.</div>';
            document.body.classList.remove('animating-preguntas');
            return;
        }
        document.body.classList.add('animating-preguntas');
        let animCount = preguntas.length;
        preguntas.forEach((p, idx) => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-4 d-flex';
            card.innerHTML = `
            <div class="card shadow-sm ${p.usada ? 'card-usada' : 'card-no-usada'} pregunta-card animate__animated animate__fadeInUp" style="animation-delay:${idx * 60}ms; position:relative;">
                <div class="card-body d-flex flex-column h-100 p-3">
                    <h5 class="card-title">Pregunta #${p.idPregunta}</h5>
                    <p class="card-text mb-2">${p.texto}</p>
                    <p><strong>Clase:</strong> ${p.clase?.nombreClase || '-'} | <strong>Puntos:</strong> ${p.puntuacionMaxima}</p>
                    <p class="mb-2">
                        <span class="badge ${p.usada ? 'bg-danger' : 'bg-success'}">
                            ${p.usada ? 'Usada' : 'No usada'}
                        </span>
                    </p>
                    <div class="pregunta-actions position-absolute end-0 bottom-0 p-2 d-flex gap-2">
                        <button class="btn btn-sm btn-light border shadow-sm btn-editar-pregunta" title="Editar" data-id="${p.idPregunta}">
                            <i class="fa fa-pen"></i>
                        </button>
                        <button class="btn btn-sm btn-light border shadow-sm btn-eliminar-pregunta" title="Eliminar" data-id="${p.idPregunta}">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            `;
            card.querySelector('.pregunta-card').addEventListener('animationend', function() {
                animCount--;
                if (animCount === 0) {
                    document.body.classList.remove('animating-preguntas');
                }
            }, { once: true });
            container.appendChild(card);
        });
    }

    // --- Paginación ---
    function renderPaginacionPreguntas(total, pagina, porPagina) {
        const totalPaginas = Math.ceil(total / porPagina);
        const $wrapper = $('#paginacionPreguntasWrapper');
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
        $wrapper.find('.page-link').off('click').on('click', function(e) {
            e.preventDefault();
            const accion = $(this).data('page');
            let nueva = pagina;
            if (accion === 'prev') nueva = Math.max(1, pagina - 1);
            else if (accion === 'next') nueva = Math.min(totalPaginas, pagina + 1);
            else nueva = parseInt(accion, 10);
            if (nueva !== pagina) {
                paginaActual = nueva;
                renderPreguntasPaginadas(todasLasPreguntas);
            }
        });
    }

    function renderPreguntasPaginadas(preguntas) {
        const inicio = (paginaActual - 1) * preguntasPorPagina;
        const fin = inicio + preguntasPorPagina;
        renderPreguntas(preguntas.slice(inicio, fin));
        renderPaginacionPreguntas(preguntas.length, paginaActual, preguntasPorPagina);
    }

    // --- Filtros y búsqueda ---
    $('#filtroTextoPregunta').on('input', function() { buscarPreguntas(); });
    $('#filtroClasePregunta').on('change', function() { buscarPreguntas(); });
    $('#filtroUsadaPregunta').on('change', function() { buscarPreguntas(); });

    window.buscarPreguntas = function() {
        const texto = $('#filtroTextoPregunta').val().trim();
        const clase = $('#filtroClasePregunta').val();
        const usada = $('#filtroUsadaPregunta').val();
        let url = 'http://localhost:8080/preguntas?';
        if (texto) url += `texto=${encodeURIComponent(texto)}&`;
        if (clase) url += `clase=${clase}&`;
        if (usada) url += `usada=${usada}&`;
        url = url.replace(/&$/, '');
        $.get(url, function(data) {
            todasLasPreguntas = data;
            paginaActual = 1;
            renderPreguntasPaginadas(todasLasPreguntas);
        }).fail(function(xhr, status, error) {
            console.error('Error al buscar preguntas:', error);
            $('#preguntasContainer').html('<div class="col-12 text-center text-danger">No se pudo cargar la lista de preguntas.</div>');
        });
    }

    // Inicializar filtros de clase
    function poblarSelectClasesPregunta(cb, selectedId) {
        const $select = $('#filtroClasePregunta');
        $select.empty();
        $select.append('<option value="">Cualquier clase</option>');
        $.get('http://localhost:8080/preguntas/clases', function (data) {
            data.forEach(function (item) {
                $select.append(`<option value="${item.nombreClase}">${item.nombreClase}</option>`);
            });
            if (selectedId) $select.val(String(selectedId));
            if (typeof cb === 'function') cb();
        });
    }

    // --- Cargar clases en el modal de preguntas ---
    function cargarClasesModal(cb, selectedNombreClase) {
        const $select = $('#addClasePregunta');
        $select.empty();
        $select.append('<option value="">Seleccione una clase</option>');
        $.get('http://localhost:8080/preguntas/clases', function (data) {
            data.forEach(function (item) {
                $select.append(`<option value="${item.nombreClase}" data-id="${item.idClase}">${item.nombreClase}</option>`);
            });
            if (selectedNombreClase) $select.val(String(selectedNombreClase));
            if (typeof cb === 'function') cb();
        });
    }

    // Mostrar/ocultar filtros avanzados
    let filtrosVisibles = false;
    $('#toggleFiltrosPreguntasBtn').on('click', function() {
        filtrosVisibles = !filtrosVisibles;
        const $panel = $('#filtrosAvanzadosPreguntas');
        if (filtrosVisibles) {
            $panel.addClass('show');
            $(this).addClass('active');
        } else {
            $panel.removeClass('show');
            $(this).removeClass('active');
        }
    });

    // Cargar clases y preguntas al inicio
    poblarSelectClasesPregunta();
    buscarPreguntas();

    // --- MODAL AÑADIR PREGUNTA ---
    // Botón para abrir modal (añadir)
    $('#btnAddPregunta').on('click', function () {
        $('#modalAddPregunta h2').text('Añadir Pregunta');
        $('#formAddPregunta button[type="submit"]').html('<i class="fa fa-floppy-disk me-2"></i>Guardar');
        $('#formAddPregunta')[0].reset();
        $('#formAddPregunta').removeData('edit-id');
        $('#formAddPregunta .add-error-msg').remove();
        cargarClasesModal(function() {
            $('#addClasePregunta').val('');
        });
        $('#addUsada').closest('.mb-3').hide();
        $('#modalAddPregunta').removeClass('d-none');
        $('body').addClass('modal-pregunta-open');
        const $dialog = $('#modalAddPregunta .modal-dialog');
        $dialog.removeClass('blur-out').addClass('blur-in');
        setTimeout(() => { $dialog.removeClass('blur-in'); }, 200);
    });
    // Botón cancelar o click fuera del modal
    $('#btnCancelarAddPregunta, #modalAddPregunta .modal-backdrop').on('click', function () {
        cerrarModalPregunta();
    });
    // Cerrar modal con Escape
    $(document).on('keydown', function(e){
        if (e.key === 'Escape' && !$('#modalAddPregunta').hasClass('d-none')) {
            cerrarModalPregunta();
        }
    });
    function cerrarModalPregunta() {
        const $dialog = $('#modalAddPregunta .modal-dialog');
        $dialog.removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $('#modalAddPregunta').addClass('d-none');
            $('body').removeClass('modal-pregunta-open');
            $dialog.removeClass('blur-out');
            $('#formAddPregunta')[0].reset();
            $('#formAddPregunta').removeData('edit-id');
        }, 400);
    }

    // --- MODAL EDITAR PREGUNTA ---
    $(document).on('click', '.btn-editar-pregunta', function () {
        const id = $(this).data('id');
        $.get(`http://localhost:8080/preguntas/${id}`, function (p) {
            $('#addTextoPregunta').val(p.texto);
            cargarClasesModal(function() {
                $('#addClasePregunta').val(p.clase?.nombreClase || '');
            });
            $('#addPuntuacionMaxima').val(p.puntuacionMaxima);
            $('#addUsada').val(String(p.usada));
            $('#formAddPregunta').data('edit-id', id);
            $('#modalAddPregunta h2').text('Editar Pregunta');
            $('#formAddPregunta button[type="submit"]').html('<i class="fa fa-floppy-disk me-2"></i>Guardar Cambios');
            $('#addUsada').closest('.mb-3').show();
            $('#formAddPregunta .add-error-msg').remove();
            $('#modalAddPregunta').removeClass('d-none');
            $('body').addClass('modal-pregunta-open');
            const $dialog = $('#modalAddPregunta .modal-dialog');
            $dialog.removeClass('blur-out').addClass('blur-in');
            setTimeout(() => { $dialog.removeClass('blur-in'); }, 200);
        });
    });

    // --- MODAL ELIMINAR PREGUNTA ---
    let preguntaAEliminar = null;
    $(document).on('click', '.btn-eliminar-pregunta', function () {
        preguntaAEliminar = $(this).data('id');
        $('#modalEliminarPregunta').removeClass('d-none');
        $('body').addClass('modal-pregunta-open');
        const $dialog = $('#modalEliminarPregunta .modal-dialog');
        $dialog.removeClass('blur-out').addClass('blur-in');
        setTimeout(() => { $dialog.removeClass('blur-in'); }, 200);
    });
    // Botón cancelar o click fuera del modal
    $('#btnCancelarEliminarPregunta, #modalEliminarPregunta .modal-backdrop').on('click', function () {
        cerrarModalEliminarPregunta();
    });
    // Cerrar modal con Escape
    $(document).on('keydown', function(e){
        if (e.key === 'Escape' && !$('#modalEliminarPregunta').hasClass('d-none')) {
            cerrarModalEliminarPregunta();
        }
    });
    // Cerrar modal al hacer click fuera del modal-dialog (fix)
    $('#modalEliminarPregunta').on('mousedown', function(e) {
        if (e.target === this) {
            cerrarModalEliminarPregunta();
        }
    });
    function cerrarModalEliminarPregunta(cb) {
        const $dialog = $('#modalEliminarPregunta .modal-dialog');
        $dialog.removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $('#modalEliminarPregunta').addClass('d-none');
            $('body').removeClass('modal-pregunta-open');
            $dialog.removeClass('blur-out');
            preguntaAEliminar = null;
            if (cb) cb();
        }, 400);
    }

    // --- SUBMIT AÑADIR/EDITAR PREGUNTA (con confirmación visual) ---
    $('#formAddPregunta').off('submit').on('submit', function (e) {
        e.preventDefault();
        const $btn = $('#formAddPregunta button[type="submit"]');
        const $errorMsg = $('#formAddPregunta .add-error-msg');
        $errorMsg.remove();
        $btn.prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...');
        const claseNombre = $('#addClasePregunta').val();
        let claseId = null;
        // Buscar el id de la clase seleccionada en el select
        if (claseNombre) {
            const option = $('#addClasePregunta option:selected');
            claseId = option.data('id') || option.attr('data-id');
            // Si no hay data-id, buscar por nombre en el select
            if (!claseId) {
                // Buscar en el select de clases cargadas
                const optionObj = $('#addClasePregunta option').filter(function(){
                    return $(this).val() === claseNombre;
                });
                claseId = optionObj.data('id') || optionObj.attr('data-id');
            }
        }
        // Si no se encuentra el id, dejarlo como null
        const pregunta = {
            texto: $('#addTextoPregunta').val().trim(),
            puntuacionMaxima: parseInt($('#addPuntuacionMaxima').val(), 10),
            clase: claseId ? { idClase: parseInt(claseId, 10), nombreClase: claseNombre } : null,
            usada: $('#formAddPregunta').data('edit-id') ? $('#addUsada').val() === 'true' : false
        };
        const editId = $(this).data('edit-id');
        let ajaxOpts = {
            url: 'http://localhost:8080/preguntas',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(pregunta),
        };
        if (editId) {
            ajaxOpts.url = `http://localhost:8080/preguntas/${editId}`;
            ajaxOpts.method = 'PUT';
        }
        ajaxOpts.success = function () {
            $btn.html('<span class="fa fa-check me-2" style="color:#fff;"></span>Guardado')
                .removeClass('btn-primary').addClass('btn-success');
            $btn.css({transition: 'background 0.4s, color 0.4s'});
            setTimeout(() => {
                cerrarModalPregunta();
                setTimeout(() => {
                    $btn.prop('disabled', false)
                        .removeClass('btn-success').addClass('btn-primary')
                        .html('<i class="fa fa-floppy-disk me-2"></i>' + (editId ? 'Guardar Cambios' : 'Guardar'));
                    $('#formAddPregunta').removeData('edit-id');
                    buscarPreguntas();
                }, 400);
            }, 800);
        };
        ajaxOpts.error = function (xhr) {
            let msg = 'Error al ' + (editId ? 'actualizar' : 'añadir') + ' pregunta: ' + (xhr.responseJSON?.message || xhr.statusText);
            // Manejo específico del error de constraint de puntuación mínima
            if (xhr.responseText && xhr.responseText.includes('Puntuacion_Maxima')) {
                msg = 'La puntuación máxima debe ser mayor o igual a 5.';
            }
            $('#formAddPregunta .add-error-msg').remove();
            const $modalContent = $('#modalAddPregunta .modal-content');
            const $dFlex = $modalContent.find('.d-flex:has(button[type="submit"])').first();
            if ($dFlex.length) {
                $dFlex.before('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
            } else {
                $modalContent.prepend('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
            }
            $btn.prop('disabled', false)
                .removeClass('btn-success').addClass('btn-primary')
                .html('<i class="fa fa-floppy-disk me-2"></i>' + (editId ? 'Guardar Cambios' : 'Guardar'));
        };
        $.ajax(ajaxOpts);
    });

    // --- CONFIRMACIÓN ELIMINAR PREGUNTA (con feedback visual) ---
    $('#btnConfirmarEliminarPregunta').on('click', function () {
        if (!preguntaAEliminar) return;
        const id = preguntaAEliminar;
        $('#btnConfirmarEliminarPregunta').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Eliminando...');
        $.ajax({
            url: `http://localhost:8080/preguntas/${id}`,
            method: 'DELETE',
            success: function () {
                cerrarModalEliminarPregunta(function() {
                    buscarPreguntas();
                });
            },
            error: function (xhr) {
                $('#modalEliminarPregunta .add-error-msg').remove();
                const $modalContent = $('#modalEliminarPregunta .modal-content');
                const $dFlex = $modalContent.find('.d-flex:has(button[id="btnConfirmarEliminarPregunta"])').first();
                let msg = 'Error al eliminar la pregunta: ' + (xhr.responseJSON?.message || xhr.statusText);
                if ($dFlex.length) {
                    $dFlex.before('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                } else {
                    $modalContent.prepend('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                }
                $('#btnConfirmarEliminarPregunta').prop('disabled', false).html('<i class="fa fa-trash me-2"></i>Eliminar');
            },
            complete: function () {
                $('#btnConfirmarEliminarPregunta').prop('disabled', false).html('<i class="fa fa-trash me-2"></i>Eliminar');
            }
        });    
    });
});
