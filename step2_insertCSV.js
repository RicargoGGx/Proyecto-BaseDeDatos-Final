// step2_insertCSV.js
const fs = require('fs');
const path = require('path');
const Process = require('./Utils/Process');

(async () => {
  try {
    console.log("[STEP 2] Insertando CSV masivamente en tabla 'Libro'...");

    // Ruta del CSV
    const csvDir = path.join(__dirname, 'csv');
    const inputFile = path.join(csvDir, 'libros_100k.csv');

    // Verificar que el archivo exista
    if (!fs.existsSync(inputFile)) {
      throw new Error(`No se encontró el archivo: ${inputFile}`);
    }

    const startTime = Date.now();
    const loadProc = new Process("mysql", { shell: true });
    loadProc.ProcessArguments.push("-uA");         // Usuario A
    loadProc.ProcessArguments.push("-ppasswordA"); // Contraseña
    loadProc.Execute(true);

    loadProc.Write("USE biblioteca;\n");
    loadProc.Write(`
      LOAD DATA LOCAL INFILE '${inputFile.replace(/\\/g, '/')}'
      INTO TABLE Libro
      FIELDS TERMINATED BY ','
      LINES TERMINATED BY '\\n'
      (ISBN, title, autor_license, pages, year, language);
    `);

    loadProc.End();
    await loadProc.Finish();

    const endTime = Date.now();
    console.log(`[STEP 2] Tiempo total: ${endTime - startTime} ms`);
    console.log(`CSV '${inputFile}' insertado correctamente en 'Libro'.`);
  } catch (err) {
    console.error("Error en step2_insertCSV:", err);
  }
})();
