const tablaAlumnos = document.getElementById("tabla-alumnos");
const campoBusqueda = document.getElementById("buscar-alumno");
const mensajeTabla = document.getElementById("mensaje-tabla");
const modalAlumno = document.getElementById("modal-alumno");
const formularioAlumno = document.getElementById("form-alumno");
const mensajeFormulario = document.getElementById("mensaje-formulario");

let alumnos = [];
let alumnoEditandoId = null;

function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto ?? "";
    return celda;
}

function renderizarAlumnos(lista) {
    tablaAlumnos.replaceChildren();

    if (lista.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 6;
        celda.textContent = "No se encontraron alumnos.";
        fila.appendChild(celda);
        tablaAlumnos.appendChild(fila);

        mensajeTabla.textContent = "No hay resultados para mostrar.";
        return;
    }

    for (const alumno of lista) {
        const fila = document.createElement("tr");

        fila.appendChild(crearCelda(alumno.matricula));
        fila.appendChild(crearCelda(alumno.nombre));
        fila.appendChild(crearCelda(alumno.carrera?._ || alumno.carrera));
        fila.appendChild(crearCelda(`Semestre ${alumno.semestre}`));
        fila.appendChild(crearCelda(
            Number(alumno.promedio).toFixed(1)
        ));

        const celdaEstatus = document.createElement("td");
        const etiqueta = document.createElement("span");

        etiqueta.className = "status";
        etiqueta.textContent = alumno.estatus;

        celdaEstatus.appendChild(etiqueta);
        fila.appendChild(celdaEstatus);

        // Columna de acciones
        const celdaAcciones = document.createElement("td");

        const botonEditar = document.createElement("button");
        botonEditar.textContent = "Editar";
        botonEditar.type = "button";
        botonEditar.className = "btn-editar";
        botonEditar.addEventListener("click", () => {
            editarAlumno(alumno);
        });

        const botonEliminar = document.createElement("button");
        botonEliminar.textContent = "Eliminar";
        botonEliminar.type = "button";
        botonEliminar.className = "btn-eliminar";
        botonEliminar.addEventListener("click", () => {
            eliminarAlumno(alumno);
        });

        celdaAcciones.append(botonEditar, botonEliminar);
        fila.appendChild(celdaAcciones);

        tablaAlumnos.appendChild(fila);
    }

    mensajeTabla.textContent =
        `Mostrando ${lista.length} de ${alumnos.length} alumnos.`;
}

function editarAlumno(alumno) {
    alumnoEditandoId = alumno.id;

    formularioAlumno.reset();
    mensajeFormulario.textContent = "";

    // Cambiar el título del formulario
    modalAlumno.querySelector("h2").textContent = "Editar alumno";

    // Cargar los datos actuales
    formularioAlumno.elements.matricula.value = alumno.matricula;
    formularioAlumno.elements.nombre.value = alumno.nombre;
    formularioAlumno.elements.correo.value = alumno.correo;

    formularioAlumno.elements.carrera.value =
        typeof alumno.carrera === "string"
            ? alumno.carrera
            : alumno.carrera?._ ?? "";

    formularioAlumno.elements.carreraId.value =
        alumno.carrera?.$?.id ?? "";

    formularioAlumno.elements.semestre.value = alumno.semestre;
    formularioAlumno.elements.promedio.value = alumno.promedio;
    formularioAlumno.elements.estatus.value = alumno.estatus;

    modalAlumno.classList.remove("oculto");
}

async function eliminarAlumno(alumno) {
    const confirmar = confirm(
        `¿Seguro que deseas eliminar a ${alumno.nombre} (${alumno.matricula})? Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
        const respuesta = await fetch(
            `/api/alumnos/${encodeURIComponent(alumno.id)}`,
            { method: "DELETE" }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || "No se pudo eliminar al alumno."
            );
        }

        alert(resultado.mensaje);
        await iniciarDashboard();
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

function actualizarEstadisticas() {
    const total = alumnos.length;

    const promedio = total
        ? alumnos.reduce(
            (suma, alumno) => suma + alumno.promedio,
            0
        ) / total
        : 0;

    const carreras = new Set(
        alumnos.map((alumno) =>
            typeof alumno.carrera === "string"
                ? alumno.carrera
                : alumno.carrera?._
        )
    );

    const activos = alumnos.filter(
        (alumno) => alumno.estatus === "Activo"
    ).length;

    document.getElementById("total-alumnos").textContent = total;
    document.getElementById("promedio-general").textContent =
        promedio.toFixed(1);
    document.getElementById("total-carreras").textContent =
        carreras.size;
    document.getElementById("alumnos-activos").textContent = activos;
}

function filtrarAlumnos() {
    const busqueda = campoBusqueda.value
        .trim()
        .toLocaleLowerCase("es");

    const resultados = alumnos.filter((alumno) => {
        const carrera = typeof alumno.carrera === "string"
            ? alumno.carrera
            : alumno.carrera?._ ?? "";

        return [
            alumno.matricula,
            alumno.nombre,
            carrera
        ].some((valor) =>
            String(valor ?? "")
                .toLocaleLowerCase("es")
                .includes(busqueda)
        );
    });

    renderizarAlumnos(resultados);
}

async function iniciarDashboard() {
    try {
        const respuesta = await fetch("/api/alumnos");

        if (!respuesta.ok) {
            throw new Error("El servidor no pudo cargar los alumnos.");
        }

        alumnos = await respuesta.json();

        actualizarEstadisticas();
        renderizarAlumnos(alumnos);
    } catch (error) {
        console.error(error);

        tablaAlumnos.replaceChildren();

        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 6;
        celda.textContent = "Error al cargar los datos académicos.";
        fila.appendChild(celda);
        tablaAlumnos.appendChild(fila);

        mensajeTabla.textContent =
            "Comprueba que el servidor esté iniciado.";
    }
}

document.getElementById("btn-nuevo-alumno").addEventListener("click", () => {
    alumnoEditandoId = null;
    formularioAlumno.reset();
    mensajeFormulario.textContent = "";
    modalAlumno.querySelector("h2").textContent = "Registrar alumno";
    modalAlumno.classList.remove("oculto");
});

document.getElementById("btn-cancelar-alumno").addEventListener("click", () => {
    modalAlumno.classList.add("oculto");
});

formularioAlumno.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const botonGuardar = formularioAlumno.querySelector(
        'button[type="submit"]'
    );

    botonGuardar.disabled = true;
    mensajeFormulario.textContent = "Guardando alumno...";

    const datos = Object.fromEntries(new FormData(formularioAlumno));

    datos.semestre = Number(datos.semestre);
    datos.promedio = Number(datos.promedio);

    try {
        const editando = alumnoEditandoId !== null;

        const url = editando
            ? `/api/alumnos/${encodeURIComponent(alumnoEditandoId)}`
            : "/api/alumnos";

        const respuesta = await fetch(url, {
            method: editando ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || "No se pudo guardar el alumno."
            );
        }

        mensajeFormulario.textContent = resultado.mensaje;

        await iniciarDashboard();

        formularioAlumno.reset();
        alumnoEditandoId = null;

        setTimeout(() => {
            modalAlumno.classList.add("oculto");
            mensajeFormulario.textContent = "";
            modalAlumno.querySelector("h2").textContent = "Registrar alumno";
        }, 1000);
    } catch (error) {
        mensajeFormulario.textContent = error.message;
    } finally {
        botonGuardar.disabled = false;
    }
});

campoBusqueda.addEventListener("input", filtrarAlumnos);

iniciarDashboard();
