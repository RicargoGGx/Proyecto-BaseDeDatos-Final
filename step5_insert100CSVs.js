// step5_insert100CSVs.js
const fs = require('fs');
const path = require('path');
const Process = require('./Utils/Process');

(async () => {
  try {
    console.log("[STEP 5] Insertando 100 CSV en la tabla 'Libro'...");

    const csvDir = path.join(__dirname, 'csv');
    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      const fileName = `libros_${i}.csv`;
      const csvPath = path.join(csvDir, fileName);

      if (!fs.existsSync(csvPath)) {
        console.warn(`[STEP 5] El archivo no existe: ${csvPath}. Se omite.`);
        continue;
      }

      const p = new Process("mysql", { shell: true });
      // Agregar la opción para permitir LOAD DATA LOCAL INFILE
      p.ProcessArguments.push("--local-infile=1");
      p.ProcessArguments.push("-uA");
      p.ProcessArguments.push("-ppasswordA");
      p.Execute(true);

      p.Write("USE biblioteca;\n");
      p.Write(`
        LOAD DATA LOCAL INFILE '${csvPath.replace(/\\/g, '/')}'
        INTO TABLE Libro
        FIELDS TERMINATED BY ','
        LINES TERMINATED BY '\\n'
        (id, ISBN, title, autor_license, editorial, pages, year, genre, language, format, sinopsis, content);
      `);
      
      p.End();
      await p.Finish();

      console.log(`[STEP 5] Comando ejecutado: LOAD DATA LOCAL INFILE '${csvPath.replace(/\\/g, '/')}'`);
      console.log(`[STEP 5] Logs de salida (Archivo: ${fileName}):`, p.Logs);
      console.log(`[STEP 5] Errores (Archivo: ${fileName}):`, p.ErrorsLog);
    }

    const endTime = Date.now();
    console.log(`[STEP 5] Tiempo total: ${endTime - startTime} ms`);
    console.log("Los 100 CSV se han insertado correctamente en la tabla 'Libro'.");
  } catch (err) {
    console.error("Error en step5_insert100CSVs:", err);
  }
})();
