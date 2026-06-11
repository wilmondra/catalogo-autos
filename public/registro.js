function togglePass(id) {
    const input = document.getElementById(id);
    input.type = input.type === "password" ? "text" : "password";
}

function verificarFuerza(valor) {
    const bars = [
        document.getElementById("bar1"),
        document.getElementById("bar2"),
        document.getElementById("bar3"),
        document.getElementById("bar4")
    ];
    const label = document.getElementById("strength-label");
    const colores = ["#eee", "#e74c3c", "#e67e22", "#f1c40f", "#27ae60"];
    const textos = ["", "Muy débil", "Débil", "Media", "Fuerte"];

    let puntaje = 0;
    if (valor.length >= 8) puntaje++;
    if (/[A-Z]/.test(valor)) puntaje++;
    if (/[0-9]/.test(valor)) puntaje++;
    if (/[^A-Za-z0-9]/.test(valor)) puntaje++;

    bars.forEach((bar, i) => {
        bar.style.background = i < puntaje ? colores[puntaje] : "#eee";
    });

    label.textContent = valor.length > 0 ? textos[puntaje] : "";
    label.style.color = colores[puntaje];
}

async function registrar() {
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const usuario = document.getElementById("usuario").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const contraseña = document.getElementById("contraseña").value;
    const confirmar = document.getElementById("confirmar").value;
    const btn = document.getElementById("btn-registro");
    const errorDiv = document.getElementById("error-msg");
    const successDiv = document.getElementById("success-msg");

    errorDiv.style.display = "none";
    successDiv.style.display = "none";

    if (!nombre || !apellido || !usuario || !correo || !contraseña || !confirmar) {
        mostrarError("Por favor completa todos los campos.");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        mostrarError("Ingresa un correo electrónico válido.");
        return;
    }

    if (contraseña.length < 8) {
        mostrarError("La contraseña debe tener al menos 8 caracteres.");
        return;
    }

    if (contraseña !== confirmar) {
        mostrarError("Las contraseñas no coinciden.");
        return;
    }

    btn.textContent = "Registrando...";
    btn.disabled = true;

    try {
        const res = await fetch("/registro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, apellido, usuario, correo, contraseña })
        });
        const data = await res.json();

        if (data.success) {
            successDiv.textContent = "¡Cuenta creada exitosamente! Redirigiendo...";
            successDiv.style.display = "block";
            btn.textContent = "¡Listo!";
            setTimeout(() => {window.location.href = "login.html";; }, 2000);
        } else {
            mostrarError(data.error || "Error al crear la cuenta. Intenta de nuevo.");
            btn.textContent = "Crear Cuenta";
            btn.disabled = false;
        }
    } catch (e) {
        mostrarError("Error de conexión. Intenta de nuevo.");
        btn.textContent = "Crear Cuenta";
        btn.disabled = false;
    }
}

function mostrarError(msg) {
    const div = document.getElementById("error-msg");
    div.textContent = msg;
    div.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter") registrar();
    });
});
