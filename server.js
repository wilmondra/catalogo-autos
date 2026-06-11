require("dotenv").config();

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
    host: process.env.DB_HOST || acela.proxy.rlwy.net,
    user: process.env.DB_USER || root,
    password: process.env.DB_PASSWORD ||YuhsheihVudVjmtsRKscFCTuPuGKawTu,
    database: process.env.DB_NAME ||railway,
    port: process.env.DB_PORT ||12751
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
        {
            id: "gtr_r35",
            nombre: "Nissan GT-R R35",
            categoria: "Superdeportivo",
            descripcion: "El Godzilla moderno de Nissan.",
            potencia: "565 HP",
            velocidad: "315 km/h",
            año: "2024",
            motor: "3.8L V6 Twin Turbo",
            img: "/img/Nissan GTR R35.jpeg "
        },
        {
            id: "gtr_r34",
            nombre: "Nissan Skyline GT-R R34",
            categoria: "JDM Legend",
            descripcion: "Uno de los deportivos japoneses más icónicos.",
            potencia: "280 HP",
            velocidad: "266 km/h",
            año: "2002",
            motor: "RB26DETT",
            img: "/img/Nissan GTR R34.jpeg "
        },
        {
            id: "gtr_r33",
            nombre: "Nissan Skyline GT-R R33",
            categoria: "JDM Legend",
            descripcion: "Potencia y tecnología AWD japonesa.",
            potencia: "280 HP",
            velocidad: "252 km/h",
            año: "1998",
            motor: "RB26DETT",
            img: "/img/Nissan GTR R33.jpeg "
        },
        {
            id: "gtr_r32",
            nombre: "Nissan Skyline GT-R R32",
            categoria: "JDM Classic",
            descripcion: "El auto que inició la leyenda Godzilla.",
            potencia: "280 HP",
            velocidad: "250 km/h",
            año: "1994",
            motor: "RB26DETT",
            img: "/img/Nissan GTR R32.jpeg"
        },
        {
            id: "400z",
            nombre: "Nissan Z (2023)",
            categoria: "Deportivo",
            descripcion: "La nueva generación de la serie Z.",
            potencia: "400 HP",
            velocidad: "250 km/h",
            año: "2023",
            motor: "3.0L Twin Turbo V6",
            img: "/img/Nissan Z (2023).jpeg "
        },
        {
            id: "370z",
            nombre: "Nissan 370Z",
            categoria: "Deportivo",
            descripcion: "Potencia y diversión en estado puro.",
            potencia: "332 HP",
            velocidad: "250 km/h",
            año: "2020",
            motor: "3.7L V6",
            img: "/img/Nissan 370Z.jpeg"
        },
        {
            id: "350z",
            nombre: "Nissan 350Z",
            categoria: "Deportivo",
            descripcion: "Uno de los deportivos más populares de Nissan.",
            potencia: "306 HP",
            velocidad: "250 km/h",
            año: "2008",
            motor: "3.5L V6",
            img: "/img/Nissan 350Z.jpeg"
        },
        {
            id: "silvia_s15",
            nombre: "Nissan Silvia S15",
            categoria: "JDM Drift",
            descripcion: "Leyenda japonesa del drift.",
            potencia: "250 HP",
            velocidad: "245 km/h",
            año: "2002",
            motor: "SR20DET",
            img: "/img/Nissan Silvia 15.jpeg"
        }
    ]);
});

app.get("/api/autos/honda", requireLogin, (req, res) => {
    res.json([
        {
            id: "nsx",
            nombre: "Honda NSX",
            categoria: "Superdeportivo",
            descripcion: "El legendario superdeportivo japonés desarrollado con tecnología VTEC.",
            potencia: "270 HP",
            velocidad: "270 km/h",
            año: "1990",
            motor: "3.0L V6 VTEC",
            img: "/img/Honda NSX.jpeg "
        },
        {
            id: "civic_type_r",
            nombre: "Honda Civic Type R",
            categoria: "Type R",
            descripcion: "Uno de los hatchbacks de tracción delantera más rápidos del mundo.",
            potencia: "315 HP",
            velocidad: "275 km/h",
            año: "2023",
            motor: "2.0L Turbo VTEC",
            img: "/img/Honda Civic Type R.jpeg "
        },
        {
            id: "s2000",
            nombre: "Honda S2000",
            categoria: "Roadster",
            descripcion: "Deportivo de alto rendimiento con motor F20C y tecnología VTEC.",
            potencia: "240 HP",
            velocidad: "250 km/h",
            año: "2008",
            motor: "2.0L F20C",
            img: "/img/Honda S2000.jpeg"
        },
        {
            id: "integra_type_r",
            nombre: "Honda Integra Type R",
            categoria: "Type R",
            descripcion: "Uno de los deportivos compactos más icónicos de Honda.",
            potencia: "197 HP",
            velocidad: "233 km/h",
            año: "2001",
            motor: "1.8L VTEC",
            img: "/img/Honda Integra Type R.jpeg"
        }
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
    console.log(`🚗 Luxury Motors corriendo en puerto http://localhost:${PORT}`);
});