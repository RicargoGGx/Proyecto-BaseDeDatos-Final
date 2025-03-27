// step8_exportTablesCSV.js
const fs = require('fs');
const path = require('path');
const Process = require('./Utils/Process');

(async () => {
  try {
    console.log("[STEP 8] Exportando tablas Autor y Libro a CSV...");

    // Asegúrate de que tu MySQL tenga permiso para escribir OUTFILE
    // en la ruta que especifiques. Por defecto, MySQL escribe en el servidor
    // (no en la carpeta local del cliente). 
    // Si estás en Windows, revisa secure-file-priv en my.ini

    // 1) Exportar Autor a CSV
    const csvDir = path.join(__dirname, 'csv');
    const authorCSV = 'autor_export.csv'; // Nombre en disco del servidor MySQL
    const authorCSVPath = path.join(csvDir, authorCSV);

    let startTime = Date.now();
    const exportAutor = new Process("mysql", { shell: true });
    exportAutor.ProcessArguments.push("-uB");
    exportAutor.ProcessArguments.push("-ppasswordB");
    exportAutor.Execute(true);

    // Ten en cuenta que 'secure-file-priv' suele requerir
    // que /var/lib/mysql-files (Linux) sea la ruta real. 
    // Este es un ejemplo simplificado (podría causar error si MySQL no deja).
    exportAutor.Write("USE biblioteca;\n");
    exportAutor.Write(`
      SELECT id, license, name, lastName, secondLastName, year
      INTO OUTFILE 'C:/tmp/autor_export.csv'
      FIELDS TERMINATED BY ','
      LINES TERMINATED BY '\\n'
      FROM Autor;
    `);
    exportAutor.End();
    await exportAutor.Finish();
    let endTime = Date.now();
    console.log(`[Autor CSV] Tiempo Export: ${endTime - exportAutor.StartTime} ms`);

    // (Opcional) Mover el archivo desde 'C:/tmp/autor_export.csv' a './csv/autor_export.csv'
    // si tu MySQL sí dejó crearlo. 
    // fs.renameSync("C:/tmp/autor_export.csv", authorCSVPath);

    // 2) Exportar Libro a CSV
    const libroCSV = 'libro_export.csv';
    const libroCSVPath = path.join(csvDir, libroCSV);

    startTime = Date.now();
    const exportLibro = new Process("mysql", { shell: true });
    exportLibro.ProcessArguments.push("-uA");          // A tiene SELECT en Autor y Libro, B también, elige
    exportLibro.ProcessArguments.push("-ppasswordA");  
    exportLibro.Execute(true);

    exportLibro.Write("USE biblioteca;\n");
    exportLibro.Write(`
      SELECT id, ISBN, title, autor_license, editorial, pages, year, genre, language, format, sinopsis, content
      INTO OUTFILE 'C:/tmp/libro_export.csv'
      FIELDS TERMINATED BY ','
      LINES TERMINATED BY '\\n'
      FROM Libro;
    `);
    exportLibro.End();
    await exportLibro.Finish();
    endTime = Date.now();
    console.log(`[Libro CSV] Tiempo Export: ${endTime - startTime} ms`);

    // fs.renameSync("C:/tmp/libro_export.csv", libroCSVPath);

    console.log("Tablas Autor y Libro exportadas a CSV correctamente.");
  } catch (err) {
    console.error("Error en step8_exportTablesCSV:", err);
  }
})();
