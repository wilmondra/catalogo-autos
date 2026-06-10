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

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// CONEXIÓN MYSQL (RAILWAY)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Conectar DB
db.connect((error) => {
    if (error) {
        console.log(" Error al conectar con MySQL:", error.message);
    } else {
        console.log(" Conectado a MySQL - luxurymotorss");
        crearTablas();
    }
});

// Crear tablas si no existen
function crearTablas() {
    db.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario VARCHAR(50) UNIQUE NOT NULL,
            contraseña VARCHAR(255) NOT NULL,
            nombre VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.query(`
        CREATE TABLE IF NOT EXISTS favoritos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            auto_id VARCHAR(50) NOT NULL,
            auto_nombre VARCHAR(100),
            UNIQUE KEY unique_fav (usuario_id, auto_id)
        )
    `);
}

// ── Middleware login ──
function requireLogin(req, res, next) {
    if (req.session && req.session.usuario) {
        next();
    } else {
        res.redirect("/");
    }
}

// ── RUTAS ──

// Login page
app.get("/", (req, res) => {
    if (req.session.usuario) return res.redirect("/entrada");
    res.sendFile(path.join(__dirname, "public", "login1.html"));
});

// Login
app.post("/login", (req, res) => {
    const { usuario, contraseña } = req.body;

    if (!usuario || !contraseña) {
        return res.status(400).json({ error: "Completa todos los campos." });
    }

    const sql = "SELECT * FROM usuarios WHERE usuario = ? AND contraseña = ?";
    db.query(sql, [usuario, contraseña], (error, resultados) => {
        if (error) return res.status(500).json({ error: "Error servidor" });

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

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

// ── RUTAS PROTEGIDAS ──
app.get("/entrada", requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "entrada.html"));
});

app.get("/inicio", requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "trabajo2.html"));
});

app.get("/catalogo", requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "catalogo_nissan.html"));
});

// Usuario
app.get("/api/usuario", requireLogin, (req, res) => {
    res.json({
        usuario: req.session.usuario,
        nombre: req.session.nombre
    });
});

// Autos
app.get("/api/autos", requireLogin, (req, res) => {
    res.json([
        { id: "gtr_r35", nombre: "Nissan GT-R R35" },
        { id: "gtr_r34", nombre: "Nissan Skyline GT-R R34" },
        { id: "gtr_r33", nombre: "Nissan Skyline GT-R R33" },
        { id: "gtr_r32", nombre: "Nissan Skyline GT-R R32" },
        { id: "400z", nombre: "Nissan Z (2023)" },
        { id: "370z", nombre: "Nissan 370Z" },
        { id: "350z", nombre: "Nissan 350Z" },
        { id: "silvia_s15", nombre: "Nissan Silvia S15" }
    ]);
});

// Favoritos GET
app.get("/api/favoritos", requireLogin, (req, res) => {
    const sql = "SELECT auto_id FROM favoritos WHERE usuario_id = ?";
    db.query(sql, [req.session.usuario_id], (err, rows) => {
        if (err) return res.status(500).json({ error: "Error servidor" });
        res.json(rows.map(r => r.auto_id));
    });
});

// Favoritos POST
app.post("/api/favoritos", requireLogin, (req, res) => {
    const { auto_id, auto_nombre, accion } = req.body;

    if (accion === "agregar") {
        const sql = "INSERT IGNORE INTO favoritos (usuario_id, auto_id, auto_nombre) VALUES (?,?,?)";
        db.query(sql, [req.session.usuario_id, auto_id, auto_nombre], (err) => {
            if (err) return res.status(500).json({ error: "Error" });
            res.json({ ok: true });
        });
    } else {
        const sql = "DELETE FROM favoritos WHERE usuario_id = ? AND auto_id = ?";
        db.query(sql, [req.session.usuario_id, auto_id], (err) => {
            if (err) return res.status(500).json({ error: "Error" });
            res.json({ ok: true });
        });
    }
});

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚗 Luxury Motors corriendo en puerto ${PORT}`);
});