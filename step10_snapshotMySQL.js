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
    dumpProc.ProcessArguments.push("-ppassword123");
    dumpProc.ProcessArguments.push("biblioteca");
    dumpProc.ProcessArguments.push(`--result-file=${snapshotPath}`);
    dumpProc.Execute(true);
    await dumpProc.Finish();
    const endDump = Date.now();
    console.log(`[STEP 10] mysqldump completado en: ${(endDump - startDump)/1000} segundos`);

    // Verificar si el archivo del snapshot existe y su tamaño
    if (fs.existsSync(snapshotPath)) {
      const stats = fs.statSync(snapshotPath);
      console.log(`[STEP 10] Snapshot guardado en: ${snapshotPath}`);
      console.log(`[STEP 10] Tamaño del snapshot: ${(stats.size/1024/1024).toFixed(2)} MB`);
      
      // Verificar que el archivo no esté vacío
      if (stats.size === 0) {
        console.error("[STEP 10] ERROR: El archivo de snapshot está vacío");
        return;
      }
    } else {
      console.error("[STEP 10] ERROR: No se encontró el archivo del snapshot en:", snapshotPath);
      return;
    }
    
    // Importar el snapshot en la base de datos "biblioteca_test"
    console.log("[STEP 10] Importando snapshot en la base de datos 'biblioteca_test'...");
    const startImport = Date.now();
    
    // Primero asegurarnos que la base de datos existe
    const createDbProc = new Process("mysql", { shell: true });
    createDbProc.ProcessArguments.push("-uroot");
    createDbProc.ProcessArguments.push("-ppassword123");
    createDbProc.Execute(true);
    createDbProc.Write(`CREATE DATABASE IF NOT EXISTS biblioteca_test;\n`);
    createDbProc.End();
    await createDbProc.Finish();
    
    // Ahora importar los datos usando redirección de entrada
    const importProc = new Process("mysql", { shell: true });
    importProc.ProcessArguments.push("-uroot");
    importProc.ProcessArguments.push("-ppassword123");
    importProc.ProcessArguments.push("biblioteca_test");
    importProc.ProcessArguments.push(`< "${snapshotPath}"`);
    importProc.Execute(true);
    await importProc.Finish();
    const endImport = Date.now();
    console.log(`[STEP 10] Import completado en: ${(endImport - startImport)/1000} segundos`);

    // Verificación final
    const verifyProc = new Process("mysql", { shell: true });
    verifyProc.ProcessArguments.push("-uroot");
    verifyProc.ProcessArguments.push("-ppassword123");
    verifyProc.ProcessArguments.push("biblioteca_test");
    verifyProc.ProcessArguments.push("-e");
    verifyProc.ProcessArguments.push(`"SHOW TABLES;"`);
    verifyProc.Execute(false); // No esperar input
    const verifyOutput = await verifyProc.Finish();
    
    console.log("\n[STEP 10] Verificación de tablas en biblioteca_test:");
    console.log(verifyOutput);
    
    console.log("\n¡Snapshot (dump + import) completado correctamente!");
  } catch (err) {
    console.error("\n[STEP 10] Error en el proceso:", err.message);
    console.error("Posibles soluciones:");
    console.error("1. Verifica que la base de datos biblioteca_test exista");
    console.error("2. Comprueba los permisos del usuario root");
    console.error("3. Asegúrate que el archivo de snapshot no esté corrupto");
    process.exit(1);
  }
})();