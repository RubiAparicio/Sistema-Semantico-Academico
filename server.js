import express from "express";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseStringPromise } from "xml2js";
import { Builder } from "xml2js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Endpoint de prueba
app.get("/api/estado", (req, res) => {
    res.json({
        sistema: "EduSemantic",
        estado: "funcionando"
    });
});

// Leer alumnos desde el documento XML
app.get("/api/alumnos", async (req, res) => {
    try {
        const rutaXML = path.join(
            __dirname,
            "data",
            "alumnos.xml"
        );

        const contenido = await readFile(rutaXML, "utf8");

        const resultado = await parseStringPromise(contenido, {
            explicitArray: false,
            explicitRoot: true,
            attrkey: "$"
        });

        const alumnosXML = resultado.alumnos.alumno;
        const alumnos = alumnosXML
            ? Array.isArray(alumnosXML)
                ? alumnosXML
                : [alumnosXML]
            : [];

        const datos = alumnos.map((alumno) => ({
            id: alumno.$.id,
            matricula: alumno.matricula,
            nombre: alumno.nombre,
            correo: alumno.correo,
            carrera: alumno.carrera,
            semestre: Number(alumno.semestre),
            promedio: Number(alumno.promedio),
            estatus: alumno.estatus
        }));

        res.json(datos);
    } catch (error) {
        console.error("Error al leer alumnos.xml:", error);

        res.status(500).json({
            error: "No fue posible cargar los alumnos."
        });
    }
});

app.post("/api/alumnos", async (req, res) => {
    try {
        const {
            matricula,
            nombre,
            correo,
            carrera,
            carreraId,
            semestre,
            promedio,
            estatus
        } = req.body;

        // Validar campos obligatorios
        if (
            !matricula ||
            !nombre ||
            !correo ||
            !carrera ||
            !carreraId ||
            semestre === undefined ||
            promedio === undefined ||
            !estatus
        ) {
            return res.status(400).json({
                error: "Todos los campos son obligatorios."
            });
        }

        const rutaXML = path.join(__dirname, "data", "alumnos.xml");
        const contenido = await readFile(rutaXML, "utf8");

        const resultado = await parseStringPromise(contenido, {
            explicitArray: false,
            explicitRoot: true,
            attrkey: "$"
        });

        let alumnos = resultado.alumnos.alumno;

        if (!alumnos) {
            alumnos = [];
        } else if (!Array.isArray(alumnos)) {
            alumnos = [alumnos];
        }

        // Evitar matrículas duplicadas
        const existe = alumnos.some(
            alumno => alumno.matricula === matricula.trim()
        );

        if (existe) {
            return res.status(409).json({
                error: "Ya existe un alumno con esa matrícula."
            });
        }

        // Generar el siguiente identificador
        const numeros = alumnos.map(alumno => {
            const coincidencia = alumno.$.id.match(/^A(\d+)$/);
            return coincidencia ? Number(coincidencia[1]) : 0;
        });

        const siguienteId = Math.max(0, ...numeros) + 1;
        const id = `A${String(siguienteId).padStart(3, "0")}`;

        const nuevoAlumno = {
            $: { id },
            matricula: matricula.trim(),
            nombre: nombre.trim(),
            correo: correo.trim(),
            carrera: {
                $: { id: carreraId.trim() },
                _: carrera.trim()
            },
            semestre: Number(semestre),
            promedio: Number(promedio),
            estatus: estatus.trim()
        };

        alumnos.push(nuevoAlumno);
        resultado.alumnos.alumno = alumnos;

        const builder = new Builder({
            xmldec: { version: "1.0", encoding: "UTF-8" },
            renderOpts: { pretty: true, indent: "    " }
        });

        const nuevoXML = builder.buildObject(resultado);

        await writeFile(rutaXML, nuevoXML, "utf8");

        res.status(201).json({
            mensaje: "Alumno registrado correctamente.",
            alumno: {
                id,
                matricula: matricula.trim(),
                nombre: nombre.trim(),
                correo: correo.trim(),
                carrera: carrera.trim(),
                semestre: Number(semestre),
                promedio: Number(promedio),
                estatus: estatus.trim()
            }
        });
    } catch (error) {
        console.error("Error al registrar alumno:", error);

        res.status(500).json({
            error: "No fue posible registrar el alumno."
        });
    }
});

app.put("/api/alumnos/:id", async (req, res) => {
    try {
        const {
            matricula,
            nombre,
            correo,
            carrera,
            carreraId,
            semestre,
            promedio,
            estatus
        } = req.body;

        if (
            !matricula?.trim() ||
            !nombre?.trim() ||
            !correo?.trim() ||
            !carrera?.trim() ||
            !carreraId?.trim() ||
            semestre === undefined ||
            promedio === undefined ||
            !estatus?.trim()
        ) {
            return res.status(400).json({
                error: "Todos los campos son obligatorios."
            });
        }

        const numSemestre = Number(semestre);
        const numPromedio = Number(promedio);

        if (
            !Number.isInteger(numSemestre) ||
            numSemestre < 1 ||
            numSemestre > 12 ||
            !Number.isFinite(numPromedio) ||
            numPromedio < 0 ||
            numPromedio > 10
        ) {
            return res.status(400).json({
                error: "Verifica el semestre y el promedio."
            });
        }

        const rutaXML = path.join(__dirname, "data", "alumnos.xml");
        const contenido = await readFile(rutaXML, "utf8");

        const resultado = await parseStringPromise(contenido, {
            explicitArray: false,
            explicitRoot: true,
            attrkey: "$"
        });

        let alumnos = resultado.alumnos.alumno;

        if (!alumnos) {
            return res.status(404).json({
                error: "No hay alumnos registrados."
            });
        }

        if (!Array.isArray(alumnos)) {
            alumnos = [alumnos];
        }

        const indice = alumnos.findIndex(
            alumno => alumno.$.id === req.params.id
        );

        if (indice === -1) {
            return res.status(404).json({
                error: "No se encontró el alumno."
            });
        }

        const matriculaNueva = matricula.trim();

        const duplicada = alumnos.some(
            alumno =>
                alumno.$.id !== req.params.id &&
                alumno.matricula === matriculaNueva
        );

        if (duplicada) {
            return res.status(409).json({
                error: "Esa matrícula ya pertenece a otro alumno."
            });
        }

        alumnos[indice] = {
            $: { id: req.params.id },
            matricula: matriculaNueva,
            nombre: nombre.trim(),
            correo: correo.trim(),
            carrera: {
                $: { id: carreraId.trim() },
                _: carrera.trim()
            },
            semestre: numSemestre,
            promedio: numPromedio,
            estatus: estatus.trim()
        };

        resultado.alumnos.alumno = alumnos;

        const builder = new Builder({
            xmldec: { version: "1.0", encoding: "UTF-8" },
            renderOpts: { pretty: true, indent: "    " }
        });

        await writeFile(
            rutaXML,
            builder.buildObject(resultado),
            "utf8"
        );

        res.json({
            mensaje: "Alumno actualizado correctamente."
        });
    } catch (error) {
        console.error("Error al actualizar alumno:", error);

        res.status(500).json({
            error: "No fue posible actualizar el alumno."
        });
    }
});

app.delete("/api/alumnos/:id", async (req, res) => {
    try {
        const rutaXML = path.join(__dirname, "data", "alumnos.xml");
        const contenido = await readFile(rutaXML, "utf8");

        const resultado = await parseStringPromise(contenido, {
            explicitArray: false,
            explicitRoot: true,
            attrkey: "$"
        });

        let alumnos = resultado.alumnos.alumno;

        if (!alumnos) {
            return res.status(404).json({
                error: "No hay alumnos registrados."
            });
        }

        if (!Array.isArray(alumnos)) {
            alumnos = [alumnos];
        }

        const existe = alumnos.some(
            alumno => alumno.$.id === req.params.id
        );

        if (!existe) {
            return res.status(404).json({
                error: "No se encontró el alumno."
            });
        }

        resultado.alumnos.alumno = alumnos.filter(
            alumno => alumno.$.id !== req.params.id
        );

        const builder = new Builder({
            xmldec: { version: "1.0", encoding: "UTF-8" },
            renderOpts: { pretty: true, indent: "    " }
        });

        await writeFile(
            rutaXML,
            builder.buildObject(resultado),
            "utf8"
        );

        res.json({
            mensaje: "Alumno eliminado correctamente."
        });
    } catch (error) {
        console.error("Error al eliminar alumno:", error);

        res.status(500).json({
            error: "No fue posible eliminar el alumno."
        });
    }
});



app.listen(PORT, () => {
    console.log(`EduSemantic disponible en http://localhost:${PORT}`);
});
