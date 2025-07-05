$(function () {
    let todasLasRegiones = [];
    let regionAEliminar = null;
    let paisAEliminar = null;

    // --- Renderizado de tarjetas de regiones ---
    function renderRegiones(regiones) {
        const container = document.getElementById('regionesContainer');
        container.innerHTML = '';
        if (!regiones || regiones.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted">No se encontraron regiones.</div>';
            document.body.classList.remove('animating-regiones');
            return;
        }
        document.body.classList.add('animating-regiones');
        let animCount = regiones.length;
        regiones.forEach((region, idx) => {
            const card = document.createElement('div');
            card.className = 'col-12';
            card.innerHTML = `
                <div class="region-card animate__animated animate__fadeInUp" style="animation-delay:${idx * 60}ms;">
                    <div class="region-card-header d-flex justify-content-between align-items-center region-header-click" data-region-id="${region.idRegion}" style="cursor:pointer;">
                        <span class="region-id">ID: ${region.idRegion}</span>
                        <span class="region-name flex-grow-1 ms-3">${region.nombreRegion}</span>
                        <div class="region-actions d-flex gap-2">
                            <button class="btn btn-sm btn-light border shadow-sm btn-edit-region" title="Editar" data-id="${region.idRegion}" data-name="${region.nombreRegion}"><i class="fa fa-pen"></i></button>
                            <button class="btn btn-sm btn-light border shadow-sm btn-delete-region" title="Eliminar" data-id="${region.idRegion}" data-name="${region.nombreRegion}"><i class="fa fa-trash"></i></button>
                        </div>
                        <i class="fa fa-chevron-right ms-2 toggle-icon"></i>
                    </div>
                    <div class="countries-collapse" id="collapseRegion${region.idRegion}" style="display:none;">
                        <div class="card-body">
                            <h6>Países en esta región:</h6>
                            <ul class="countries-list mb-0" id="countriesList${region.idRegion}">
                                <li class="no-countries">Cargando países...</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            card.querySelector('.region-card').addEventListener('animationend', function () {
                animCount--;
                if (animCount === 0) {
                    document.body.classList.remove('animating-regiones');
                }
            }, { once: true });
            container.appendChild(card);
            // Cargar países para la región (pero no mostrar hasta expandir)
            $.get('http://localhost:8080/paises', { regionId: region.idRegion }).done(function (paises) {
                const ul = document.getElementById(`countriesList${region.idRegion}`);
                if (paises && paises.length > 0) {
                    ul.innerHTML = paises.map(p => `
                        <li class="d-flex align-items-center justify-content-between gap-2">
                            <span><i class='fas fa-map-marker-alt'></i>${p.nombrePais}</span>
                            <span class="pais-actions d-flex gap-1">
                                <button class="btn btn-sm btn-light border shadow-sm btn-edit-pais" title="Editar" data-id="${p.idPais}" data-name="${p.nombrePais}"><i class="fa fa-pen"></i></button>
                                <button class="btn btn-sm btn-light border shadow-sm btn-delete-pais" title="Eliminar" data-id="${p.idPais}" data-name="${p.nombrePais}"><i class="fa fa-trash"></i></button>
                            </span>
                        </li>`).join('');
                } else {
                    ul.innerHTML = '<li class="no-countries">No hay países registrados para esta región.</li>';
                }
                // Agregar botón para añadir país al final del card body
                const addBtnHtml = `<div class="add-country-container mt-3 pt-3 border-top">
                    <button class="btn btn-sm btn-success btn-add-pais" data-region-id="${region.idRegion}" title="Añadir un nuevo país a esta región">
                        <i class="fa fa-plus me-1"></i> Añadir País
                    </button>
                </div>`;
                ul.parentElement.insertAdjacentHTML('beforeend', addBtnHtml);
            }).fail(function () {
                const ul = document.getElementById(`countriesList${region.idRegion}`);
                if (ul) ul.innerHTML = '<li class="no-countries text-danger">Error al cargar países.</li>';
            });
        });
        // Evento para expandir/colapsar países con animación
        $(container).off('click', '.region-header-click').on('click', '.region-header-click', function () {
            const regionId = $(this).data('region-id');
            const $collapse = $(`#collapseRegion${regionId}`);
            const $icon = $(this).find('.toggle-icon');
            if ($collapse.is(':visible')) {
                $collapse.slideUp(200);
                $icon.removeClass('rotated');
            } else {
                $collapse.slideDown(200);
                $icon.addClass('rotated');
            }
        });
        // Evento editar/eliminar región
        $(container).off('click', '.btn-edit-region').on('click', '.btn-edit-region', function (e) {
            e.stopPropagation();
            const id = $(this).data('id');
            const nombre = $(this).data('name');
            $('#editRegionId').val(id);
            $('#editRegionName').val(nombre);
            $('#modalEditarRegion').modal('show');
        });
        $(container).off('click', '.btn-delete-region').on('click', '.btn-delete-region', function (e) {
            e.stopPropagation();
            const id = $(this).data('id');
            const nombre = $(this).data('name');
            mostrarModalEliminarRegion(nombre, id);
        });
        // Evento editar/eliminar país
        $(container).off('click', '.btn-edit-pais').on('click', '.btn-edit-pais', function (e) {
            e.stopPropagation();
            const id = $(this).data('id');
            // Limpia el formulario
            $('#formEditarPais .add-error-msg').remove();
            $('#editPaisId').val('');
            $('#editPaisName').val('');
            $('#editPaisCodigo').val('');
            $('#editPaisRegionId').val('');
            $('#editPaisRegionName').val('');
            // Pide los datos completos al backend
            $.get(`http://localhost:8080/paises/${id}`, function (data) {
                $('#editPaisId').val(data.idPais);
                $('#editPaisName').val(data.nombrePais || '');
                $('#editPaisCodigo').val(data.codigoTelefonico || '');
                // Busca la región en todasLasRegiones para mostrar el nombre
                let regionNombre = '';
                let regionId = '';
                for (const reg of todasLasRegiones) {
                    if (reg.nombreRegion === data.nombreRegion || reg.idRegion == data.idRegion) {
                        regionNombre = reg.nombreRegion;
                        regionId = reg.idRegion;
                        break;
                    }
                }
                $('#editPaisRegionId').val(regionId || data.idRegion || '');
                $('#editPaisRegionName').val(regionNombre || data.nombreRegion || '');
                $('#modalEditarPais').modal('show');
            });
        });
        $(container).off('click', '.btn-delete-pais').on('click', '.btn-delete-pais', function (e) {
            e.stopPropagation();
            const id = $(this).data('id');
            mostrarModalEliminarPais(id);
        });
    }

    // --- Cargar regiones desde backend ---
    function buscarRegiones() {
        $.get('http://localhost:8080/regiones', function (data) {
            todasLasRegiones = data;
            renderRegiones(todasLasRegiones);
        });
    }

    // Mostrar modal de eliminar región
    function mostrarModalEliminarRegion(nombre, id) {
        regionAEliminar = id;
        $('#nombreRegionAEliminar').text(nombre);
        const $modal = $('#modalEliminarRegion');
        $modal.removeClass('d-none');
        $('body').addClass('modal-eliminar-region-open');
        const $dialog = $modal.find('.modal-dialog');
        $dialog.removeClass('blur-out').addClass('blur-in');
        setTimeout(() => { $dialog.removeClass('blur-in'); }, 200);
    }

    $('#btnCancelarEliminarRegion, #modalEliminarRegion .modal-backdrop').on('click', function () {
        cerrarModalEliminarRegion();
    });

    function cerrarModalEliminarRegion() {
        const $modal = $('#modalEliminarRegion');
        const $dialog = $modal.find('.modal-dialog');
        $dialog.removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $modal.addClass('d-none');
            $('body').removeClass('modal-eliminar-region-open');
            $dialog.removeClass('blur-out');
            regionAEliminar = null;
        }, 400);
    }

    $('#btnConfirmarEliminarRegion').on('click', function () {
        if (!regionAEliminar) return;
        $('#btnConfirmarEliminarRegion').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Eliminando...');
        $.ajax({
            url: `http://localhost:8080/regiones/${regionAEliminar}`,
            method: 'DELETE',
            success: function () {
                cerrarModalEliminarRegion();
                setTimeout(() => { buscarRegiones(); }, 400);
            },
            error: function () {
                cerrarModalEliminarRegion();
                alert('Error al eliminar la región.');
            },
            complete: function () {
                $('#btnConfirmarEliminarRegion').prop('disabled', false).html('<i class="fa fa-trash me-2"></i>Eliminar');
            }
        });
    });

    // Mostrar modal de eliminar país
    function mostrarModalEliminarPais(id) {
        paisAEliminar = id;
        $('#modalEliminarPais').removeClass('d-none');
        $('body').addClass('modal-eliminar-region-open');
        const $dialog = $('#modalEliminarPais .modal-dialog');
        $dialog.removeClass('blur-out').addClass('blur-in');
        setTimeout(() => { $dialog.removeClass('blur-in'); }, 200);
    }

    $('#btnCancelarEliminarPais, #modalEliminarPais .modal-backdrop').on('click', function () {
        cerrarModalEliminarPais();
    });

    function cerrarModalEliminarPais() {
        const $modal = $('#modalEliminarPais');
        const $dialog = $modal.find('.modal-dialog');
        $dialog.removeClass('blur-in').addClass('blur-out');
        setTimeout(() => {
            $modal.addClass('d-none');
            $('body').removeClass('modal-eliminar-region-open');
            $dialog.removeClass('blur-out');
            paisAEliminar = null;
        }, 400);
    }

    $('#btnConfirmarEliminarPais').on('click', function () {
        if (!paisAEliminar) return;
        $('#btnConfirmarEliminarPais').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Eliminando...');
        $.ajax({
            url: `http://localhost:8080/paises/${paisAEliminar}`,
            method: 'DELETE',
            success: function () {
                cerrarModalEliminarPais();
                setTimeout(() => { buscarRegiones(); }, 400);
            },
            error: function () {
                cerrarModalEliminarPais();
                alert('Error al eliminar el país.');
            },
            complete: function () {
                $('#btnConfirmarEliminarPais').prop('disabled', false).html('<i class="fa fa-trash me-2"></i>Eliminar');
            }
        });
    });

    $('#btnGuardarRegion').on('click', function () {
        const id = $('#editRegionId').val();
        const nombre = $('#editRegionName').val();
        if (!nombre.trim()) {
            alert('El nombre de la región no puede estar vacío.');
            return;
        }
        $('#btnGuardarRegion').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...');
        $.ajax({
            url: `http://localhost:8080/regiones/${id}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ idRegion: id, nombreRegion: nombre }),
            success: function () {
                $('#modalEditarRegion').modal('hide');
                setTimeout(() => { buscarRegiones(); }, 400);
            },
            error: function () {
                alert('Error al actualizar la región.');
            },
            complete: function () {
                $('#btnGuardarRegion').prop('disabled', false).html('Guardar cambios');
            }
        });
    });

    $('#btnGuardarPais').on('click', function () {
        const id = $('#editPaisId').val();
        const nombre = $('#editPaisName').val();
        const codigo = $('#editPaisCodigo').val();
        const regionId = $('#editPaisRegionId').val();
        $('#formEditarPais .add-error-msg').remove();
        if (!nombre.trim() || !codigo.trim() || !regionId) {
            $('#formEditarPais').prepend('<div class="add-error-msg text-danger text-center mb-3">Todos los campos son obligatorios.</div>');
            return;
        }
        $('#btnGuardarPais').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...');
        $.ajax({
            url: `http://localhost:8080/paises/${id}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                nombrePais: nombre,
                codigoTelefonico: codigo,
                region: { idRegion: regionId }
            }),
            success: function () {
                $('#modalEditarPais').modal('hide');
                setTimeout(() => { buscarRegiones(); }, 400);
            },
            error: function (xhr) {
                let msg = 'Error al actualizar país: ' + (xhr.responseJSON?.message || xhr.statusText);
                $('#formEditarPais .add-error-msg').remove();
                const $modalContent = $('#modalEditarPais .modal-content');
                const $dFlex = $modalContent.find('.d-flex:has(button[type="submit"])').first();
                if ($dFlex.length) {
                    $dFlex.before('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                } else {
                    $modalContent.prepend('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                }
                if (xhr.status === 0 && typeof mostrarToastError === 'function') {
                    mostrarToastError();
                }
            },
            complete: function () {
                $('#btnGuardarPais').prop('disabled', false).html('Guardar cambios');
            }
        });
    });

    // Mostrar modal al hacer click en "Añadir"
    $('#btnAsignarTodos').on('click', function () {
        $('#crearRegionNombre').val('');
        $('#modalCrearRegion').modal('show');
    });

    // Crear región al confirmar
    $('#btnCrearRegion').on('click', function () {
        const nombre = $('#crearRegionNombre').val();
        $('#formCrearRegion .add-error-msg').remove();
        if (!nombre.trim()) {
            $('#formCrearRegion').prepend('<div class="add-error-msg text-danger text-center mb-3">El nombre de la región no puede estar vacío.</div>');
            return;
        }
        $('#btnCrearRegion').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creando...');
        $.ajax({
            url: 'http://localhost:8080/regiones',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ nombreRegion: nombre }),
            success: function () {
                $('#modalCrearRegion').modal('hide');
                buscarRegiones();
            },
            error: function (xhr) {
                let msg = 'Error al crear región: ' + (xhr.responseJSON?.message || xhr.statusText);
                $('#formCrearRegion .add-error-msg').remove();
                const $modalContent = $('#modalCrearRegion .modal-content');
                const $dFlex = $modalContent.find('.d-flex:has(button[type=\"submit\"])').first();
                if ($dFlex.length) {
                    $dFlex.before('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                } else {
                    $modalContent.prepend('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                }
                if (xhr.status === 0 && typeof mostrarToastError === 'function') {
                    mostrarToastError();
                }
            },
            complete: function () {
                $('#btnCrearRegion').prop('disabled', false).html('Crear');
            }
        });
    });

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

    // Mostrar modal al hacer click en "Añadir País"
    $(document).on('click', '.btn-add-pais', function () {
        const regionId = $(this).data('region-id');
        $('#crearPaisRegionId').val(regionId);
        $('#crearPaisNombre').val('');
        $('#crearPaisCodigo').val('');
        $('#formCrearPais .add-error-msg').remove();
        $('#modalCrearPais').modal('show');
    });

    // Crear país al confirmar
    $('#btnCrearPais').on('click', function () {
        const nombre = $('#crearPaisNombre').val();
        const codigo = $('#crearPaisCodigo').val();
        const regionId = $('#crearPaisRegionId').val();
        $('#formCrearPais .add-error-msg').remove();
        if (!nombre.trim() || !codigo.trim()) {
            $('#formCrearPais').prepend('<div class="add-error-msg text-danger text-center mb-3">Todos los campos son obligatorios.</div>');
            return;
        }
        $('#btnCrearPais').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creando...');
        $.ajax({
            url: 'http://localhost:8080/paises',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                nombrePais: nombre,
                codigoTelefonico: codigo,
                region: { idRegion: regionId }
            }),
            success: function () {
                $('#modalCrearPais').modal('hide');
                buscarRegiones();
            },
            error: function (xhr) {
                let msg = 'Error al crear país: ' + (xhr.responseJSON?.message || xhr.statusText);
                $('#formCrearPais .add-error-msg').remove();
                const $modalContent = $('#modalCrearPais .modal-content');
                const $dFlex = $modalContent.find('.d-flex:has(button[type="submit"])').first();
                if ($dFlex.length) {
                    $dFlex.before('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                } else {
                    $modalContent.prepend('<div class="add-error-msg text-danger text-center mb-3">' + msg + '</div>');
                }
                if (xhr.status === 0 && typeof mostrarToastError === 'function') {
                    mostrarToastError();
                }
            },
            complete: function () {
                $('#btnCrearPais').prop('disabled', false).html('Crear');
            }
        });
    });

    // Buscar regiones por nombre al escribir en el filtro
    $('#filtroNombreRegion').on('input', function () {
        const filtro = $(this).val().toLowerCase();
        if (!filtro) {
            renderRegiones(todasLasRegiones);
            return;
        }
        const regionesFiltradas = todasLasRegiones.filter(r =>
            r.nombreRegion && r.nombreRegion.toLowerCase().includes(filtro)
        );
        renderRegiones(regionesFiltradas);
    });

    // Inicializar
    buscarRegiones();
});