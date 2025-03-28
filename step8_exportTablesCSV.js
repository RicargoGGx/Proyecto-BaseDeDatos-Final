// step8_exportTablesCSV.js
const fs = require('fs');
const path = require('path');
const Process = require('./Utils/Process');

(async () => {
  try {
    console.log("[STEP 8] Exportando tablas Autor y Libro a CSV...");

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
    console.log(`[STEP 8] Export Autor completado en: ${endTimeAutor - startTimeAutor} ms`);

    // Exportar tabla Libro
    const startTimeLibro = Date.now();
    const exportLibro = new Process("mysql", { shell: true });
    exportLibro.ProcessArguments.push("-uA");
    exportLibro.ProcessArguments.push("-ppasswordA");
    exportLibro.Execute(true);
    exportLibro.Write("USE biblioteca;\n");
    exportLibro.Write(`
      SELECT id, ISBN, title, autor_license, editorial, pages, year, genre, language, format, sinopsis, content
      INTO OUTFILE '${libroExportServer}'
      FIELDS TERMINATED BY ','
      LINES TERMINATED BY '\\n'
      FROM Libro;
    `);
    exportLibro.End();
    await exportLibro.Finish();
    const endTimeLibro = Date.now();
    console.log(`[STEP 8] Export Libro completado en: ${endTimeLibro - startTimeLibro} ms`);

    // Ruta de la carpeta local para guardar los archivos exportados
    const exportFolderLocal = path.join(__dirname, 'csv', 'exports');
    if (!fs.existsSync(exportFolderLocal)) {
      fs.mkdirSync(exportFolderLocal, { recursive: true });
      console.log("[STEP 8] Carpeta local 'csv/exports' creada.");
    }
    const autorExportLocal = path.join(exportFolderLocal, 'autor_export.csv');
    const libroExportLocal = path.join(exportFolderLocal, 'libro_export.csv');

    // Verificar y copiar el archivo Autor
    if (!fs.existsSync(autorExportServer)) {
      console.error("[STEP 8] No se encontró el archivo exportado para Autor en:", autorExportServer);
    } else {
      fs.copyFileSync(autorExportServer, autorExportLocal);
      console.log("[STEP 8] Archivo Autor exportado copiado a:", autorExportLocal);
    }

    // Verificar y copiar el archivo Libro
    if (!fs.existsSync(libroExportServer)) {
      console.error("[STEP 8] No se encontró el archivo exportado para Libro en:", libroExportServer);
    } else {
      fs.copyFileSync(libroExportServer, libroExportLocal);
      console.log("[STEP 8] Archivo Libro exportado copiado a:", libroExportLocal);
    }

    console.log("[STEP 8] Exportación completa.");
    console.log("Archivo Autor CSV (local):", autorExportLocal);
    console.log("Archivo Libro CSV (local):", libroExportLocal);
  } catch (err) {
    console.error("Error en step8_exportTablesCSV:", err);
  }
})();
