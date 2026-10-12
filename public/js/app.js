const tablaAlumnos = document.getElementById("tabla-alumnos");
const campoBusqueda = document.getElementById("buscar-alumno");
const mensajeTabla = document.getElementById("mensaje-tabla");

let alumnos = [];

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

        tablaAlumnos.appendChild(fila);
    }

    mensajeTabla.textContent =
        `Mostrando ${lista.length} de ${alumnos.length} alumnos.`;
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

campoBusqueda.addEventListener("input", filtrarAlumnos);

iniciarDashboard();
