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

// Selectores del DOM
const DOM = {
    formulario: document.getElementById('form-cliente'),
    contenedorServicios: document.getElementById('contenedor-servicios'),
    resumen: document.getElementById('resumen'),
    exportarBtn: document.getElementById('exportar-pdf'),
    guardarBtn: document.getElementById('guardar-cotizacion'),
    listaCotizaciones: document.getElementById('lista-cotizaciones'),
    contadorObservaciones: document.getElementById('contador-observaciones'),
    inputObservaciones: document.getElementById('observaciones'),
    nombreCliente: document.getElementById('nombre-cliente'),
    empresaCliente: document.getElementById('empresa-cliente'),
    emailCliente: document.getElementById('email-cliente'),
    telefonoCliente: document.getElementById('telefono-cliente'),
    listaCarrito: document.getElementById('items-carrito')
};

// Inicialización
document.addEventListener('DOMContentLoaded', inicializarApp);

async function inicializarApp() {
    try {
        await cargarServicios();
        cargarCotizacionesGuardadas();
        configurarEventos();
        actualizarEstadoUI();
    } catch (error) {
        console.error('Error al inicializar:', error);
        mostrarError('Error al cargar la aplicación');
    }
}

// Configuración de eventos
function configurarEventos() {
    // Formulario
    DOM.formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarDatosCliente();
    });

    // Observaciones
    DOM.inputObservaciones.addEventListener('input', actualizarContador);

    // Validación en tiempo real
    DOM.nombreCliente.addEventListener('input', actualizarEstadoUI);
    DOM.emailCliente.addEventListener('input', actualizarEstadoUI);

    // Botones principales
    DOM.exportarBtn.addEventListener('click', generarPDF);
    DOM.guardarBtn.addEventListener('click', guardarCotizacion);

    // Delegación de eventos
    document.addEventListener('click', manejarEventosDinamicos);
}

function manejarEventosDinamicos(e) {
    // Agregar servicio
    if (e.target.classList.contains('boton-primario') && e.target.closest('.servicio')) {
        const servicioId = parseInt(e.target.closest('.servicio').dataset.id);
        agregarAlCarrito(servicioId);
    }
    
    // Ver cotización
    if (e.target.classList.contains('boton-secundario') && e.target.closest('.cotizacion-item')) {
        const cotizacionId = parseInt(e.target.dataset.id);
        mostrarDetalleCotizacion(cotizacionId);
    }

    // Quitar servicio
    if (e.target.classList.contains('boton-quitar')) {
        const servicioId = parseInt(e.target.dataset.id);
        quitarDelCarrito(servicioId);
    }
}

// Cargar servicios
async function cargarServicios() {
    try {
        const respuesta = await fetch('datos.json');
        if (!respuesta.ok) throw new Error('Error al cargar servicios');
        const data = await respuesta.json();
        serviciosDisponibles = data.servicios || [];
        renderizarServicios();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los servicios');
        throw error;
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
                <span class="precio">${formatearMoneda(servicio.precio)}</span>
                <button class="boton-primario">Agregar</button>
            </div>
        </div>
    `).join('');
}

// Carrito funciones
function agregarAlCarrito(servicioId) {
    const servicio = serviciosDisponibles.find(s => s.id === servicioId);
    if (!servicio) return;

    carrito.push({...servicio});
    actualizarCarritoUI();
    mostrarExito(`"${servicio.nombre}" agregado`);
}

function quitarDelCarrito(servicioId) {
    const index = carrito.findIndex(item => item.id === servicioId);
    if (index === -1) return;

    const [servicio] = carrito.splice(index, 1);
    actualizarCarritoUI();
    mostrarExito(`"${servicio.nombre}" eliminado`);
}

function actualizarCarritoUI() {
    // Lista de items
    DOM.listaCarrito.innerHTML = carrito.length > 0 
        ? carrito.map(item => `
            <li class="item-carrito">
                <span class="nombre">${item.nombre}</span>
                <span class="precio">${formatearMoneda(item.precio)}</span>
                <button class="boton-quitar" data-id="${item.id}">Quitar</button>
            </li>
        `).join('')
        : '<p class="mensaje-vacio">No hay servicios agregados</p>';

    // Resumen
    const subtotal = calcularSubtotal();
    const iva = calcularIVA();
    const total = calcularTotal();

    DOM.resumen.innerHTML = `
        <div class="resumen-item">
            <span>Subtotal sin IVA:</span>
            <span>${formatearMoneda(subtotal)}</span>
        </div>
        <div class="resumen-item">
            <span>IVA (21%):</span>
            <span>${formatearMoneda(iva)}</span>
        </div>
        <div class="resumen-item total">
            <span>Total:</span>
            <span>${formatearMoneda(total)}</span>
        </div>
    `;

    actualizarEstadoUI();
}

// Cálculos
function calcularSubtotal() {
    return carrito.reduce((total, item) => total + item.precio, 0);
}

function calcularIVA() {
    return calcularSubtotal() * 0.21;
}

function calcularTotal() {
    return calcularSubtotal() + calcularIVA();
}

// Formatear moneda
function formatearMoneda(monto) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(monto);
}

// Datos del cliente
function guardarDatosCliente() {
    datosCliente = {
        nombre: DOM.nombreCliente.value.trim(),
        empresa: DOM.empresaCliente.value.trim(),
        email: DOM.emailCliente.value.trim(),
        telefono: DOM.telefonoCliente.value.trim(),
        observaciones: DOM.inputObservaciones.value.trim()
    };

    if (!validarDatosCliente()) return;
    
    mostrarExito('Datos guardados correctamente');
    actualizarEstadoUI();
}

function validarDatosCliente() {
    if (!datosCliente.nombre) {
        mostrarError('El nombre es obligatorio');
        DOM.nombreCliente.focus();
        return false;
    }

    if (!datosCliente.email) {
        mostrarError('El email es obligatorio');
        DOM.emailCliente.focus();
        return false;
    }

    if (!validarEmail(datosCliente.email)) {
        mostrarError('Ingrese un email válido');
        DOM.emailCliente.focus();
        return false;
    }

    return true;
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Estado de la UI
function actualizarEstadoUI() {
    const datosValidos = datosCliente.nombre && datosCliente.email && validarEmail(datosCliente.email);
    const carritoValido = carrito.length > 0;

    DOM.guardarBtn.disabled = !(datosValidos && carritoValido);
    DOM.exportarBtn.disabled = !(datosValidos && carritoValido);

    DOM.guardarBtn.classList.toggle('boton-deshabilitado', !datosValidos || !carritoValido);
    DOM.exportarBtn.classList.toggle('boton-deshabilitado', !datosValidos || !carritoValido);
}

// Observaciones
function actualizarContador() {
    const caracteres = DOM.inputObservaciones.value.length;
    DOM.contadorObservaciones.textContent = `${caracteres}/500`;
    DOM.contadorObservaciones.style.color = caracteres > 450 ? '#D32F2F' : '#666';
}

// Cotizaciones guardadas
function guardarCotizacion() {
    if (!validarDatosCliente()) return;
    if (carrito.length === 0) {
        mostrarError('Agregue al menos un servicio');
        return;
    }

    const cotizacion = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-AR'),
        cliente: {...datosCliente},
        servicios: [...carrito],
        subtotal: calcularSubtotal(),
        iva: calcularIVA(),
        total: calcularTotal()
    };

    try {
        cotizacionesGuardadas.unshift(cotizacion);
        localStorage.setItem('cotizaciones', JSON.stringify(cotizacionesGuardadas));
        
        renderizarCotizacionesGuardadas();
        mostrarExito('Cotización guardada');
    } catch (error) {
        console.error('Error al guardar:', error);
        mostrarError('No se pudo guardar');
    }
}

function cargarCotizacionesGuardadas() {
    try {
        const guardadas = localStorage.getItem('cotizaciones');
        if (guardadas) {
            cotizacionesGuardadas = JSON.parse(guardadas) || [];
            renderizarCotizacionesGuardadas();
        }
    } catch (error) {
        console.error('Error al cargar:', error);
        cotizacionesGuardadas = [];
    }
}

function renderizarCotizacionesGuardadas() {
    DOM.listaCotizaciones.innerHTML = cotizacionesGuardadas.length > 0
        ? cotizacionesGuardadas.map(cotizacion => `
            <li class="cotizacion-item">
                <div class="cotizacion-info">
                    <h3>${cotizacion.cliente.empresa || 'Sin nombre'}</h3>
                    <p>${new Date(cotizacion.id).toLocaleDateString()}</p>
                </div>
                <div class="cotizacion-acciones">
                    <span class="total">${formatearMoneda(cotizacion.total)}</span>
                    <button class="boton-secundario" data-id="${cotizacion.id}">Ver</button>
                </div>
            </li>
        `).join('')
        : '<p class="mensaje-vacio">No hay cotizaciones guardadas</p>';
}

// Mostrar detalle
function mostrarDetalleCotizacion(id) {
    const cotizacion = cotizacionesGuardadas.find(c => c.id === id);
    if (!cotizacion) return;

    const serviciosHTML = cotizacion.servicios.map(serv => `
        <li class="servicio-detalle">
            <span>${serv.nombre}</span>
            <span>${formatearMoneda(serv.precio)}</span>
        </li>
    `).join('');

    Swal.fire({
        title: `Cotización #${cotizacion.id}`,
        html: `
            <div class="detalle-cotizacion">
                <div class="cliente-info">
                    <p><strong>Fecha:</strong> ${cotizacion.fecha}</p>
                    <p><strong>Cliente:</strong> ${cotizacion.cliente.nombre}</p>
                    <p><strong>Empresa:</strong> ${cotizacion.cliente.empresa || 'N/A'}</p>
                </div>
                <hr>
                <h4>Servicios:</h4>
                <ul class="lista-servicios">${serviciosHTML}</ul>
                <hr>
                <div class="resumen-total">
                    <p><strong>Subtotal:</strong> ${formatearMoneda(cotizacion.subtotal)}</p>
                    <p><strong>IVA (21%):</strong> ${formatearMoneda(cotizacion.iva)}</p>
                    <p class="total"><strong>Total:</strong> ${formatearMoneda(cotizacion.total)}</p>
                </div>
            </div>
        `,
        width: '800px',
        confirmButtonText: 'Cerrar'
    });
}

// Generar PDF nuevo
function generarPDF() {
    if (carrito.length === 0 || !validarDatosCliente()) {
        mostrarError('Complete los datos requeridos');
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
    
    // Datos del cliente nuevo
    doc.setFontSize(12);
    let y = 40;
    
    const lineasCliente = [
        `Cliente: ${datosCliente.nombre}`,
        `Empresa: ${datosCliente.empresa || 'No especificada'}`,
        `Email: ${datosCliente.email}`,
        ...(datosCliente.telefono ? [`Teléfono: ${datosCliente.telefono}`] : []),
        `Observaciones: ${datosCliente.observaciones || 'Ninguna'}`
    ];
    
    lineasCliente.forEach(linea => {
        doc.text(linea, 20, y);
        y += 8;
    });
    
    y += 12;
    
    // Servicios
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('SERVICIOS COTIZADOS', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    
    carrito.forEach((item, index) => {
        if (y > 260) {
            doc.addPage();
            y = 20;
        }
        
        doc.text(`${index + 1}. ${item.nombre}`, 20, y);
        doc.text(formatearMoneda(item.precio), 190, y, { align: 'right' });
        y += 8;
    });
    
    // Totales
    y = Math.max(y, 150);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    
    doc.text('Subtotal sin IVA:', 20, y);
    doc.text(formatearMoneda(calcularSubtotal()), 190, y, { align: 'right' });
    
    doc.text('IVA (21%):', 20, y + 10);
    doc.text(formatearMoneda(calcularIVA()), 190, y + 10, { align: 'right' });
    
    doc.setFontSize(13);
    doc.text('Total:', 20, y + 20);
    doc.text(formatearMoneda(calcularTotal()), 190, y + 20, { align: 'right' });
    
    // Guardar
    const nombreArchivo = `Cotización_${datosCliente.empresa || 'Auditoria'}_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.pdf`;
    doc.save(nombreArchivo);
}

// helpers nuevos
function mostrarExito(mensaje) {
    Swal.fire({
        title: 'Éxito',
        text: mensaje,
        icon: 'success',
        confirmButtonColor: '#4CAF50',
        timer: 2000
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