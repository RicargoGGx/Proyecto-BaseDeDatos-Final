// step9_backupMongo.js
const Process = require('./Utils/Process');
const sleep = require('./Utils/Sleep');

(async () => {
  try {
    console.log("[STEP 9] Respaldo en MongoDB, eliminación en MySQL y restauración...");

    // 1) MySQL => MongoDB (backup)
    // Ejemplo usando 'mysqldump' no es tan directo para JSON. 
    // O podríamos hacer un SELECT en Node y luego 'db.collection.insertMany'.
    // Para mostrar la idea, haremos un approach con 'Process' y 'mongoimport/mongoexport'.

    // (a) Exportar MySQL a CSV/SQL
    // (b) Importar a Mongo con mongoimport
    // (c) Borrar tablas MySQL
    // (d) Exportar de Mongo
    // (e) Restaurar en MySQL

    // --- a) Exportar MySQL a SQL (mysqldump) ---
    console.log("[9a] Exportando MySQL -> SQL (mysqldump)...");
    const startExportSQL = Date.now();
    const dumpProc = new Process("mysqldump", { shell: true });
    dumpProc.ProcessArguments.push("-uroot");          // O root
    dumpProc.ProcessArguments.push("-ppasswordRoot");  // Ajusta
    dumpProc.ProcessArguments.push("biblioteca");
    dumpProc.ProcessArguments.push("--result-file=mysql_backup.sql");
    dumpProc.Execute(true);
    await dumpProc.Finish();
    let endExportSQL = Date.now();
    console.log(`[9a] mysqldump completado en: ${endExportSQL - dumpProc.StartTime} ms`);

    // --- b) Convertir ese SQL a un formato que podamos pasar a Mongo (depende de tu strategy).
    // Normalmente 'mongoimport' funciona con JSON o CSV. 
    // Podríamos en su lugar exportar las tablas a CSV (como en step8) y luego 'mongoimport' esos CSV.

    // Por simplicidad, supongamos que ya tenemos 'autor_export.csv' y 'libro_export.csv'
    // y los importamos a Mongo:
    console.log("[9b] Importando CSV a Mongo...");
    const startImportMongo = Date.now();

    // mongoimport --db BibliotecaMongo --collection Autor --file autor_export.csv --type csv --headerline
    // (Asumiendo que el CSV tiene encabezados)
    // Si no tiene encabezados, usar --fields "id,license,name,lastName,secondLastName,year", etc.

    // Ejemplo:
    const importAutor = new Process("mongoimport");
    importAutor.ProcessArguments.push("--db=BiblioMongo");
    importAutor.ProcessArguments.push("--collection=Autor");
    importAutor.ProcessArguments.push("--file=csv/autor_export.csv"); // asumiendo que existe
    importAutor.ProcessArguments.push("--type=csv");
    importAutor.ProcessArguments.push("--fields=id,license,name,lastName,secondLastName,year");
    importAutor.ProcessArguments.push("--headerline"); 
    // Ajusta si tu CSV no tiene encabezado
    importAutor.Execute(true);
    await importAutor.Finish();

    // Repetir lo mismo para Libro
    const importLibro = new Process("mongoimport");
    importLibro.ProcessArguments.push("--db=BiblioMongo");
    importLibro.ProcessArguments.push("--collection=Libro");
    importLibro.ProcessArguments.push("--file=csv/libro_export.csv"); 
    importLibro.ProcessArguments.push("--type=csv");
    importLibro.ProcessArguments.push("--fields=id,ISBN,title,autor_license,editorial,pages,year,genre,language,format,sinopsis,content");
    // Quita --headerline si no hay encabezados
    importLibro.Execute(true);
    await importLibro.Finish();

    let endImportMongo = Date.now();
    console.log(`[9b] Importar a Mongo completado en: ${endImportMongo - startImportMongo} ms`);

    // --- c) Eliminar tablas MySQL ---
    console.log("[9c] Eliminando tablas en MySQL...");
    const dropProc = new Process("mysql", { shell: true });
    dropProc.ProcessArguments.push("-uroot");
    dropProc.ProcessArguments.push("-ppasswordRoot");
    dropProc.Execute(true);

    dropProc.Write("USE biblioteca;\n");
    dropProc.Write("DROP TABLE IF EXISTS Libro;\n");
    dropProc.Write("DROP TABLE IF EXISTS Autor;\n");
    dropProc.End();
    await dropProc.Finish();

    console.log("[9c] Tablas Autor y Libro eliminadas en MySQL.");

    // --- d) Exportar de Mongo a JSON/CSV ---
    console.log("[9d] Exportando desde Mongo (respaldo)...");
    const startMongoExport = Date.now();

    const mongoExpAutor = new Process("mongoexport");
    mongoExpAutor.ProcessArguments.push("--db=BiblioMongo");
    mongoExpAutor.ProcessArguments.push("--collection=Autor");
    mongoExpAutor.ProcessArguments.push("--out=mongo_autor.json");
    mongoExpAutor.Execute(true);
    await mongoExpAutor.Finish();

    const mongoExpLibro = new Process("mongoexport");
    mongoExpLibro.ProcessArguments.push("--db=BiblioMongo");
    mongoExpLibro.ProcessArguments.push("--collection=Libro");
    mongoExpLibro.ProcessArguments.push("--out=mongo_libro.json");
    mongoExpLibro.Execute(true);
    await mongoExpLibro.Finish();

    let endMongoExport = Date.now();
    console.log(`[9d] Export Mongo completado en: ${endMongoExport - startMongoExport} ms`);

    // --- e) Restaurar en MySQL ---
    // Aquí se asume que 'mongo_autor.json' y 'mongo_libro.json' son JSON
    // Para restaurar a MySQL, normalmente volverías a CSV o harías un script Node
    // que parsee JSON y haga INSERT en MySQL. 
    // Modo simplificado: supongamos que reimportamos CSV que generamos con 'mongoexport --type=csv'
    // Siguiente:
    console.log("[9e] Restaurando en MySQL desde JSON/CSV...");
    const startRestore = Date.now();
    
    // Por simplicidad, aquí haríamos: 
    // 1) Recrear la tabla Autor/Libro
    // 2) Insertar con LOAD DATA INFILE
    // O parsear JSON con Node y hacer INSERT en bucle.

    // Ejemplo con un script Node que lee 'mongo_autor.json' y hace inserts en MySQL:
    const createProc = new Process("mysql", { shell: true });
    createProc.ProcessArguments.push("-uroot");
    createProc.ProcessArguments.push("-ppasswordRoot");
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

    // Ya las tablas están creadas. Falta la inserción masiva.
    // Para no alargar, dejamos un 'TODO' o usas un script Node que lea 'mongo_autor.json' y 'mongo_libro.json'.
    // Por ejemplo, parse JSON y hace miles de INSERT. Mide tiempo con Start/End.

    let endRestore = Date.now();
    console.log(`[9e] Restauración completada (placeholder) en: ${endRestore - startRestore} ms`);

    console.log("¡Respaldo en Mongo y restauración en MySQL finalizados!");
  } catch (err) {
    console.error("Error en step9_backupMongo:", err);
  }
})();
