// testPerformance.js
const fs = require('fs');
const { generate_csv } = require('./Utils/generador_aleatorio');
const Process = require('./Utils/Process');

(async () => {
  try {
    // 1) Generar CSV de 100,000 Libros
    console.log("[1] Generando CSV de 100,000 libros...");
    let startTime = Date.now();
    const csvData = generate_csv(100000);
    fs.writeFileSync("libros_100k.csv", csvData);
    let endTime = Date.now();
    console.log(`[1] Tiempo de generación CSV: ${endTime - startTime} ms`);

    // 2) Insertar CSV masivamente (LOAD DATA INFILE) en MySQL
    console.log("[2] Insertando CSV masivamente a la tabla 'Libro'...");
    const loadProc = new Process("mysql", { shell: true });
    loadProc.ProcessArguments.push("-uA");        // Usuario A (ajusta)
    loadProc.ProcessArguments.push("-ppasswordA"); // Contraseña
    loadProc.Execute(true);

    loadProc.Write("USE biblioteca;\n");
    // Asegúrate de habilitar local_infile si MySQL lo necesita
    loadProc.Write(`
      LOAD DATA LOCAL INFILE 'libros_100k.csv'
      INTO TABLE Libro
      FIELDS TERMINATED BY ','
      LINES TERMINATED BY '\\n'
      (ISBN, title, autor_license, pages, year, language);
    `);
    loadProc.End();
    await loadProc.Finish();
    endTime = Date.now();
    console.log(`[2] Tiempo de inserción masiva: ${endTime - loadProc.StartTime} ms`);

    // 3) Insertar 3,500 Libros (estrés)
    console.log("[3] Insertando 3,500 libros (estrés)...");
    const stressProc = new Process("mysql", { shell: true });
    stressProc.ProcessArguments.push("-uA");
    stressProc.ProcessArguments.push("-ppasswordA");
    stressProc.Execute(true);

    stressProc.Write("USE biblioteca;\n");
    for (let i = 0; i < 3500; i++) {
      const isbn = Math.round(Math.random() * 9999999999);
      const title = "LibroEstres" + i;
      const pages = Math.floor(Math.random() * 1000);
      const year = 1950 + Math.floor(Math.random() * 75);
      const language = "ES";
      const query = `INSERT INTO Libro (ISBN, title, autor_license, pages, year, language)
                     VALUES ('${isbn}', '${title}', 'LICENSE123', ${pages}, ${year}, '${language}');\n`;
      stressProc.Write(query);
    }
    stressProc.End();
    await stressProc.Finish();
    endTime = Date.now();
    console.log(`[3] Tiempo en insertar 3,500: ${endTime - stressProc.StartTime} ms`);

    // 4) Generar 100 CSV de 1,000 Libros cada uno
    console.log("[4] Generando 100 CSV de 1,000 Libros cada uno...");
    startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      const chunkCSV = generate_csv(1000);
      fs.writeFileSync(`libros_${i}.csv`, chunkCSV);
    }
    endTime = Date.now();
    console.log(`[4] Tiempo en generar 100 CSV: ${endTime - startTime} ms`);

    // 5) Insertar esos 100 CSV en la tabla 'Libro'
    console.log("[5] Insertando 100 CSV en la tabla 'Libro'...");
    startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      const fileName = `libros_${i}.csv`;
      const p = new Process("mysql", { shell: true });
      p.ProcessArguments.push("-uA");
      p.ProcessArguments.push("-ppasswordA");
      p.Execute(true);

      p.Write("USE biblioteca;\n");
      p.Write(`
        LOAD DATA LOCAL INFILE '${fileName}'
        INTO TABLE Libro
        FIELDS TERMINATED BY ','
        LINES TERMINATED BY '\\n'
        (ISBN, title, autor_license, pages, year, language);
      `);
      p.End();
      await p.Finish();
    }
    endTime = Date.now();
    console.log(`[5] Tiempo total en insertar 100 CSV: ${endTime - startTime} ms`);

    // 6) Query agregado
    console.log("[6] Ejecutando query agregado...");
    const aggProc = new Process("mysql", { shell: true });
    aggProc.ProcessArguments.push("-uA");
    aggProc.ProcessArguments.push("-ppasswordA");
    aggProc.Execute(true);

    aggProc.Write("USE biblioteca;\n");
    aggProc.Write(`
      SELECT 
        MAX(pages) AS max_pages,
        MIN(pages) AS min_pages,
        AVG(pages) AS avg_pages,
        MAX(year) AS latest_year,
        MIN(year) AS oldest_year,
        COUNT(*) AS total_books
      FROM Libro;
    `);
    aggProc.End();
    await aggProc.Finish();
    endTime = Date.now();
    console.log(`[6] Tiempo query agregado: ${endTime - aggProc.StartTime} ms`);
    console.log("Resultado del query:\n", aggProc.Logs);

    console.log("¡Pruebas de rendimiento completadas!");
  } catch (err) {
    console.error("Error en testPerformance:", err);
  }
})();
