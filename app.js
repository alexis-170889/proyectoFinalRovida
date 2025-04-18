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
    contadorObservaciones: document.getElementById('contador-observaciones')
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
    DOM.formulario.addEventListener('submit', guardarDatosCliente);
    
    // Observaciones
    document.getElementById('observaciones').addEventListener('input', actualizarContador);
    
    // Botones
    DOM.exportarBtn.addEventListener('click', generarPDF);
    DOM.guardarBtn.addEventListener('click', guardarCotizacion);
    
    // Delegación de eventos para servicios
    DOM.contenedorServicios.addEventListener('click', manejarClickServicio);
}

// Cargar servicios desde JSON
async function cargarServicios() {
    try {
        const respuesta = await fetch('datos.json');
        const datos = await respuesta.json();
        serviciosDisponibles = datos.servicios;
        renderizarServicios(serviciosDisponibles);
    } catch (error) {
        mostrarError('Error al cargar los servicios');
    }
}

// Renderizar servicios
function renderizarServicios(servicios) {
    DOM.contenedorServicios.innerHTML = servicios.map(servicio => `
        <div class="servicio" data-id="${servicio.id}">
            <div>
                <h3>${servicio.nombre}</h3>
                <p>${servicio.categoria}</p>
            </div>
            <div>
                <span class="precio">$${servicio.precio.toFixed(2)}</span>
                <button class="boton-primario">Agregar</button>
            </div>
        </div>
    `).join('');
}

// Manejar clicks en servicios
function manejarClickServicio(e) {
    if (e.target.tagName === 'BUTTON') {
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

// Actualizar resumen del carrito
function actualizarResumen() {
    const subtotal = carrito.reduce((total, item) => total + item.precio, 0);
    const iva = subtotal * 0.21;
    const total = subtotal + iva;
    
    DOM.resumen.innerHTML = `
        <p>Subtotal sin IVA: $${subtotal.toFixed(2)}</p>
        <p>IVA (21%): $${iva.toFixed(2)}</p>
        <p>Total: $${total.toFixed(2)}</p>
    `;
}

// Guardar datos del cliente
function guardarDatosCliente(e) {
    e.preventDefault();
    
    datosCliente = {
        nombre: document.getElementById('nombre-cliente').value,
        empresa: document.getElementById('empresa-cliente').value,
        email: document.getElementById('email-cliente').value,
        telefono: document.getElementById('telefono-cliente').value,
        observaciones: document.getElementById('observaciones').value
    };
    
    mostrarExito('Datos del cliente guardados');
}

// Actualizar contador de observaciones
function actualizarContador() {
    const textarea = document.getElementById('observaciones');
    DOM.contadorObservaciones.textContent = `${textarea.value.length}/500 caracteres`;
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
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(46, 90, 136); // Azul ISO
    
    // Encabezado
    doc.setFontSize(20);
    doc.text('COTIZACIÓN DE AUDITORÍA', 105, 20, { align: 'center' });
    
    // Datos del cliente
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Cliente: ${datosCliente.nombre || 'No especificado'}`, 20, 40);
    doc.text(`Empresa: ${datosCliente.empresa || 'No especificada'}`, 20, 48);
    doc.text(`Contacto: ${datosCliente.email || 'No especificado'} ${datosCliente.telefono ? '| ' + datosCliente.telefono : ''}`, 20, 56);
    doc.text(`Observaciones: ${datosCliente.observaciones || 'Ninguna'}`, 20, 64);
    
    // Línea separadora
    doc.setDrawColor(76, 175, 80); // Verde ISO
    doc.setLineWidth(0.5);
    doc.line(20, 70, 190, 70);
    
    // Servicios
    doc.setFontSize(14);
    doc.setTextColor(46, 90, 136);
    doc.text('SERVICIOS COTIZADOS', 20, 80);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    let y = 88;
    
    carrito.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.nombre}`, 20, y);
        doc.text(`$${item.precio.toFixed(2)}`, 180, y, { align: 'right' });
        y += 7;
    });
    
    // Totales
    const subtotal = carrito.reduce((acc, item) => acc + item.precio, 0);
    const iva = subtotal * 0.21;
    const total = subtotal + iva;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal sin IVA:', 150, y + 10);
    doc.text(`$${subtotal.toFixed(2)}`, 180, y + 10, { align: 'right' });
    
    doc.text('IVA (21%):', 150, y + 18);
    doc.text(`$${iva.toFixed(2)}`, 180, y + 18, { align: 'right' });
    
    doc.text('Total:', 150, y + 26);
    doc.text(`$${total.toFixed(2)}`, 180, y + 26, { align: 'right' });
    
    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Generado por el Sistema de Auditoría de Calidad', 105, 285, { align: 'center' });
    doc.text(new Date().toLocaleDateString(), 105, 290, { align: 'center' });
    
    // Guardar
    const nombreArchivo = `Cotización_${datosCliente.empresa || 'Auditoria'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(nombreArchivo);
}

// Guardar cotización
function guardarCotizacion() {
    if (carrito.length === 0) {
        mostrarError('No hay servicios en el carrito');
        return;
    }
    
    const cotizacion = {
        id: Date.now(),
        fecha: new Date().toLocaleString(),
        cliente: {...datosCliente},
        servicios: [...carrito],
        total: carrito.reduce((acc, item) => acc + item.precio, 0) * 1.21
    };
    
    cotizacionesGuardadas.push(cotizacion);
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

// Renderizar cotizaciones guardadas
function renderizarCotizacionesGuardadas() {
    DOM.listaCotizaciones.innerHTML = cotizacionesGuardadas.map(cotizacion => `
        <li>
            <div>
                <strong>${cotizacion.cliente.empresa || 'Sin empresa'}</strong>
                <span>${new Date(cotizacion.id).toLocaleDateString()}</span>
            </div>
            <div>
                <span>$${cotizacion.total.toFixed(2)}</span>
                <button class="boton-secundario" data-id="${cotizacion.id}">Ver</button>
            </div>
        </li>
    `).join('');
}

// Helpers
function mostrarExito(mensaje) {
    Swal.fire('Éxito', mensaje, 'success');
}

function mostrarError(mensaje) {
    Swal.fire('Error', mensaje, 'error');
}