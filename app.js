let carrito = [];
let cotizacionesGuardadas = [];
let serviciosGlobal = []; // Para almacenar todos los servicios

// Referencias al DOM
const listaServicios = document.getElementById('lista-servicios');
const resumenDiv = document.getElementById('resumen');
const guardarCotizacionBtn = document.getElementById('guardar-cotizacion');
const exportarPDFBtn = document.getElementById('exportar-pdf');
const listaCotizaciones = document.getElementById('lista-cotizaciones');
const busquedaServicio = document.getElementById('busqueda-servicio');
const formCliente = document.getElementById('form-cliente');

// Cargar datos desde JSON
async function cargarServicios() {
    try {
        const respuesta = await fetch('datos.json');
        const datos = await respuesta.json();
        serviciosGlobal = datos.servicios; // Guardar servicios globalmente
        generarServicios(serviciosGlobal);
    } catch (error) {
        console.error("Error al cargar servicios:", error);
        Swal.fire('Error', 'No se pudieron cargar los servicios', 'error');
    }
}

// Generar servicios dinámicamente
function generarServicios(servicios) {
    listaServicios.innerHTML = '';
    servicios.forEach((servicio) => {
        const div = document.createElement('div');
        div.classList.add('producto');
        div.innerHTML = `
            <span>${servicio.nombre} - $${servicio.precio}</span>
            <button data-id="${servicio.id}" data-nombre="${servicio.nombre}" data-precio="${servicio.precio}">Agregar</button>
        `;
        listaServicios.appendChild(div);
    });
}

// Actualizar resumen del carrito
function actualizarResumen() {
    const subtotal = carrito.reduce((acc, item) => acc + item.precio, 0);
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    resumenDiv.innerHTML = `
        <p>Subtotal sin IVA: $${subtotal.toFixed(2)}</p>
        <p>IVA (21%): $${iva.toFixed(2)}</p>
        <p>Total: $${total.toFixed(2)}</p>
    `;
}

// Exportar a PDF
function exportarPDF() {
    if (carrito.length === 0) {
        Swal.fire('Carrito vacío', 'Agrega servicios para exportar', 'warning');
        return;
    }

    const doc = new window.jspdf.jsPDF();
    doc.text('Cotización de Servicios', 10, 10);
    carrito.forEach((item, index) => {
        doc.text(`${index + 1}. ${item.nombre} - $${item.precio.toFixed(2)}`, 10, 20 + index * 10);
    });
    const subtotal = carrito.reduce((acc, item) => acc + item.precio, 0);
    const iva = subtotal * 0.21;
    const total = subtotal + iva;
    doc.text(`Subtotal sin IVA: $${subtotal.toFixed(2)}`, 10, 100);
    doc.text(`IVA (21%): $${iva.toFixed(2)}`, 10, 110);
    doc.text(`Total: $${total.toFixed(2)}`, 10, 120);
    doc.save('cotizacion.pdf');
}

// Guardar cotización
function guardarCotizacion() {
    if (carrito.length === 0) {
        Swal.fire('Carrito vacío', 'Agrega servicios para guardar', 'warning');
        return;
    }

    const cotizacion = {
        id: Date.now(),
        carrito: [...carrito],
        fecha: new Date().toLocaleString(),
    };
    cotizacionesGuardadas.push(cotizacion);
    localStorage.setItem('cotizaciones', JSON.stringify(cotizacionesGuardadas));
    Swal.fire('Éxito', 'Cotización guardada', 'success');
    listarCotizaciones();
}

// Listar cotizaciones
function listarCotizaciones() {
    listaCotizaciones.innerHTML = '';
    cotizacionesGuardadas.forEach((cotizacion) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>Cotización #${cotizacion.id} (${cotizacion.fecha})</span>
            <button class="ver-cotizacion" data-id="${cotizacion.id}">Ver</button>
        `;
        listaCotizaciones.appendChild(li);
    });

    // Evento para ver cotizaciones
    document.querySelectorAll('.ver-cotizacion').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const cotizacion = cotizacionesGuardadas.find(c => c.id === id);
            Swal.fire({
                title: `Cotización #${id}`,
                html: `
                    <p>Fecha: ${cotizacion.fecha}</p>
                    <ul>
                        ${cotizacion.carrito.map(item => `<li>${item.nombre} - $${item.precio}</li>`).join('')}
                    </ul>
                `,
                icon: 'info'
            });
        });
    });
}

// Filtrar servicios en tiempo real
busquedaServicio.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    const serviciosFiltrados = serviciosGlobal.filter((item) =>
        item.nombre.toLowerCase().includes(texto)
    );
    generarServicios(serviciosFiltrados);
});

// Evento para agregar servicios al carrito
listaServicios.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && e.target.textContent === 'Agregar') {
        const id = parseInt(e.target.dataset.id);
        const nombre = e.target.dataset.nombre;
        const precio = parseFloat(e.target.dataset.precio);
        carrito.push({ id, nombre, precio });
        actualizarResumen();
        Swal.fire('Agregado', `${nombre} se añadió al carrito`, 'success');
    }
});

// Inicializar aplicación
function iniciarApp() {
    // Cargar cotizaciones guardadas al inicio
    const cotizacionesGuardadasStorage = localStorage.getItem('cotizaciones');
    if (cotizacionesGuardadasStorage) {
        cotizacionesGuardadas = JSON.parse(cotizacionesGuardadasStorage);
        listarCotizaciones();
    }

    cargarServicios();
    exportarPDFBtn.addEventListener('click', exportarPDF);
    guardarCotizacionBtn.addEventListener('click', guardarCotizacion);
}

iniciarApp();