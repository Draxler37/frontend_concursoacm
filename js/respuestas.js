// Mostrar/ocultar filtros avanzados
let filtrosVisibles = false;
$('#toggleFiltrosRespuestasBtn').on('click', function () {
    filtrosVisibles = !filtrosVisibles;
    const $panel = $('#filtrosAvanzadosRespuestas');
    if (filtrosVisibles) {
        $panel.addClass('show');
        $(this).addClass('active');
    } else {
        $panel.removeClass('show');
        $(this).removeClass('active');
    }
});

// --- Lógica para mostrar respuestas ---
$(function () {
    let todasLasRespuestas = [];
    let todasLasPreguntas = [];

    // Obtener todas las preguntas para mapear idPregunta -> texto
    function cargarPreguntas(cb) {
        $.get('http://localhost:8080/preguntas', function (data) {
            todasLasPreguntas = data;
            if (typeof cb === 'function') cb();
        });
    }

    // --- Filtro de evaluadas/no evaluadas ---
    function filtrarRespuestas() {
        const texto = $('#filtroTextoRespuesta').val().trim().toLowerCase();
        const filtroEvaluadas = $('#filtroRespuestasEvaluadas').val();
        let filtradas = todasLasRespuestas;
        // Filtro de texto
        if (texto) {
            filtradas = filtradas.filter(r => {
                const pregunta = todasLasPreguntas.find(p => p.idPregunta === r.idPregunta);
                const textoPregunta = pregunta ? pregunta.texto : '';
                return textoPregunta.toLowerCase().includes(texto) || (r.respuestaParticipante || '').toLowerCase().includes(texto);
            });
        }
        // Filtro de evaluadas
        if (filtroEvaluadas === 'true') {
            filtradas = filtradas.filter(r => !r.puntuacionObtenida || r.puntuacionObtenida === 0);
        } else if (filtroEvaluadas === 'false') {
            filtradas = filtradas.filter(r => r.puntuacionObtenida && r.puntuacionObtenida > 0);
        }
        return filtradas;
    }

    // --- Filtro y búsqueda combinada tipo "ventana" (windowed) como en asignar_preguntas.js ---
    function todasLasRespuestasFiltradas() {
        let respuestas = todasLasRespuestas;
        const texto = $('#filtroTextoRespuesta').val()?.trim().toLowerCase() || '';
        const filtroEvaluadas = $('#filtroRespuestasEvaluadas').val();
        // Filtro de texto
        if (texto) {
            respuestas = respuestas.filter(r => {
                const pregunta = todasLasPreguntas.find(p => p.idPregunta === r.idPregunta);
                const textoPregunta = pregunta ? pregunta.texto : '';
                return textoPregunta.toLowerCase().includes(texto) || (r.respuestaParticipante || '').toLowerCase().includes(texto);
            });
        }
        // Filtro de evaluadas
        if (filtroEvaluadas === 'true') {
            respuestas = respuestas.filter(r => !r.puntuacionObtenida || r.puntuacionObtenida === 0);
        } else if (filtroEvaluadas === 'false') {
            respuestas = respuestas.filter(r => r.puntuacionObtenida && r.puntuacionObtenida > 0);
        }
        return respuestas;
    }

    function renderRespuestas(respuestas) {
        const container = document.getElementById('respuestasContainer');
        container.innerHTML = '';
        if (respuestas.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-danger">No se encontraron respuestas.</div>';
            $('#paginacionRespuestasWrapper').hide();
            return;
        }
        // Mostrar el footer solo si hay resultados (la paginación se controla en renderPaginacionRespuestas)
        respuestas.forEach((r, idx) => {
            // Buscar el texto de la pregunta
            const pregunta = todasLasPreguntas.find(p => p.idPregunta === r.idPregunta);
            const textoPregunta = pregunta ? pregunta.texto : '(Pregunta no encontrada)';
            const evaluada = Number(r.puntuacionObtenida) > 0;
            const cardClass = evaluada ? 'card-evaluada' : 'card-no-evaluada';
            const badgeClass = evaluada ? 'bg-success' : 'bg-danger';
            const badgeText = evaluada ? 'Evaluada' : 'Por evaluar';

            // Crear el contenedor principal
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-4';

            // Crear el div interno con la clase respuesta-card
            const inner = document.createElement('div');
            inner.className = 'respuesta-card card shadow-sm animate__animated animate__fadeInUp ' + cardClass;
            inner.style.animationDelay = (idx * 60) + 'ms';
            inner.style.position = 'relative';

            inner.innerHTML =
                '<div class="card-body d-flex flex-column h-100 p-3">' +
                '<h5 class="card-title">Pregunta #' + r.idPregunta + '</h5>' +
                '<p class="card-text mb-2">' + textoPregunta + '</p>' +
                '<p class="mb-2"><strong>Respuesta:</strong> ' + (r.respuestaParticipante || '') + '</p>' +
                '<span class="badge ' + badgeClass + ' small">' + badgeText + '</span>' +
                '</div>';

            card.appendChild(inner);
            container.appendChild(card);
        });
    }

    // --- Paginación ---
    let paginaActual = 1;
    const respuestasPorPagina = 12;

    function renderPaginacionRespuestas(total, pagina, porPagina) {
        const totalPaginas = Math.ceil(total / porPagina);
        const $wrapper = $('#paginacionRespuestasWrapper');
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
                renderRespuestasPaginadas(todasLasRespuestas);
            }
        });
    }

    function renderRespuestasPaginadas(respuestas) {
        const inicio = (paginaActual - 1) * respuestasPorPagina;
        const fin = inicio + respuestasPorPagina;
        renderRespuestas(respuestas.slice(inicio, fin));
        renderPaginacionRespuestas(respuestas.length, paginaActual, respuestasPorPagina);
    }

    // Cargar y mostrar todas las respuestas
    function cargarRespuestas() {
        $.get('http://localhost:8080/respuestas', function (data) {
            todasLasRespuestas = data;
            paginaActual = 1;
            renderRespuestasPaginadas(todasLasRespuestasFiltradas());
        }).fail(function (xhr, status, error) {
            $('#respuestasContainer').html('<div class="col-12 text-center text-danger">No se pudo cargar la lista de respuestas.</div>');
            $('#paginacionRespuestasWrapper').hide();
            mostrarToastError('No se pudo cargar la lista de respuestas.');
        });
    }

    // --- Buscar respuestas (filtrado local, NO peticiones al backend) ---
    window.buscarRespuestas = function () {
        // Simplemente filtra localmente y repinta
        paginaActual = 1;
        renderRespuestasPaginadas(todasLasRespuestasFiltradas());
    };

    // Eventos para disparar la búsqueda al cambiar filtros
    $('#filtroTextoRespuesta').on('input', function () {
        window.buscarRespuestas();
    });
    $('#filtroRespuestasEvaluadas').on('change', function () {
        window.buscarRespuestas();
    });

    // Inicializar: cargar datos y mostrar
    cargarPreguntas(function () {
        $.get('http://localhost:8080/respuestas', function (data) {
            todasLasRespuestas = data;
            window.buscarRespuestas();
        }).fail(function () {
            $('#respuestasContainer').html('<div class="col-12 text-center text-danger">No se pudo cargar la lista de respuestas.</div>');
            $('#paginacionRespuestasWrapper').hide();
            mostrarToastError('No se pudo cargar la lista de respuestas.');
        });
    });

    // --- MODAL EVALUAR RESPUESTA ---
    let respuestaAEvaluar = null;
    $(document).on('click', '.respuesta-card', function () {
        // Obtener el índice de la tarjeta clickeada
        const idx = $(this).closest('.col-md-6, .col-lg-4').index();
        // Buscar la respuesta real en la página actual
        const respuestasPagina = todasLasRespuestas.slice((paginaActual - 1) * respuestasPorPagina, (paginaActual) * respuestasPorPagina);
        const r = respuestasPagina[idx];
        if (!r) return;
        respuestaAEvaluar = r;
        // Llenar el modal
        $('#modalEvaluarRespuesta h2').text('Evaluar');
        $('#evalPreguntaTexto').val((todasLasPreguntas.find(p => p.idPregunta === r.idPregunta)?.texto) || '');
        $('#evalRespuestaTexto').val(r.respuestaParticipante || '');
        $('#evalPuntuacion').val(typeof r.puntuacionObtenida === 'number' ? r.puntuacionObtenida : '');
        $('#modalEvaluarRespuesta .add-error-msg').remove();
        $('#modalEvaluarRespuesta').removeClass('d-none');
        $('body').addClass('modal-respuesta-open');
        const $dialog = $('#modalEvaluarRespuesta .modal-dialog');
        $dialog.removeClass('blur-out').addClass('blur-in');
        setTimeout(() => { $dialog.removeClass('blur-in'); }, 200);
    });
    // Botón cancelar o click fuera del modal
    $('#btnCancelarEvaluarRespuesta, #modalEvaluarRespuesta .modal-backdrop').on('click', function () {
        cerrarModalEvaluarRespuesta();
    });
    // Cerrar modal with Escape
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && !$('#modalEvaluarRespuesta').hasClass('d-none')) {
            cerrarModalEvaluarRespuesta();
        }
    });
    function cerrarModalEvaluarRespuesta() {
        const $dialog = $('#modalEvaluarRespuesta .modal-dialog');
        $dialog.removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $('#modalEvaluarRespuesta').addClass('d-none');
            $('body').removeClass('modal-respuesta-open');
            $dialog.removeClass('blur-out');
            respuestaAEvaluar = null;
        }, 400);
    }
    // Guardar evaluación
    $('#formEvaluarRespuesta').off('submit').on('submit', function (e) {
        e.preventDefault();
        if (!respuestaAEvaluar) return;
        const $btn = $('#formEvaluarRespuesta button[type="submit"]');
        const $errorMsg = $('#formEvaluarRespuesta .add-error-msg');
        $errorMsg.remove();
        $btn.prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...');
        const puntuacion = parseInt($('#evalPuntuacion').val(), 10);
        if (isNaN(puntuacion) || puntuacion < 0) {
            $('#formEvaluarRespuesta .add-error-msg').remove();
            $('#formEvaluarRespuesta').prepend('<div class="add-error-msg text-danger text-center mb-3">La puntuación debe ser un número válido.</div>');
            $btn.prop('disabled', false).html('<i class="fa fa-floppy-disk me-2"></i>Guardar');
            return;
        }
        $.ajax({
            url: `http://localhost:8080/respuestas/${respuestaAEvaluar.idRespuesta}/calificar`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ puntuacion: puntuacion }),
            success: function () {
                $btn.html('<span class="fa fa-check me-2" style="color:#fff;"></span>Guardado')
                    .removeClass('btn-primary').addClass('btn-success');
                $btn.css({ transition: 'background 0.4s, color 0.4s' });
                setTimeout(() => {
                    cerrarModalEvaluarRespuesta();
                    setTimeout(() => {
                        $btn.prop('disabled', false)
                            .removeClass('btn-success').addClass('btn-primary')
                            .html('<i class="fa fa-floppy-disk me-2"></i>Guardar');
                        cargarRespuestas();
                    }, 400);
                }, 800);
            },
            error: function (xhr) {
                let msg = 'Error al guardar la puntuación: ' + (xhr.responseJSON?.message || xhr.statusText);
                $('#formEvaluarRespuesta .add-error-msg').remove();
                $('#formEvaluarRespuesta').prepend('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                $btn.prop('disabled', false)
                    .removeClass('btn-success').addClass('btn-primary')
                    .html('<i class="fa fa-floppy-disk me-2"></i>Guardar');
            }
        });
    });

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

    function mostrarToastError(msg) {
        const toastEl = document.getElementById('errorToast');
        if (toastEl) {
            const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
            toast.show();
        }
    }
});