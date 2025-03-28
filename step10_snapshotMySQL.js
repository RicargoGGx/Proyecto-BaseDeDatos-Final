// step10_snapshotMySQL.js
const Process = require('./Utils/Process');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    // Definimos la ruta del snapshot en la carpeta actual del proyecto
    const snapshotPath = path.join(__dirname, "mysql_backup.sql");
    
    console.log("[STEP 10] Iniciando generación del snapshot (mysqldump) de la base de datos 'biblioteca'...");
    const startDump = Date.now();
    const dumpProc = new Process("mysqldump", { shell: true });
    dumpProc.ProcessArguments.push("-uroot");
    dumpProc.ProcessArguments.push("-pR4bb1t");
    dumpProc.ProcessArguments.push("biblioteca");
    dumpProc.ProcessArguments.push(`--result-file=${snapshotPath}`);
    dumpProc.Execute(true);
    await dumpProc.Finish();
    const endDump = Date.now();
    console.log(`[STEP 10] mysqldump completado en: ${endDump - dumpProc.StartTime} ms`);

    // Verificar si el archivo del snapshot existe y su tamaño
    if (fs.existsSync(snapshotPath)) {
      const stats = fs.statSync(snapshotPath);
      console.log(`[STEP 10] Snapshot guardado en: ${snapshotPath}`);
      console.log(`[STEP 10] Tamaño del snapshot: ${stats.size} bytes`);
    } else {
      console.error("[STEP 10] ERROR: No se encontró el archivo del snapshot en:", snapshotPath);
      return;
    }
    
    // Importar el snapshot en la base de datos "biblioteca_test"
    console.log("[STEP 10] Importando snapshot en la base de datos 'biblioteca_test'...");
    const startImport = Date.now();
    const importProc = new Process("mysql", { shell: true });
    importProc.ProcessArguments.push("-uroot");
    importProc.ProcessArguments.push("-pR4bb1t");
    importProc.ProcessArguments.push("biblioteca_test");
    importProc.Execute(true);
    // Utilizamos el comando SOURCE para cargar el archivo
    importProc.Write(`SOURCE ${snapshotPath};\n`);
    importProc.End();
    await importProc.Finish();
    const endImport = Date.now();
    console.log(`[STEP 10] Import completado en: ${endImport - importProc.StartTime} ms`);

    console.log("¡Snapshot (dump + import) completado!");
  } catch (err) {
    console.error("Error en step10_snapshotMySQL:", err);
  }
})();
