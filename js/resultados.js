// Renderiza los ganadores por categoría
function renderWinners(data) {
    const winnersContent = document.getElementById('winners-content');
    if (!data || (!data.ganadorCompetencia && !data.ganadorJunior)) {
        winnersContent.innerHTML = '<p>No hay ganadores registrados aún.</p>';
        return;
    }
    let html = '<div class="winners-grid">';
    if (data.ganadorCompetencia) {
        html += `
            <div class="winner-item">
                <h3><i class="fas fa-crown" style="color: gold;"></i> Competencia</h3>
                <p><strong>${data.ganadorCompetencia.nombreEquipo}</strong></p>
                <p class="team-score">${data.ganadorCompetencia.totalPuntos} pts</p>
            </div>
        `;
    }
    if (data.ganadorJunior) {
        html += `
            <div class="winner-item">
                <h3><i class="fas fa-crown" style="color: silver;"></i> Junior</h3>
                <p><strong>${data.ganadorJunior.nombreEquipo}</strong></p>
                <p class="team-score">${data.ganadorJunior.totalPuntos} pts</p>
            </div>
        `;
    }
    html += '</div>';
    winnersContent.innerHTML = html;
}

// Renderiza la lista de equipos para una categoría
function renderTeamList(teams, containerId) {
    const container = document.getElementById(containerId);
    if (!teams || teams.length === 0) {
        container.innerHTML = '<p>No hay equipos registrados en esta categoría.</p>';
        return;
    }
    let html = '<ul class="team-list">';
    teams.forEach((team, index) => {
        let badge = '';
        if (index === 0) badge = '<span class="badge badge-gold">1°</span>';
        else if (index === 1) badge = '<span class="badge badge-silver">2°</span>';
        else if (index === 2) badge = '<span class="badge badge-bronze">3°</span>';
        html += `
            <li class="team-item">
                <span class="team-name">${team.nombreEquipo} ${badge}</span>
                <span class="team-score">${team.totalPuntos} pts</span>
            </li>
        `;
    });
    html += '</ul>';
    container.innerHTML = html;
}

// Renderiza el top 3 de preguntas más puntuadas (junior)
function renderTopQuestions(questions) {
    const container = document.getElementById('top-preguntas-content');
    if (!questions || questions.length === 0) {
        container.innerHTML = '<p>No hay datos de preguntas disponibles.</p>';
        return;
    }
    let html = '<div class="top-preguntas">';
    questions.forEach((question, index) => {
        let medal = '';
        if (index === 0) medal = '<i class="fas fa-medal" style="color: gold;"></i>';
        else if (index === 1) medal = '<i class="fas fa-medal" style="color: silver;"></i>';
        else if (index === 2) medal = '<i class="fas fa-medal" style="color: #cd7f32;"></i>';
        html += `
            <div class="pregunta-item">
                <div class="pregunta-text">
                    ${medal} <strong>#${index + 1}</strong> - ${question.texto}
                </div>
                <span class="pregunta-score">${question.totalPuntos || question.puntuacion_total || question.puntuacionTotal || question.puntuacion} pts</span>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

// Renderiza el país con mayor puntuación
function renderTopCountry(country) {
    const container = document.getElementById('top-pais-content');
    if (!country) {
        container.innerHTML = '<p>No hay datos de países disponibles.</p>';
        return;
    }
    const flagEmoji = {
        'México': '🇲🇽',
        'Estados Unidos': '🇺🇸',
        'Canadá': '🇨🇦',
        'Brasil': '🇧🇷',
        'Argentina': '🇦🇷',
        'España': '🇪🇸'
    }[country.nombrePais] || '🌍';
    container.innerHTML = `
        <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">${flagEmoji}</div>
            <h3 style="margin-bottom: 0.5rem;">${country.nombrePais}</h3>
            <p style="font-size: 1.5rem; color: var(--secondary); font-weight: bold;">
                ${country.totalPuntos} puntos
            </p>
            <p style="margin-top: 0.5rem; color: var(--success);">
                <i class="fas fa-trophy"></i> País con mayor puntuación
            </p>
        </div>
    `;
}

// Renderiza la región con mayor puntuación
function renderTopRegion(region) {
    const container = document.getElementById('top-region-content');
    if (!region) {
        container.innerHTML = '<p>No hay datos de regiones disponibles.</p>';
        return;
    }
    container.innerHTML = `
        <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">
                <i class="fas fa-globe-americas"></i>
            </div>
            <h3 style="margin-bottom: 0.5rem;">${region.nombreRegion}</h3>
            <p style="font-size: 1.5rem; color: var(--secondary); font-weight: bold;">
                ${region.totalPuntos} puntos
            </p>
            <p style="margin-top: 0.5rem; color: var(--success);">
                <i class="fas fa-award"></i> Región con mayor puntuación
            </p>
        </div>
    `;
}

// Función para mostrar un spinner de carga
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
}

// Función para mostrar un mensaje de error
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="alert alert-danger">${message}</div>`;
    }
}

// Carga todos los datos desde los endpoints
async function loadData() {
    // Mostrar loading en todos los contenedores
    showLoading('winners-content');
    showLoading('competencia-content');
    showLoading('junior-content');
    showLoading('top-preguntas-content');
    showLoading('top-pais-content');
    showLoading('top-region-content');

    try {
        // Peticiones paralelas
        const [ganadoresRes, competenciaRes, juniorRes, topPreguntasRes, paisRes, regionRes] = await Promise.all([
            fetch('http://localhost:8080/resultados/ganadores'),
            fetch('http://localhost:8080/resultados/competencia'),
            fetch('http://localhost:8080/resultados/junior'),
            fetch('http://localhost:8080/resultados/top-preguntas-junior'),
            fetch('http://localhost:8080/resultados/pais-mayor-puntuacion'),
            fetch('http://localhost:8080/resultados/region-mayor-puntuacion')
        ]);

        // Parsear JSON
        const [ganadores, competencia, junior, topPreguntas, pais, region] = await Promise.all([
            ganadoresRes.ok ? ganadoresRes.json() : null,
            competenciaRes.ok ? competenciaRes.json() : [],
            juniorRes.ok ? juniorRes.json() : [],
            topPreguntasRes.ok ? topPreguntasRes.json() : [],
            paisRes.ok ? paisRes.json() : null,
            regionRes.ok ? regionRes.json() : null
        ]);

        renderWinners(ganadores);
        renderTeamList(competencia, 'competencia-content');
        renderTeamList(junior, 'junior-content');
        renderTopQuestions(topPreguntas);
        renderTopCountry(pais);
        renderTopRegion(region);
    } catch (e) {
        showError('winners-content', 'Error al cargar los ganadores.');
        showError('competencia-content', 'Error al cargar los equipos de Competencia.');
        showError('junior-content', 'Error al cargar los equipos Junior.');
        showError('top-preguntas-content', 'Error al cargar el top de preguntas.');
        showError('top-pais-content', 'Error al cargar el país destacado.');
        showError('top-region-content', 'Error al cargar la región destacada.');
    }
}

// Manejo de pestañas
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupTabs();
});
