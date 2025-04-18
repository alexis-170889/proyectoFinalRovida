// Variables globales
let carrito = [];
let cotizacionesGuardadas = [];
let serviciosDisponibles = [];
let datosCliente = {
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    observaciones: ''
};

// Elementos del DOM
const DOM = {
    formulario: document.getElementById('form-cliente'),
    contenedorServicios: document.getElementById('contenedor-servicios'),
    resumen: document.getElementById('resumen'),
    exportarBtn: document.getElementById('exportar-pdf'),
    guardarBtn: document.getElementById('guardar-cotizacion'),
    listaCotizaciones: document.getElementById('lista-cotizaciones'),
    contadorObservaciones: document.getElementById('contador-observaciones'),
    inputObservaciones: document.getElementById('observaciones')
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarServicios();
    cargarCotizacionesGuardadas();
    configurarEventos();
});

// Configuración de eventos
function configurarEventos() {
    // Formulario
    DOM.formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarDatosCliente();
    });
    
    // Observaciones
    DOM.inputObservaciones.addEventListener('input', actualizarContador);
    
    // Botones
    DOM.exportarBtn.addEventListener('click', generarPDF);
    DOM.guardarBtn.addEventListener('click', guardarCotizacion);
    
    // Delegación de eventos
    DOM.contenedorServicios.addEventListener('click', manejarClickServicio);
    DOM.listaCotizaciones.addEventListener('click', manejarClickCotizaciones);
}

// Cargar servicios
async function cargarServicios() {
    try {
        const respuesta = await fetch('datos.json');
        const datos = await respuesta.json();
        serviciosDisponibles = datos.servicios;
        renderizarServicios();
    } catch (error) {
        mostrarError('Error al cargar los servicios');
        console.error(error);
    }
}

// Renderizar servicios
function renderizarServicios() {
    DOM.contenedorServicios.innerHTML = serviciosDisponibles.map(servicio => `
        <div class="servicio" data-id="${servicio.id}">
            <div class="servicio-info">
                <h3>${servicio.nombre}</h3>
                <p class="categoria">${servicio.categoria}</p>
                ${servicio.descripcion ? `<p class="descripcion">${servicio.descripcion}</p>` : ''}
            </div>
            <div class="servicio-acciones">
                <span class="precio">$${servicio.precio.toFixed(2)}</span>
                <button class="boton-primario">Agregar</button>
            </div>
        </div>
    `).join('');
}

// Manejar clicks en servicios
function manejarClickServicio(e) {
    if (e.target.classList.contains('boton-primario')) {
        const servicioDiv = e.target.closest('.servicio');
        const id = parseInt(servicioDiv.dataset.id);
        const servicio = serviciosDisponibles.find(s => s.id === id);
        
        if (servicio) {
            carrito.push({...servicio});
            actualizarResumen();
            mostrarExito(`${servicio.nombre} agregado al carrito`);
        }
    }
}

// Actualizar resumen
function actualizarResumen() {
    const subtotal = carrito.reduce((total, item) => total + item.precio, 0);
    const iva = subtotal * 0.21;
    const total = subtotal + iva;
    
    DOM.resumen.innerHTML = `
        <div class="resumen-item">
            <span>Subtotal sin IVA:</span>
            <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="resumen-item">
            <span>IVA (21%):</span>
            <span>$${iva.toFixed(2)}</span>
        </div>
        <div class="resumen-item total">
            <span>Total:</span>
            <span>$${total.toFixed(2)}</span>
        </div>
    `;
}

// Guardar datos del cliente
function guardarDatosCliente() {
    datosCliente = {
        nombre: document.getElementById('nombre-cliente').value.trim(),
        empresa: document.getElementById('empresa-cliente').value.trim(),
        email: document.getElementById('email-cliente').value.trim(),
        telefono: document.getElementById('telefono-cliente').value.trim(),
        observaciones: DOM.inputObservaciones.value.trim()
    };
    
    // Validación básica
    if (!datosCliente.nombre || !datosCliente.email) {
        mostrarError('Nombre y correo electrónico son obligatorios');
        return;
    }
    
    mostrarExito('Datos del cliente guardados');
}

// Actualizar contador
function actualizarContador() {
    const remaining = 500 - DOM.inputObservaciones.value.length;
    DOM.contadorObservaciones.textContent = `${DOM.inputObservaciones.value.length}/500 caracteres`;
    DOM.contadorObservaciones.style.color = remaining < 50 ? '#D32F2F' : '#FFC107';
}

// Generar PDF
function generarPDF() {
    if (carrito.length === 0) {
        mostrarError('Agrega servicios al carrito primero');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración
    doc.setFont('helvetica');
    doc.setTextColor(46, 90, 136);
    
    // Encabezado
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('COTIZACIÓN DE AUDITORÍA', 105, 20, { align: 'center' });
    
    // Datos del cliente
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    let y = 40;
    
    const clienteData = [
        `Cliente: ${datosCliente.nombre || 'No especificado'}`,
        `Empresa: ${datosCliente.empresa || 'No especificada'}`,
        `Email: ${datosCliente.email || 'No especificado'}`,
        ...(datosCliente.telefono ? [`Teléfono: ${datosCliente.telefono}`] : []),
        `Observaciones: ${datosCliente.observaciones || 'Ninguna'}`
    ];
    
    clienteData.forEach(line => {
        doc.text(line, 20, y);
        y += 8;
    });
    
    y += 4;
    
    // Línea separadora
    doc.setDrawColor(76, 175, 80);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 12;
    
    // Servicios
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('SERVICIOS COTIZADOS', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    carrito.forEach((item, index) => {
        if (y > 260) {
            doc.addPage();
            y = 20;
        }
        
        doc.text(`${index + 1}. ${item.nombre}`, 20, y);
        doc.text(`$${item.precio.toFixed(2)}`, 180, y, { align: 'right' });
        y += 8;
    });
    
    // Totales
    const subtotal = carrito.reduce((acc, item) => acc + item.precio, 0);
    const iva = subtotal * 0.21;
    const total = subtotal + iva;
    
    y = Math.max(y, 150);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    
    doc.text('Subtotal sin IVA:', 150, y);
    doc.text(`$${subtotal.toFixed(2)}`, 180, y, { align: 'right' });
    
    doc.text('IVA (21%):', 150, y + 10);
    doc.text(`$${iva.toFixed(2)}`, 180, y + 10, { align: 'right' });
    
    doc.setFontSize(13);
    doc.setTextColor(46, 90, 136);
    doc.text('Total:', 150, y + 20);
    doc.text(`$${total.toFixed(2)}`, 180, y + 20, { align: 'right' });
    
    // Guardar
    const nombreArchivo = `Cotización_${datosCliente.empresa || 'Auditoria'}_${new Date().toLocaleDateString('es').replace(/\//g, '-')}.pdf`;
    doc.save(nombreArchivo);
}

// Guardar cotización
function guardarCotizacion() {
    if (carrito.length === 0) {
        mostrarError('No hay servicios en el carrito');
        return;
    }
    
    if (!datosCliente.nombre || !datosCliente.email) {
        mostrarError('Complete los datos del cliente primero');
        return;
    }
    
    const cotizacion = {
        id: Date.now(),
        fecha: new Date().toLocaleString(),
        cliente: {...datosCliente},
        servicios: [...carrito],
        subtotal: carrito.reduce((acc, item) => acc + item.precio, 0),
        iva: carrito.reduce((acc, item) => acc + item.precio, 0) * 0.21,
        total: carrito.reduce((acc, item) => acc + item.precio, 0) * 1.21
    };
    
    cotizacionesGuardadas.unshift(cotizacion);
    localStorage.setItem('cotizaciones', JSON.stringify(cotizacionesGuardadas));
    renderizarCotizacionesGuardadas();
    mostrarExito('Cotización guardada correctamente');
}

// Cargar cotizaciones guardadas
function cargarCotizacionesGuardadas() {
    const guardadas = localStorage.getItem('cotizaciones');
    if (guardadas) {
        cotizacionesGuardadas = JSON.parse(guardadas);
        renderizarCotizacionesGuardadas();
    }
}

// Renderizar cotizaciones
function renderizarCotizacionesGuardadas() {
    DOM.listaCotizaciones.innerHTML = cotizacionesGuardadas.map(cotizacion => `
        <li class="cotizacion-item">
            <div class="cotizacion-info">
                <h3>${cotizacion.cliente.empresa || 'Sin nombre'}</h3>
                <p>${new Date(cotizacion.id).toLocaleDateString()}</p>
            </div>
            <div class="cotizacion-acciones">
                <span class="total">$${cotizacion.total.toFixed(2)}</span>
                <button class="boton-secundario" data-id="${cotizacion.id}">Ver</button>
            </div>
        </li>
    `).join('');
}

// Manejar clicks en cotizaciones
function manejarClickCotizaciones(e) {
    if (e.target.classList.contains('boton-secundario')) {
        const id = parseInt(e.target.dataset.id);
        const cotizacion = cotizacionesGuardadas.find(c => c.id === id);
        
        if (cotizacion) {
            mostrarDetalleCotizacion(cotizacion);
        }
    }
}

// Mostrar detalle de cotización
function mostrarDetalleCotizacion(cotizacion) {
    const serviciosHTML = cotizacion.servicios.map(serv => `
        <li class="servicio-detalle">
            <span>${serv.nombre}</span>
            <span>$${serv.precio.toFixed(2)}</span>
        </li>
    `).join('');

    Swal.fire({
        title: `Cotización #${cotizacion.id}`,
        html: `
            <div class="detalle-cotizacion">
                <div class="cliente-info">
                    <p><strong>Cliente:</strong> ${cotizacion.cliente.nombre}</p>
                    <p><strong>Empresa:</strong> ${cotizacion.cliente.empresa || 'N/A'}</p>
                    <p><strong>Fecha:</strong> ${new Date(cotizacion.id).toLocaleString()}</p>
                </div>
                
                <hr>
                
                <h4>Servicios:</h4>
                <ul class="lista-servicios">${serviciosHTML}</ul>
                
                <hr>
                
                <div class="resumen-total">
                    <p><strong>Subtotal:</strong> $${cotizacion.subtotal.toFixed(2)}</p>
                    <p><strong>IVA (21%):</strong> $${cotizacion.iva.toFixed(2)}</p>
                    <p class="total"><strong>Total:</strong> $${cotizacion.total.toFixed(2)}</p>
                </div>
                
                ${cotizacion.cliente.observaciones ? `
                <div class="observaciones">
                    <h4>Observaciones:</h4>
                    <p>${cotizacion.cliente.observaciones}</p>
                </div>
                ` : ''}
            </div>
        `,
        confirmButtonText: 'Cerrar',
        width: '800px'
    });
}

// Helpers
function mostrarExito(mensaje) {
    Swal.fire({
        title: 'Éxito',
        text: mensaje,
        icon: 'success',
        confirmButtonColor: '#4CAF50'
    });
}

function mostrarError(mensaje) {
    Swal.fire({
        title: 'Error',
        text: mensaje,
        icon: 'error',
        confirmButtonColor: '#D32F2F'
    });
}