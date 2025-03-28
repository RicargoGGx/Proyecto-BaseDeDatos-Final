const fs = require('fs');
const path = require('path');
const Process = require('./Utils/Process');
const { saveMetric } = require('./Utils/metrics');

module.exports = async () => {
  try {
    console.log("[STEP 5] Insertando 100 CSV en la tabla 'Libro'...");
    
    const csvDir = path.join(__dirname, 'csv');
    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      const fileName = `libros_${i.toString().padStart(2, '0')}.csv`;
      const csvPath = path.join(csvDir, fileName);

      if (!fs.existsSync(csvPath)) {
        console.warn(`[STEP 5] Archivo no encontrado: ${fileName}. Se omite.`);
        continue;
      }

      const p = new Process("mysql", { shell: true });
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

      // Mostrar progreso cada 10 archivos
      if ((i + 1) % 10 === 0) {
        console.log(`[STEP 5] Procesados ${i + 1}/100 archivos...`);
      }
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Guardar solo el tiempo de ejecución
    saveMetric('step5', 'insert_100_csvs', executionTime);

    console.log(`[STEP 5] Tiempo total: ${executionTime} ms`);
    console.log("[STEP 5] Proceso completado.");
    
    return executionTime;
  } catch (err) {
    console.error("Error en step5_insert100CSVs:", err);
    throw err;
  }
};