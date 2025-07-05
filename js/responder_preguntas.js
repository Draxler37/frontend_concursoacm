// Variables globales
let preguntasAsignadas = [];
let respuestasParticipante = [];
let preguntaSeleccionada = null;
const idParticipante = localStorage.getItem('participantId');

// Cargar preguntas asignadas al participante y sus respuestas
function cargarDatosParticipante() {
    // Cargar preguntas asignadas
    fetch(`http://localhost:8080/equipos-preguntas/participante/${idParticipante}`)
        .then(res => res.json())
        .then(data => {
            preguntasAsignadas = data.preguntas;
            // Luego cargar las respuestas
            return fetch(`http://localhost:8080/respuestas/participante/${idParticipante}`);
        })
        .then(res => res.ok ? res.json() : [])
        .then(respuestas => {
            respuestasParticipante = respuestas;
            renderPreguntasAsignadas();
        })
        .catch(() => mostrarMensaje('No se pudieron cargar los datos.', 'error'));
}

// Renderizar la lista de preguntas
function renderPreguntasAsignadas() {
    const lista = document.getElementById('preguntas-list');
    const noPreguntas = document.getElementById('no-preguntas');
    lista.innerHTML = '';

    if (!preguntasAsignadas.length) {
        noPreguntas.style.display = '';
        return;
    }

    noPreguntas.style.display = 'none';

    preguntasAsignadas.forEach(p => {
        const li = document.createElement('li');
        li.className = 'question-item';
        li.textContent = p.texto || `Pregunta #${p.idPregunta}`;
        li.onclick = () => seleccionarPregunta(p);

        // Verificar si la pregunta ya fue respondida
        const respuesta = respuestasParticipante.find(r => r.idPregunta === p.idPregunta);
        if (respuesta) {
            li.classList.add('answered');
            li.innerHTML += ' <i class="fas fa-check-circle" style="color: #6c757d; margin-left: 8px;"></i>';
            li.style.cursor = 'default';
        } else {
            li.style.cursor = 'pointer';
        }

        lista.appendChild(li);
    });

    const userRole = localStorage.getItem('userRole');
    if (userRole === 'JEFE_DELEGACION' && window.handleDelegationChief) {
        window.handleDelegationChief();
    }
    else if (userRole === 'PARTICIPANTE' && window.handleParticipant) {
        window.handleParticipant();
    }
}

// Seleccionar una pregunta para responder
function seleccionarPregunta(pregunta) {
    preguntaSeleccionada = pregunta;
    document.getElementById('pregunta-seleccionada').textContent = pregunta.texto;
    document.getElementById('form-respuesta').style.display = '';
    document.getElementById('estado-respuesta').textContent = '';

    // Buscar si ya existe una respuesta para esta pregunta
    const respuestaExistente = respuestasParticipante.find(r => r.idPregunta === pregunta.idPregunta);
    const respuestaTextarea = document.getElementById('respuesta');
    const submitButton = document.querySelector('#form-respuesta button[type="submit"]');

    if (respuestaExistente) {
        // Cargar respuesta existente
        respuestaTextarea.value = respuestaExistente.respuestaParticipante;
        // Deshabilitar edición
        respuestaTextarea.disabled = true;
        submitButton.disabled = true;
        submitButton.textContent = 'Respuesta ya enviada';
        submitButton.style.backgroundColor = '#6c757d'; // Color gris para indicar deshabilitado
    } else {
        // Permitir nueva respuesta
        respuestaTextarea.value = '';
        respuestaTextarea.disabled = false;
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar Respuesta';
        submitButton.style.backgroundColor = '#150B63'; // Color original
    }
}

// Enviar respuesta al backend
document.getElementById('form-respuesta').onsubmit = function (e) {
    e.preventDefault();
    if (!preguntaSeleccionada) return;

    const respuesta = document.getElementById('respuesta').value.trim();
    if (!respuesta) return;

    fetch(`http://localhost:8080/respuestas/responder/${idParticipante}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            idPregunta: preguntaSeleccionada.idPregunta,
            respuestaParticipante: respuesta
        })
    })
        .then(res => res.ok ? res.json() : res.text().then(msg => Promise.reject(msg)))
        .then(respuestaDTO => {
            mostrarMensaje('Respuesta enviada correctamente.', 'success');
            // Actualizar las respuestas locales
            const index = respuestasParticipante.findIndex(r => r.idPregunta === preguntaSeleccionada.idPregunta);
            if (index >= 0) {
                respuestasParticipante[index] = respuestaDTO;
            } else {
                respuestasParticipante.push(respuestaDTO);
            }
            // Volver a renderizar para actualizar el estado visual
            renderPreguntasAsignadas();
        })
        .catch(msg => mostrarMensaje(msg || 'Error al enviar respuesta.', 'error'));
};

function mostrarMensaje(msg, tipo) {
    const estado = document.getElementById('estado-respuesta');
    estado.textContent = msg;
    estado.className = 'response-status ' + (tipo === 'success' ? 'success' : 'error');
}

// Inicialización
document.addEventListener('DOMContentLoaded', cargarDatosParticipante);