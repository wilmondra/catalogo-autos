const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Sesión
app.use(session({
    secret: "luxury_motors_secret_2026",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 } // 1 hora
}));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Conexión MySQL
const conexion = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "GraciasD18",
    database: "luxurymotorss"
});

conexion.connect((error) => {
    if (error) {
        console.log("Error al conectar con MySQL:", error.message);
    } else {
        console.log("✅ Conectado a MySQL - luxurymotorss");
        crearTablas();
    }
});

// Crear tablas si no existen
function crearTablas() {
    conexion.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario VARCHAR(50) UNIQUE NOT NULL,
            contraseña VARCHAR(255) NOT NULL,
            nombre VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    conexion.query(`
        CREATE TABLE IF NOT EXISTS favoritos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            auto_id VARCHAR(50) NOT NULL,
            auto_nombre VARCHAR(100),
            UNIQUE KEY unique_fav (usuario_id, auto_id)
        )
    `);
}

// ── Middleware: verificar sesión ──────────────────────────────────────────────
function requireLogin(req, res, next) {
    if (req.session && req.session.usuario) {
        next();
    } else {
        res.redirect("/");
    }
}

// ── Rutas públicas ────────────────────────────────────────────────────────────

// Página de login
app.get("/", (req, res) => {
    if (req.session.usuario) {
        return res.redirect("/entrada");
    }
    res.sendFile(path.join(__dirname, "public", "login1.html"));
});

// Procesar Login
app.post("/login", (req, res) => {
    const { usuario, contraseña } = req.body;

    if (!usuario || !contraseña) {
        return res.status(400).json({ error: "Completa todos los campos." });
    }

    const sql = "SELECT * FROM usuarios WHERE usuario = ? AND contraseña = ?";
    conexion.query(sql, [usuario, contraseña], (error, resultados) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "Error del servidor." });
        }
        if (resultados.length > 0) {
            req.session.usuario = resultados[0].usuario;
            req.session.usuario_id = resultados[0].id;
            req.session.nombre = resultados[0].nombre || resultados[0].usuario;
            return res.json({ success: true });
        } else {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }
    });
});

// Cerrar sesión
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// ── Rutas protegidas ─────────────────────────────────────────────────────────

app.get("/entrada", requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "entrada.html"));
});

app.get("/inicio", requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "trabajo2.html"));
});

app.get("/catalogo", requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "catalogo_nissan.html"));
});

// API: datos del usuario logueado
app.get("/api/usuario", requireLogin, (req, res) => {
    res.json({
        usuario: req.session.usuario,
        nombre: req.session.nombre
    });
});

// API: catálogo de autos Nissan
app.get("/api/autos", requireLogin, (req, res) => {
    const autos = [
        { id: "gtr_r35", nombre: "Nissan GT-R R35", categoria: "superdeportivo",
          motor: "V6 Biturbo 3.8L", potencia: "565 HP", velocidad: "315 km/h",
          año: "2007-2024", precio: "$113,540",
          img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Nissan_GT-R_-_Flickr_-_Alexandre_Prévot_%2822%29_%28cropped%29.jpg/320px-Nissan_GT-R_-_Flickr_-_Alexandre_Prévot_%2822%29_%28cropped%29.jpg",
          descripcion: "Conocido como Godzilla, es uno de los deportivos japoneses más respetados del mundo." },
        { id: "gtr_r34", nombre: "Nissan Skyline GT-R R34", categoria: "clasico",
          motor: "RB26DETT 2.6L", potencia: "280 HP (oficiales)", velocidad: "250 km/h",
          año: "1999-2002", precio: "$90,000+",
          img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Nissan_Skyline_GT-R_%28R34%29_001.jpg/320px-Nissan_Skyline_GT-R_%28R34%29_001.jpg",
          descripcion: "Leyenda japonesa popularizada por videojuegos y películas de todo el mundo." },
        { id: "gtr_r33", nombre: "Nissan Skyline GT-R R33", categoria: "clasico",
          motor: "RB26DETT 2.6L", potencia: "276 HP", velocidad: "250 km/h",
          año: "1995-1998", precio: "$45,000+",
          img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Nissan_Skyline_GT-R_%28R33%29_001.jpg/320px-Nissan_Skyline_GT-R_%28R33%29_001.jpg",
          descripcion: "Mejoró la estabilidad y el desempeño aerodinámico respecto a su predecesor." },
        { id: "gtr_r32", nombre: "Nissan Skyline GT-R R32", categoria: "clasico",
          motor: "RB26DETT 2.6L", potencia: "276 HP", velocidad: "250 km/h",
          año: "1989-1994", precio: "$35,000+",
          img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Nissan_Skyline_GT-R_%28R32%29_001.jpg/320px-Nissan_Skyline_GT-R_%28R32%29_001.jpg",
          descripcion: "El automóvil que ganó el apodo de Godzilla al dominar las competencias de su época." },
        { id: "400z", nombre: "Nissan Z (2023)", categoria: "deportivo",
          motor: "V6 Biturbo 3.0L", potencia: "400 HP", velocidad: "250 km/h",
          año: "2022-presente", precio: "$41,015",
          img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/2023_Nissan_Z_%28RZ34%29%2C_front_8.14.22.jpg/320px-2023_Nissan_Z_%28RZ34%29%2C_front_8.14.22.jpg",
          descripcion: "La evolución moderna de la saga Z: diseño retro con tecnología de punta y 400 HP." },
        { id: "370z", nombre: "Nissan 370Z", categoria: "deportivo",
          motor: "V6 3.7L", potencia: "332 HP", velocidad: "250 km/h",
          año: "2009-2021", precio: "$30,000+",
          img: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/2013_Nissan_370Z_%28Z34_MY13%29_coupe_%282015-07-02%29_01.jpg/320px-2013_Nissan_370Z_%28Z34_MY13%29_coupe_%282015-07-02%29_01.jpg",
          descripcion: "Deportivo ligero con motor V6 de gran respuesta y excelente manejo en curvas." },
        { id: "350z", nombre: "Nissan 350Z", categoria: "deportivo",
          motor: "V6 3.5L", potencia: "306 HP", velocidad: "240 km/h",
          año: "2002-2009", precio: "$18,000+",
          img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/2003_Nissan_350Z_coupe_%28orange%2C_RHD%29%2C_front_8.15.19.jpg/320px-2003_Nissan_350Z_coupe_%28orange%2C_RHD%29%2C_front_8.15.19.jpg",
          descripcion: "Revivió la serie Z y se convirtió en el favorito del tuning y la cultura JDM." },
        { id: "silvia_s15", nombre: "Nissan Silvia S15", categoria: "drift",
          motor: "SR20DET 2.0L Turbo", potencia: "250 HP", velocidad: "230 km/h",
          año: "1999-2002", precio: "$25,000+",
          img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Nissan_Silvia_S15_001.jpg/320px-Nissan_Silvia_S15_001.jpg",
          descripcion: "Uno de los mejores autos japoneses para drift, referente de la cultura de competición." }
    ];
    res.json(autos);
});

// API: obtener favoritos del usuario
app.get("/api/favoritos", requireLogin, (req, res) => {
    const sql = "SELECT auto_id FROM favoritos WHERE usuario_id = ?";
    conexion.query(sql, [req.session.usuario_id], (err, rows) => {
        if (err) return res.status(500).json({ error: "Error del servidor." });
        res.json(rows.map(r => r.auto_id));
    });
});

// API: agregar/quitar favorito
app.post("/api/favoritos", requireLogin, (req, res) => {
    const { auto_id, auto_nombre, accion } = req.body;
    if (accion === "agregar") {
        const sql = "INSERT IGNORE INTO favoritos (usuario_id, auto_id, auto_nombre) VALUES (?,?,?)";
        conexion.query(sql, [req.session.usuario_id, auto_id, auto_nombre], (err) => {
            if (err) return res.status(500).json({ error: "Error." });
            res.json({ ok: true });
        });
    } else {
        const sql = "DELETE FROM favoritos WHERE usuario_id = ? AND auto_id = ?";
        conexion.query(sql, [req.session.usuario_id, auto_id], (err) => {
            if (err) return res.status(500).json({ error: "Error." });
            res.json({ ok: true });
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚗 Luxury Motors corriendo en el puerto ${PORT}`);
});
