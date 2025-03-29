const fs = require('fs');
const path = require('path');
const Process = require('./Utils/Process');
const { saveMetric } = require('./Utils/metrics');

module.exports = async () => {
  try {
    console.log("[STEP 8] Exportando tablas Autor y Libro a CSV...");
    const stepStartTime = Date.now(); // Tiempo de inicio del step completo

    // Ruta permitida por secure_file_priv
    const secureFolder = "C:/MySQL/Uploads";
    const autorExportServer = path.join(secureFolder, 'autor_export.csv'); 
    const libroExportServer = path.join(secureFolder, 'libro_export.csv');

    // Exportar tabla Autor
    const startTimeAutor = Date.now();
    const exportAutor = new Process("mysql", { shell: true });
    exportAutor.ProcessArguments.push("-uB");
    exportAutor.ProcessArguments.push("-ppasswordB");
    exportAutor.Execute(true);
    exportAutor.Write("USE biblioteca;\n");
    exportAutor.Write(`
      SELECT id, license, name, lastName, secondLastName, year
      INTO OUTFILE '${autorExportServer}'
      FIELDS TERMINATED BY ','
      LINES TERMINATED BY '\\n'
      FROM Autor;
    `);
    exportAutor.End();
    await exportAutor.Finish();
    const endTimeAutor = Date.now();
    const autorExportTime = endTimeAutor - startTimeAutor;
    console.log(`[STEP 8] Export Autor completado en: ${autorExportTime} ms`);

    // Exportar tabla Libro
    const startTimeLibro = Date.now();
    const exportLibro = new Process("mysql", { shell: true });
    exportLibro.ProcessArguments.push("-uA");
    exportLibro.ProcessArguments.push("-ppasswordA");
    exportLibro.Execute(true);
    exportLibro.Write("USE biblioteca;\n");
    exportLibro.Write(`
      SELECT 
        id, 
        ISBN, 
        REPLACE(REPLACE(title, '"', '""'), 
        autor_license, 
        editorial, 
        pages, 
        year, 
        genre, 
        language, 
        format, 
        REPLACE(REPLACE(sinopsis, '"', '""'), 
        REPLACE(REPLACE(REPLACE(content, '"', '""'), '\\n', '\\\\n')
      INTO OUTFILE '${libroExportServer}'
      FIELDS TERMINATED BY ',' 
      OPTIONALLY ENCLOSED BY '"'
      LINES TERMINATED BY '\\r\\n'
      CHARACTER SET utf8mb4
      FROM Libro;
    `);
    exportLibro.End();
    await exportLibro.Finish();
    const endTimeLibro = Date.now();
    const libroExportTime = endTimeLibro - startTimeLibro;
    console.log(`[STEP 8] Export Libro completado en: ${libroExportTime} ms`);

    // Ruta de la carpeta local para guardar los archivos exportados
    const exportFolderLocal = path.join(__dirname, 'csv', 'exports');
    if (!fs.existsSync(exportFolderLocal)) {
      fs.mkdirSync(exportFolderLocal, { recursive: true });
      console.log("[STEP 8] Carpeta local 'csv/exports' creada.");
    }
    const autorExportLocal = path.join(exportFolderLocal, 'autor_export.csv');
    const libroExportLocal = path.join(exportFolderLocal, 'libro_export.csv');

    // Copiar archivos exportados a la carpeta local
    const copyStartTime = Date.now();
    let copyTime = 0;
    
    if (!fs.existsSync(autorExportServer)) {
      console.error("[STEP 8] No se encontró el archivo exportado para Autor en:", autorExportServer);
    } else {
      fs.copyFileSync(autorExportServer, autorExportLocal);
      console.log("[STEP 8] Archivo Autor exportado copiado a:", autorExportLocal);
    }

    if (!fs.existsSync(libroExportServer)) {
      console.error("[STEP 8] No se encontró el archivo exportado para Libro en:", libroExportServer);
    } else {
      fs.copyFileSync(libroExportServer, libroExportLocal);
      console.log("[STEP 8] Archivo Libro exportado copiado a:", libroExportLocal);
    }
    
    copyTime = Date.now() - copyStartTime;

    // Calcular tiempo total del step
    const stepEndTime = Date.now();
    const stepTotalTime = stepEndTime - stepStartTime;
    
    // Guardar métricas
    //saveMetric('step8', 'export_autor', autorExportTime);
    //saveMetric('step8', 'export_libro', libroExportTime);
    //saveMetric('step8', 'copy_files', copyTime);
    saveMetric('step8', 'total_time', stepTotalTime);

    console.log("[STEP 8] Exportación completa.");
    console.log(`[STEP 8] Tiempo total del step: ${stepTotalTime} ms`);
    console.log("Archivo Autor CSV (local):", autorExportLocal);
    console.log("Archivo Libro CSV (local):", libroExportLocal);
    
    return {
      autorExportTime,
      libroExportTime,
      copyTime,
      totalTime: stepTotalTime
    };
  } catch (err) {
    console.error("Error en step8_exportTablesCSV:", err);
    throw err;
  }
};