const estado = document.getElementById('estado');
const contenido = document.getElementById('contenido');
const consultaActual = document.getElementById('consultaActual');
const botones = Array.from(document.querySelectorAll('button'));
const API_BASE = window.location.port === '3000' ? '' : 'http://localhost:3000';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatHeader(key) {
  return key.replaceAll('_', ' ');
}

function setStatus(texto, tipo) {
  estado.textContent = texto;
  estado.className = `status-chip status-${tipo}`;
}

function setLoading(activo) {
  botones.forEach((boton) => {
    boton.disabled = activo;
  });
  document.body.classList.toggle('is-loading', activo);
}

function renderTabla(titulo, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return `<div class="bloque"><h3>${escapeHtml(titulo)}</h3><p>Sin resultados.</p></div>`;
  }

  const headers = Object.keys(rows[0]);
  const head = headers.map((h) => `<th>${escapeHtml(formatHeader(h))}</th>`).join('');
  const body = rows
    .map((row) => {
      const cells = headers.map((h) => `<td>${escapeHtml(row[h] ?? '')}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `
    <div class="bloque">
      <h3>${escapeHtml(titulo)}</h3>
      <div class="table-wrap">
        <table>
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderObjeto(titulo, row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return `<div class="bloque"><h3>${escapeHtml(titulo)}</h3><p>Sin resultados.</p></div>`;
  }
  return renderTabla(titulo, [row]);
}

function renderError(mensaje) {
  return `<p class="error-message">${escapeHtml(mensaje)}</p>`;
}

async function consultar(url, nombreConsulta, renderFn) {
  consultaActual.textContent = nombreConsulta;
  setLoading(true);
  setStatus('Cargando...', 'loading');

  try {
    const res = await fetch(`${API_BASE}${url}`);
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : { error: 'La respuesta no es JSON.' };

    if (res.status >= 500) {
      setStatus(`HTTP ${res.status}`, 'error');
    } else if (res.status >= 400) {
      setStatus(`HTTP ${res.status}`, 'warning');
    } else {
      setStatus(`HTTP ${res.status}`, 'success');
    }

    contenido.innerHTML = renderFn(data, res.status);
  } catch (error) {
    setStatus('Sin conexion', 'error');
    contenido.innerHTML = renderError(error.message || 'No fue posible conectar con la API.');
  } finally {
    setLoading(false);
  }
}

document.getElementById('btnConductores').addEventListener('click', () => {
  consultar('/conductores', 'GET /conductores', (data) => renderTabla('Conductores', data));
});

document.getElementById('btnAutomoviles').addEventListener('click', () => {
  consultar('/automóviles', 'GET /automóviles', (data) => renderTabla('Automóviles', data));
});

document.getElementById('btnSinAutoEdad').addEventListener('click', () => {
  const edad = document.getElementById('edad').value.trim();
  consultar(`/conductoressinauto?edad=${encodeURIComponent(edad)}`, 'GET /conductoressinauto?edad=', (data, status) => {
    if (status >= 400) {
      return renderError(data.error || 'Error de consulta');
    }
    return renderTabla('Conductores sin auto', data);
  });
});

document.getElementById('btnSolitos').addEventListener('click', () => {
  consultar('/solitos', 'GET /solitos', (data, status) => {
    if (status >= 400) {
      return renderError(data.error || 'Error de consulta');
    }

    return [
      renderTabla('Conductores sin automovil', data.conductoresSinAutomovil || []),
      renderTabla('Automoviles sin conductor', data.automovilesSinConductor || [])
    ].join('');
  });
});

document.getElementById('btnAutoPatente').addEventListener('click', () => {
  const patente = document.getElementById('patente').value.trim().toUpperCase();
  consultar(`/auto?patente=${encodeURIComponent(patente)}`, 'GET /auto?patente=', (data, status) => {
    if (status >= 400) {
      return renderError(data.error || 'Error de consulta');
    }
    return renderObjeto('Automovil por patente', data);
  });
});

document.getElementById('btnAutoInicio').addEventListener('click', () => {
  const inicio = document.getElementById('inicioPatente').value.trim().toUpperCase();
  consultar(`/auto?iniciopatente=${encodeURIComponent(inicio)}`, 'GET /auto?iniciopatente=', (data, status) => {
    if (status >= 400) {
      return renderError(data.error || 'Error de consulta');
    }
    return renderTabla('Automoviles por inicio patente', data);
  });
});
