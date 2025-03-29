const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { saveMetric } = require('./Utils/metrics');

module.exports = async () => {
  try {
    console.log("[STEP 10] Iniciando generación e importación del snapshot...");
    const startTime = Date.now();
    const snapshotPath = path.join(__dirname, "mysql_backup.sql");

    // 1. Configurar el proceso mysqldump con spawn directamente
    console.log("[STEP 10] Generando snapshot con mysqldump...");
    const dumpStart = Date.now();
    
    // Eliminar archivo existente si hay
    if (fs.existsSync(snapshotPath)) {
      fs.unlinkSync(snapshotPath);
    }

    const dumpArgs = [
      '--quick',
      '--single-transaction',
      '--skip-lock-tables',
      '--compress',
      '-uroot',
      '-ppassword123',
      'biblioteca'
    ];

    console.log("Ejecutando: mysqldump", dumpArgs.join(' '));
    
    const dumpProcess = spawn('mysqldump', dumpArgs);
    const outputStream = fs.createWriteStream(snapshotPath);
    
    // Manejar salida
    dumpProcess.stdout.pipe(outputStream);
    
    dumpProcess.stderr.on('data', (data) => {
      console.error(`[mysqldump stderr]: ${data}`);
    });

    // Esperar finalización con promesa
    await new Promise((resolve, reject) => {
      dumpProcess.on('close', (code) => {
        if (code === 0) {
          console.log("[STEP 10] mysqldump completado exitosamente");
          resolve();
        } else {
          reject(new Error(`mysqldump falló con código ${code}`));
        }
      });
      
      dumpProcess.on('error', (err) => {
        reject(err);
      });
    });

    const dumpTime = Date.now() - dumpStart;
    
    // Verificación robusta del dump
    if (!fs.existsSync(snapshotPath)) {
      throw new Error("El archivo de snapshot no se creó");
    }
    
    const stats = fs.statSync(snapshotPath);
    if (stats.size === 0) {
      throw new Error("El archivo de snapshot está vacío");
    }
    console.log(`[STEP 10] Dump completado (${(stats.size/1024/1024).toFixed(2)} MB) en ${dumpTime}ms`);

    // 2. Importar a la base de datos de prueba
    console.log("[STEP 10] Preparando importación a biblioteca_test...");
    const importStart = Date.now();
    
    // Primero crear/resetear la base de datos
    execSync('mysql -uroot -ppassword123 -e "DROP DATABASE IF EXISTS biblioteca_test; CREATE DATABASE biblioteca_test;"');
    
    // Importar con spawn para mejor control
    console.log("[STEP 10] Importando datos...");
    const importProcess = spawn('mysql', [
      '-uroot',
      '-ppassword123',
      'biblioteca_test'
    ], { stdio: ['pipe', 'pipe', 'pipe'] });
    
    const inputStream = fs.createReadStream(snapshotPath);
    inputStream.pipe(importProcess.stdin);
    
    // Mostrar progreso
    importProcess.stdout.on('data', (data) => {
      process.stdout.write('.');
    });
    
    importProcess.stderr.on('data', (data) => {
      console.error(`\n[mysql import error]: ${data}`);
    });

    await new Promise((resolve, reject) => {
      importProcess.on('close', (code) => {
        if (code === 0) {
          console.log("\n[STEP 10] Importación completada");
          resolve();
        } else {
          reject(new Error(`mysql import falló con código ${code}`));
        }
      });
      
      importProcess.on('error', (err) => {
        reject(err);
      });
    });

    const importTime = Date.now() - importStart;

    // Verificación final
    console.log("[STEP 10] Verificando tablas...");
    const verifyOutput = execSync(
      'mysql -uroot -ppassword123 biblioteca_test -e "SELECT COUNT(*) AS total_libros FROM Libro; SELECT COUNT(*) AS total_autores FROM Autor;"'
    ).toString();
    
    const totalTime = Date.now() - startTime;
    saveMetric('step10', 'total_time', totalTime);
    
    console.log("\n[STEP 10] Resultados:");
    console.log(verifyOutput);
    console.log(`[STEP 10] Tiempo total: ${totalTime}ms`);
    
    return totalTime;
  } catch (err) {
    console.error("\n[STEP 10] Error crítico:", err.message);
    
    // Limpieza de procesos
    try {
      execSync("taskkill /F /IM mysqldump.exe /T");
      execSync("taskkill /F /IM mysql.exe /T");
    } catch (killErr) {
      console.error("Error limpiando procesos:", killErr.message);
    }
    
    throw err;
  }
};