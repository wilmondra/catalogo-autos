// ── Estado global ──────────────────────────────────────────────────────────
let todosLosAutos = [];
let favoritosActuales = new Set();
let autoModalActual = null;
let filtroActivo = "todos";
let busquedaActual = "";

// ── Inicialización ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
    cargarUsuario();
    await Promise.all([cargarAutos(), cargarFavoritos()]);
    renderizarCatalogo();
    setupFiltros();
    setupBusqueda();
});

async function cargarUsuario() {
    try {
        const res = await fetch("/api/usuario");
        const data = await res.json();
        document.getElementById("header-usuario").textContent = data.nombre || data.usuario;
    } catch {}
}

async function cargarAutos() {
    try {
        const res = await fetch("/api/autos");
        todosLosAutos = await res.json();
    } catch {
        document.getElementById("catalogo-grid").innerHTML =
            '<p class="no-results">Error al cargar el catálogo. Recarga la página.</p>';
    }
}

async function cargarFavoritos() {
    try {
        const res = await fetch("/api/favoritos");
        const data = await res.json();
        favoritosActuales = new Set(data);
        actualizarContadorFav();
    } catch {}
}

// ── Renderizado ────────────────────────────────────────────────────────────
function renderizarCatalogo() {
    const grid = document.getElementById("catalogo-grid");

    const autosFiltrados = todosLosAutos.filter(auto => {
        const matchCat = filtroActivo === "todos" || auto.categoria === filtroActivo;
        const matchBusq = auto.nombre.toLowerCase().includes(busquedaActual) ||
                          auto.descripcion.toLowerCase().includes(busquedaActual);
        return matchCat && matchBusq;
    });

    document.getElementById("contador-texto").textContent =
        `Mostrando ${autosFiltrados.length} de ${todosLosAutos.length} modelos`;

    if (autosFiltrados.length === 0) {
        grid.innerHTML = '<p class="no-results">No se encontraron modelos con ese filtro.</p>';
        return;
    }

    grid.innerHTML = autosFiltrados.map(auto => crearCardHTML(auto)).join("");

    // Eventos en las cards
    grid.querySelectorAll(".auto").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.classList.contains("fav-btn") || e.target.classList.contains("ver-mas-btn")) return;
            const id = card.dataset.id;
            const auto = todosLosAutos.find(a => a.id === id);
            if (auto) abrirModal(auto);
        });
    });

    grid.querySelectorAll(".fav-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleFavorito(btn.dataset.id, btn.dataset.nombre);
        });
    });

    grid.querySelectorAll(".ver-mas-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const auto = todosLosAutos.find(a => a.id === id);
            if (auto) abrirModal(auto);
        });
    });

    renderizarFavoritos();
}

function crearCardHTML(auto) {
    const esFav = favoritosActuales.has(auto.id);
    const catLabel = { superdeportivo:"Superdeportivo", deportivo:"Deportivo", clasico:"Clásico JDM", drift:"Drift" };

    return `
    <div class="auto" data-id="${auto.id}">
        <span class="auto-cat-badge">${catLabel[auto.categoria] || auto.categoria}</span>
        <button class="fav-btn ${esFav ? "activo" : ""}" data-id="${auto.id}" data-nombre="${auto.nombre}" title="Favorito">
            ${esFav ? "❤️" : "🤍"}
        </button>
        <img src="${auto.img}" alt="${auto.nombre}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x200/1e1509/d9a15f?text=${encodeURIComponent(auto.nombre)}'">
        <div class="auto-info">
            <h2>${auto.nombre}</h2>
            <p>${auto.descripcion}</p>
            <div class="auto-specs-mini">
                <div class="spec-mini"><span>Potencia</span>${auto.potencia}</div>
                <div class="spec-mini"><span>Vel. máx.</span>${auto.velocidad}</div>
                <div class="spec-mini"><span>Año</span>${auto.año}</div>
            </div>
            <button class="ver-mas-btn" data-id="${auto.id}">Ver especificaciones completas →</button>
        </div>
    </div>`;
}

// ── Modal ──────────────────────────────────────────────────────────────────
function abrirModal(auto) {
    autoModalActual = auto;
    document.getElementById("modal-img").src = auto.img;
    document.getElementById("modal-img").onerror = function() {
        this.src = `https://via.placeholder.com/300x250/1e1509/d9a15f?text=${encodeURIComponent(auto.nombre)}`;
    };
    document.getElementById("modal-nombre").textContent = auto.nombre;
    document.getElementById("modal-descripcion").textContent = auto.descripcion;
    document.getElementById("modal-motor").textContent = auto.motor;
    document.getElementById("modal-potencia").textContent = auto.potencia;
    document.getElementById("modal-velocidad").textContent = auto.velocidad;
    document.getElementById("modal-año").textContent = auto.año;
    document.getElementById("modal-precio").textContent = auto.precio;

    const catLabel = { superdeportivo:"Superdeportivo", deportivo:"Deportivo", clasico:"Clásico JDM", drift:"Drift" };
    document.getElementById("modal-categoria").textContent = catLabel[auto.categoria] || auto.categoria;

    actualizarBtnModalFav(auto.id);
    document.getElementById("modal").classList.add("abierto");
    document.body.style.overflow = "hidden";
}

function cerrarModal(e) {
    if (e.target === document.getElementById("modal")) {
        document.getElementById("modal").classList.remove("abierto");
        document.body.style.overflow = "";
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        document.getElementById("modal").classList.remove("abierto");
        document.body.style.overflow = "";
    }
});

document.querySelector(".modal-close").addEventListener("click", () => {
    document.getElementById("modal").classList.remove("abierto");
    document.body.style.overflow = "";
});

function actualizarBtnModalFav(id) {
    const btn = document.getElementById("modal-fav-btn");
    const esFav = favoritosActuales.has(id);
    btn.textContent = esFav ? "💔 Quitar de favoritos" : "❤️ Agregar a favoritos";
    btn.className = "modal-fav-btn" + (esFav ? " activo" : "");
}

function toggleFavModal() {
    if (autoModalActual) {
        toggleFavorito(autoModalActual.id, autoModalActual.nombre);
        actualizarBtnModalFav(autoModalActual.id);
    }
}

// ── Favoritos ──────────────────────────────────────────────────────────────
async function toggleFavorito(id, nombre) {
    const accion = favoritosActuales.has(id) ? "quitar" : "agregar";

    try {
        await fetch("/api/favoritos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ auto_id: id, auto_nombre: nombre, accion })
        });

        if (accion === "agregar") {
            favoritosActuales.add(id);
        } else {
            favoritosActuales.delete(id);
        }

        actualizarContadorFav();
        renderizarCatalogo();
    } catch (e) {
        console.error("Error al actualizar favorito:", e);
    }
}

function actualizarContadorFav() {
    document.getElementById("fav-num").textContent = favoritosActuales.size;
}

function renderizarFavoritos() {
    const sec = document.getElementById("favoritos-section");
    const grid = document.getElementById("favoritos-grid");

    if (favoritosActuales.size === 0) {
        sec.style.display = "none";
        return;
    }

    sec.style.display = "block";
    grid.innerHTML = [...favoritosActuales].map(id => {
        const auto = todosLosAutos.find(a => a.id === id);
        if (!auto) return "";
        return `<div class="fav-chip">
            <span>${auto.nombre}</span>
            <button onclick="toggleFavorito('${auto.id}', '${auto.nombre}')" title="Quitar">✕</button>
        </div>`;
    }).join("");
}

// ── Filtros y búsqueda ─────────────────────────────────────────────────────
function setupFiltros() {
    document.querySelectorAll(".filtro-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("activo"));
            btn.classList.add("activo");
            filtroActivo = btn.dataset.cat;
            renderizarCatalogo();
        });
    });

    document.getElementById("favoritos-count").addEventListener("click", () => {
        document.getElementById("favoritos-section")?.scrollIntoView({ behavior: "smooth" });
    });
}

function setupBusqueda() {
    document.getElementById("busqueda").addEventListener("input", (e) => {
        busquedaActual = e.target.value.toLowerCase().trim();
        renderizarCatalogo();
    });
}
