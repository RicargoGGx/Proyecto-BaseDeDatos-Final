// step9_backupMongo.js
const fs = require('fs');
const path = require('path');
const Process = require('./Utils/Process');
const sleep = require('./Utils/Sleep');

// Configuración para lotes (ajusta según convenga)
const BATCH_SIZE = 100;
const BATCH_SLEEP_MS = 0.2; // en segundos (0.2 s = 200 ms)

(async () => {
  try {
    console.log("[STEP 9] Iniciando respaldo en MongoDB, eliminación en MySQL y restauración completa...");

    // --- (a) Exportar base de datos "biblioteca" a un dump SQL ---
    console.log("[9a] Ejecutando mysqldump de 'biblioteca'...");
    const dumpProc = new Process("mysqldump", { shell: true });
    dumpProc.ProcessArguments.push("-uroot");
    dumpProc.ProcessArguments.push("-pR4bb1t");
    dumpProc.ProcessArguments.push("biblioteca");
    const snapshotPath = path.join(__dirname, "mysql_backup.sql");
    dumpProc.ProcessArguments.push(`--result-file=${snapshotPath}`);
    dumpProc.Execute(true);
    await dumpProc.Finish();
    console.log("[9a] mysqldump completado.");
    if (fs.existsSync(snapshotPath)) {
      const stats = fs.statSync(snapshotPath);
      console.log(`[9a] Snapshot guardado en: ${snapshotPath} (${stats.size} bytes)`);
    } else {
      console.error("[9a] ERROR: No se creó el archivo de dump.");
      return;
    }

    // --- (b) Importar CSV exportados a MongoDB (no afecta la restauración directa desde JSON) ---
    console.log("[9b] Importando CSV exportados a MongoDB...");
    const mongoImportPath = "C:/MongoBin/mongoimport.exe"; // Ajusta esta ruta
    {
      const importAutor = new Process(mongoImportPath, { shell: true });
      importAutor.ProcessArguments.push("--verbose");
      importAutor.ProcessArguments.push("--db=BiblioMongo");
      importAutor.ProcessArguments.push("--collection=Autor");
      importAutor.ProcessArguments.push("--file=csv/exports/autor_export.csv");
      importAutor.ProcessArguments.push("--type=csv");
      importAutor.ProcessArguments.push("--headerline");
      importAutor.Execute(true);
      await importAutor.Finish();
      console.log("[9b] Import Autor a MongoDB completado. Logs:", importAutor.Logs);
    }
    {
      const importLibro = new Process(mongoImportPath, { shell: true });
      importLibro.ProcessArguments.push("--verbose");
      importLibro.ProcessArguments.push("--db=BiblioMongo");
      importLibro.ProcessArguments.push("--collection=Libro");
      importLibro.ProcessArguments.push("--file=csv/exports/libro_export.csv");
      importLibro.ProcessArguments.push("--type=csv");
      importLibro.ProcessArguments.push("--fields=id,ISBN,title,autor_license,editorial,pages,year,genre,language,format,sinopsis,content");
      importLibro.Execute(true);
      await importLibro.Finish();
      console.log("[9b] Import Libro a MongoDB completado. Logs:", importLibro.Logs);
    }

    // --- (c) Eliminar tablas "Libro" y "Autor" en MySQL ---
    console.log("[9c] Eliminando tablas 'Libro' y 'Autor' en MySQL...");
    {
      const dropProc = new Process("mysql", { shell: true });
      dropProc.ProcessArguments.push("-uroot");
      dropProc.ProcessArguments.push("-pR4bb1t");
      dropProc.Execute(true);
      dropProc.Write("USE biblioteca;\n");
      dropProc.Write("DROP TABLE IF EXISTS Libro;\n");
      dropProc.Write("DROP TABLE IF EXISTS Autor;\n");
      dropProc.End();
      await dropProc.Finish();
      console.log("[9c] Tablas eliminadas en MySQL.");
    }

    // --- (d) Exportar las colecciones de MongoDB a JSON ---
    console.log("[9d] Exportando colecciones de MongoDB a JSON...");
    const mongoExportPath = "C:/MongoBin/mongoexport.exe"; // Ajusta esta ruta
    {
      const expAutor = new Process(mongoExportPath, { shell: true });
      expAutor.ProcessArguments.push("--db=BiblioMongo");
      expAutor.ProcessArguments.push("--collection=Autor");
      expAutor.ProcessArguments.push("--out=mongo_autor.json");
      expAutor.Execute(true);
      await expAutor.Finish();
    }
    {
      const expLibro = new Process(mongoExportPath, { shell: true });
      expLibro.ProcessArguments.push("--db=BiblioMongo");
      expLibro.ProcessArguments.push("--collection=Libro");
      expLibro.ProcessArguments.push("--out=mongo_libro.json");
      expLibro.Execute(true);
      await expLibro.Finish();
    }
    console.log("[9d] Exportación de MongoDB completada (mongo_autor.json y mongo_libro.json).");

    // --- (e) Restaurar en MySQL desde archivos JSON directamente ---
    console.log("[9e] Restaurando en MySQL desde archivos JSON...");
    // 1) Re-crea las tablas en MySQL
    {
      const createProc = new Process("mysql", { shell: true });
      createProc.ProcessArguments.push("-uroot");
      createProc.ProcessArguments.push("-pR4bb1t");
      createProc.Execute(true);
      createProc.Write("USE biblioteca;\n");
      createProc.Write(`
        CREATE TABLE Autor(
          id INT,
          license VARCHAR(12) NOT NULL PRIMARY KEY,
          name TINYTEXT NOT NULL,
          lastName TINYTEXT,
          secondLastName TINYTEXT,
          year SMALLINT
        );
        CREATE TABLE Libro(
          id INT,
          ISBN VARCHAR(16) NOT NULL,
          title VARCHAR(512) NOT NULL,
          autor_license VARCHAR(12),
          editorial TINYTEXT,
          pages SMALLINT,
          year SMALLINT NOT NULL,
          genre TINYTEXT,
          language TINYTEXT NOT NULL,
          format TINYTEXT,
          sinopsis TEXT,
          content TEXT,
          FOREIGN KEY (autor_license) REFERENCES Autor(license)
        );
      `);
      createProc.End();
      await createProc.Finish();
      console.log("[9e] Tablas recreadas en MySQL.");
    }

    // 2) Importar datos para Autor desde mongo_autor.json (directamente, sin conversión a CSV)
    {
      const autorJsonPath = path.join(__dirname, "mongo_autor.json");
      const autorContent = fs.readFileSync(autorJsonPath, "utf8");
      const autorLines = autorContent.split("\n").filter(l => l.trim() !== "");
      console.log(`[9e] Registros en mongo_autor.json: ${autorLines.length}`);

      const autorProc = new Process("mysql", { shell: true });
      autorProc.ProcessArguments.push("-uroot");
      autorProc.ProcessArguments.push("-pR4bb1t");
      autorProc.Execute(true);
      autorProc.Write("USE biblioteca;\n");

      let batchVals = [];
      for (let i = 0; i < autorLines.length; i++) {
        try {
          const doc = JSON.parse(autorLines[i]);
          const id = doc.id || 0;
          const license = String(doc.license || "").replace(/'/g, "''");
          const name = String(doc.name || "").replace(/'/g, "''");
          const lastName = String(doc.lastName || "").replace(/'/g, "''");
          const secondLastName = String(doc.secondLastName || "").replace(/'/g, "''");
          const year = doc.year || 0;
          batchVals.push(`(${id},'${license}','${name}','${lastName}','${secondLastName}',${year})`);
        } catch(e) {
          console.error("[9e] Error parseando JSON Autor:", e);
        }
        if (batchVals.length >= BATCH_SIZE) {
          const query = `INSERT INTO Autor (id, license, name, lastName, secondLastName, year) VALUES ${batchVals.join(", ")};`;
          autorProc.Write(query + "\n");
          batchVals = [];
          await sleep(BATCH_SLEEP_MS);
        }
      }
      if (batchVals.length > 0) {
        const query = `INSERT INTO Autor (id, license, name, lastName, secondLastName, year) VALUES ${batchVals.join(", ")};`;
        autorProc.Write(query + "\n");
      }
      autorProc.End();
      await autorProc.Finish();
      console.log("[9e] Datos de Autor importados desde JSON.");
    }

    // 3) Importar datos para Libro desde mongo_libro.json directamente
    {
      const libroJsonPath = path.join(__dirname, "mongo_libro.json");
      const libroContent = fs.readFileSync(libroJsonPath, "utf8");
      const libroLines = libroContent.split("\n").filter(l => l.trim() !== "");
      console.log(`[9e] Registros en mongo_libro.json: ${libroLines.length}`);

      const libroProc = new Process("mysql", { shell: true });
      libroProc.ProcessArguments.push("-uroot");
      libroProc.ProcessArguments.push("-pR4bb1t");
      libroProc.Execute(true);
      libroProc.Write("USE biblioteca;\n");

      let batchVals = [];
      for (let i = 0; i < libroLines.length; i++) {
        try {
          const doc = JSON.parse(libroLines[i]);
          const id = doc.id || 0;
          const ISBN = String(doc.ISBN || "").replace(/'/g, "''");
          const title = String(doc.title || "").replace(/'/g, "''");
          const autor_license = String(doc.autor_license || "").replace(/'/g, "''");
          const editorial = String(doc.editorial || "").replace(/'/g, "''");
          const pages = doc.pages || 0;
          const year = doc.year || 0;
          const genre = String(doc.genre || "").replace(/'/g, "''");
          const language = String(doc.language || "").replace(/'/g, "''");
          const format = String(doc.format || "").replace(/'/g, "''");
          const sinopsis = String(doc.sinopsis || "").replace(/'/g, "''");
          const content = String(doc.content || "").replace(/'/g, "''");
          batchVals.push(`(${id},'${ISBN}','${title}','${autor_license}','${editorial}',${pages},${year},'${genre}','${language}','${format}','${sinopsis}','${content}')`);
        } catch(e) {
          console.error("[9e] Error parseando JSON Libro:", e);
        }
        if (batchVals.length >= BATCH_SIZE) {
          const query = `INSERT INTO Libro (id, ISBN, title, autor_license, editorial, pages, year, genre, language, format, sinopsis, content)
VALUES ${batchVals.join(", ")};`;
          libroProc.Write(query + "\n");
          batchVals = [];
          await sleep(BATCH_SLEEP_MS);
        }
      }
      if (batchVals.length > 0) {
        const query = `INSERT INTO Libro (id, ISBN, title, autor_license, editorial, pages, year, genre, language, format, sinopsis, content)
VALUES ${batchVals.join(", ")};`;
        libroProc.Write(query + "\n");
      }
      libroProc.End();
      await libroProc.Finish();
      console.log("[9e] Datos de Libro importados desde JSON.");
    }

    const endRestore = Date.now();
    console.log(`[9e] Restauración completa. Tiempo total: ${endRestore} ms`);
    console.log("¡Respaldo en Mongo y restauración en MySQL finalizados (con restauración completa)!");
  } catch (err) {
    console.error("Error en step9_backupMongo:", err);
  }
})();
