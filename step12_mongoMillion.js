// step12_mongoMillion.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runStep12() {
  try {
    console.log("[STEP 12] Insertar 1,000,000 Libros en MongoDB y exportar CSV de ISBN, year, pages...");
    const metrics = {};

    // 1) Generar CSV con 1 millón de libros
    const csvDir = path.join(__dirname, 'csv');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }

    const csvFile = path.join(csvDir, 'libros_millon.csv');
    console.log("[12a] Generando CSV con 1,000,000 Libros (ISBN, year, pages)...");
    let startTime = Date.now();

    let csv = "";
    for (let i = 0; i < 1000000; i++) {
      const isbn = Math.floor(Math.random() * 9999999999).toString().padStart(10, '0');
      const year = 1900 + Math.floor(Math.random() * 125);
      const pages = 50 + Math.floor(Math.random() * 950);
      csv += `${isbn},${year},${pages}\n`;
    }
    fs.writeFileSync(csvFile, csv);

    metrics.csvGenerationTime = Date.now() - startTime;
    console.log(`[12a] Tiempo generar CSV: ${metrics.csvGenerationTime} ms`);

    // 2) Importar a MongoDB
    console.log("[12b] Importando a MongoDB (colección 'LibrosMillon')...");
    startTime = Date.now();
    
    const mongoImportCmd = [
      'mongoimport',
      '--db=BiblioMongo',
      '--collection=LibrosMillon',
      `--file="${csvFile}"`,
      '--type=csv',
      '--fields=isbn,year,pages',
      '--numInsertionWorkers=4' // Mejora rendimiento para inserts masivos
    ].join(' ');

    console.log(`Ejecutando: ${mongoImportCmd}`);

    try {
      execSync(mongoImportCmd, { stdio: 'inherit' });
      metrics.mongoImportTime = Date.now() - startTime;
      console.log(`[12b] Tiempo import Mongo: ${metrics.mongoImportTime} ms`);
    } catch (error) {
      console.error('❌ Error en mongoimport:', error.message);
      console.log('🔍 Solución: Verifica que:');
      console.log('1. MongoDB esté corriendo (ejecuta "mongod")');
      console.log('2. mongoimport esté instalado (parte de MongoDB Database Tools)');
      console.log('3. El archivo CSV tenga el formato correcto');
      throw new Error(`mongoimport falló: ${error.message}`);
    }

    // 3) Exportar desde MongoDB a CSV
    console.log("[12c] Exportar ISBN,year,pages a CSV desde Mongo...");
    const outCSV = path.join(csvDir, 'mongo_libros_reduced.csv');
    startTime = Date.now();
    
    const mongoExportCmd = [
      'mongoexport',
      '--db=BiblioMongo',
      '--collection=LibrosMillon',
      `--out="${outCSV}"`,
      '--type=csv',
      '--fields=isbn,year,pages'
    ].join(' ');

    console.log(`Ejecutando: ${mongoExportCmd}`);

    try {
      execSync(mongoExportCmd, { stdio: 'inherit' });
      metrics.mongoExportTime = Date.now() - startTime;
      console.log(`[12c] Tiempo export Mongo => CSV: ${metrics.mongoExportTime} ms`);
    } catch (error) {
      console.error('❌ Error en mongoexport:', error.message);
      throw new Error(`mongoexport falló: ${error.message}`);
    }

    // 4) MySQL: Crear tabla e importar datos
    console.log("[12d] Creando tabla old_books e importando CSV...");
    startTime = Date.now();
    
    // 4a) Crear tabla
    const createTableCmd = [
      'mysql',
      '-uroot',
      '-ppassword123',
      '-e',
      `"CREATE DATABASE IF NOT EXISTS biblioteca;
       USE biblioteca;
       CREATE TABLE IF NOT EXISTS old_books (
         isbn VARCHAR(16),
         year SMALLINT,
         pages SMALLINT
       );"`
    ].join(' ');

    console.log(`Ejecutando: ${createTableCmd.replace(/-ppassword123/, '-p*******')}`);

    try {
      execSync(createTableCmd, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Error al crear tabla en MySQL:', error.message);
      throw new Error(`Creación de tabla falló: ${error.message}`);
    }

    // 4b) Importar datos
    const mysqlImportCmd = [
      'mysql',
      '-uroot',
      '-ppassword123',
      '--local-infile=1',
      '-e',
      `"USE biblioteca;
       LOAD DATA LOCAL INFILE '${csvFile.replace(/\\/g, '/')}'
       INTO TABLE old_books
       FIELDS TERMINATED BY ','
       LINES TERMINATED BY '\\n'
       (isbn, year, pages);"`
    ].join(' ');

    console.log(`Ejecutando: ${mysqlImportCmd.replace(/-ppassword123/, '-p*******')}`);

    try {
      execSync(mysqlImportCmd, { stdio: 'inherit' });
      metrics.mysqlImportTime = Date.now() - startTime;
      console.log(`[12d] Tiempo import CSV => old_books: ${metrics.mysqlImportTime} ms`);
    } catch (error) {
      console.error('❌ Error al importar a MySQL:', error.message);
      console.log('🔍 Solución: Verifica que:');
      console.log('1. MySQL esté corriendo');
      console.log('2. El usuario root tenga los permisos adecuados');
      console.log('3. La opción local-infile esté habilitada en el servidor MySQL');
      throw new Error(`Importación a MySQL falló: ${error.message}`);
    }

    console.log("✅ ¡Paso 12 completado con éxito!");
    return { 
      success: true, 
      metrics
    };
  } catch (err) {
    console.error("❌ Error crítico en step12_mongoMillion:", err.message);
    throw err;
  }
}

module.exports = runStep12;