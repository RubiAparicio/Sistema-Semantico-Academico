import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseStringPromise } from "xml2js";

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

app.listen(PORT, () => {
    console.log(`EduSemantic disponible en http://localhost:${PORT}`);
});
