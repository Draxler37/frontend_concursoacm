$(document).ready(function () {
    const loginForm = $('#loginForm');
    const isParticipantCheckbox = $('#isParticipant');
    const passwordField = $('#password');
    const errorToast = new bootstrap.Toast($('#errorToast'));
    const loginBtn = $('#loginBtn');
    const loginBtnText = $('#loginBtnText');
    const loginSpinner = $('#loginSpinner');

    // Deshabilitar el campo de contraseña si el checkbox está marcado
    isParticipantCheckbox.change(function () {
        if (this.checked) {
            passwordField.val('').prop('disabled', true);
        } else {
            passwordField.prop('disabled', false);
        }
    });

    // Validación del formulario
    loginForm.on('submit', function (e) {
        e.preventDefault();
        if (!this.checkValidity()) {
            e.stopPropagation();
            $(this).addClass('was-validated');
            return;
        }

        // Mostrar spinner y ocultar texto
        loginBtnText.hide();
        loginSpinner.show();
        loginBtn.prop('disabled', true);

        const username = $('#username').val();
        const password = passwordField.val();
        const isParticipant = isParticipantCheckbox.is(':checked');

        const restoreButton = function () {
            loginSpinner.hide();
            loginBtnText.show();
            loginBtn.prop('disabled', false);
        };

        const ajaxOptions = {
            timeout: 3000,
            error: function (xhr, textStatus) {
                restoreButton();
                if (textStatus === 'timeout' || xhr.status === 0) {
                    errorToast.show();
                } else if (xhr.status === 401) {
                    $('#errorMessage').text('Credenciales inválidas').show();
                } else {
                    errorToast.show();
                }
            }
        };

        if (isParticipant) {
            $.ajax(Object.assign({}, ajaxOptions, {
                url: `http://localhost:8080/auth/validar?nombre=${username}`,
                method: 'GET',
                success: function (response) {
                    if (response) {
                        localStorage.setItem('isAuthenticated', 'true');
                        localStorage.setItem('userRole', 'PARTICIPANTE');
                        localStorage.setItem('participantId', response);
                        window.location.href = 'index.html';
                    } else {
                        restoreButton();
                        $('#errorMessage').text('Credenciales inválidas').show();
                    }
                }
            }));
        } else {
            if (username === 'admin' && password === 'admin') {
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('userRole', 'ADMINISTRADOR');
                window.location.href = 'index.html';
            } else {
                const credentials = btoa(`${username}:${password}`);
                $.ajax(Object.assign({}, ajaxOptions, {
                    url: 'http://localhost:8080/auth/login',
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/json',
                    },
                    success: function (response) {
                        if (response) {
                            localStorage.setItem('isAuthenticated', 'true');
                            localStorage.setItem('userRole', 'JEFE_DELEGACION');
                            localStorage.setItem('authToken', credentials);
                            localStorage.setItem('username', username);
                            window.location.href = 'index.html';
                        } else {
                            restoreButton();
                            $('#errorMessage').text('Credenciales inválidas').show();
                        }
                    }
                }));
            }
        }
    });
});