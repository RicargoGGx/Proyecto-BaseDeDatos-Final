// step12_mongoMillion.js
const Process = require('./Utils/Process');
const fs = require('fs');
const path = require('path');

// Si quieres generar datos en CSV para luego mongoimport, o generarlos
// con un script Node que usa "mongosh" o tu preferencia. 
// Aquí un approach con "mongoimport":

(async () => {
  try {
    console.log("[STEP 12] Insertar 1,000,000 Libros en MongoDB y exportar CSV de ISBN, year, pages...");

    // 1) Generar un CSV con 1 millón de libros (solo ISBN, year, pages)
    //    y luego importarlo a Mongo
    const csvDir = path.join(__dirname, 'csv');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir);
    }

    const csvFile = path.join(csvDir, 'libros_millon.csv');
    console.log("[12a] Generando CSV con 1,000,000 Libros (ISBN, year, pages)...");
    let startTime = Date.now();

    let csv = "";
    for (let i = 0; i < 1000000; i++) {
      const isbn = Math.floor(Math.random() * 9999999999);
      const year = 1900 + Math.floor(Math.random() * 125);
      const pages = 50 + Math.floor(Math.random() * 950);
      // form: isbn,year,pages
      csv += `${isbn},${year},${pages}\n`;
    }
    fs.writeFileSync(csvFile, csv);

    let endTime = Date.now();
    console.log(`[12a] Tiempo generar CSV: ${endTime - startTime} ms`);

    // 2) Importar a Mongo
    console.log("[12b] Importando a MongoDB (colección 'LibrosMillon')...");
    startTime = Date.now();
    const importProc = new Process("mongoimport");
    importProc.ProcessArguments.push("--db=BiblioMongo");
    importProc.ProcessArguments.push("--collection=LibrosMillon");
    importProc.ProcessArguments.push(`--file=${csvFile}`);
    importProc.ProcessArguments.push("--type=csv");
    importProc.ProcessArguments.push("--fields=isbn,year,pages");
    // No headerline => definimos fields manualmente
    importProc.Execute(true);
    await importProc.Finish();
    endTime = Date.now();
    console.log(`[12b] Tiempo import Mongo: ${endTime - startTime} ms`);

    // 3) Exportar SOLO ISBN, year, pages a un CSV
    //    con "mongoexport" => 
    //    or re-use the same CSV (since that's all we inserted).
    //    Pero supongamos que ya lo tenemos en la coleccion, 
    //    y lo exportamos con mongoexport:
    console.log("[12c] Exportar ISBN,year,pages a CSV desde Mongo...");
    const outCSV = path.join(csvDir, 'mongo_libros_reduced.csv');
    startTime = Date.now();
    const exportProc = new Process("mongoexport");
    exportProc.ProcessArguments.push(`--db=BiblioMongo`);
    exportProc.ProcessArguments.push(`--collection=LibrosMillon`);
    exportProc.ProcessArguments.push(`--out=${outCSV}`);
    exportProc.ProcessArguments.push(`--type=csv`);
    exportProc.ProcessArguments.push(`--fields=isbn,year,pages`);
    exportProc.Execute(true);
    await exportProc.Finish();
    endTime = Date.now();
    console.log(`[12c] Tiempo export Mongo => CSV: ${endTime - startTime} ms`);

    // 4) Crear la tabla old_books en MySQL e importar
    console.log("[12d] Creando tabla old_books e importando CSV...");
    // (a) Crear la tabla
    const createProc = new Process("mysql", { shell: true });
    createProc.ProcessArguments.push("-uroot");
    createProc.ProcessArguments.push("-ppassword123");
    createProc.Execute(true);

    createProc.Write("USE biblioteca;\n");
    createProc.Write(`
      CREATE TABLE IF NOT EXISTS old_books (
        isbn VARCHAR(16),
        year SMALLINT,
        pages SMALLINT
      );
    `);
    createProc.End();
    await createProc.Finish();

    // (b) LOAD DATA INFILE
    const loadProc = new Process("mysql", { shell: true });
    loadProc.ProcessArguments.push("-uroot");
    loadProc.ProcessArguments.push("-ppassword123");
    loadProc.ProcessArguments.push("--local-infile=1");
    loadProc.Execute(true);

    startTime = Date.now();
    loadProc.Write("USE biblioteca;\n");
    loadProc.Write(`
      LOAD DATA LOCAL INFILE '${csvFile.replace(/\\/g, '/')}'
      INTO TABLE old_books
      FIELDS TERMINATED BY ','
      LINES TERMINATED BY '\\n'
      (isbn, year, pages);
    `);
    loadProc.End();
    await loadProc.Finish();
    endTime = Date.now();
    console.log(`[12d] Tiempo import CSV => old_books: ${endTime - startTime} ms`);

    console.log("¡Paso 12 completado con éxito!");
  } catch (err) {
    console.error("Error en step12_mongoMillion:", err);
  }
})();
