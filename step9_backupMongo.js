const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mysql = require('mysql2/promise');

// Configuración mejorada
const TEMP_DIR = path.join(process.env.TEMP || __dirname, 'db_temp'); // Usar directorio temporal del sistema
const MYSQLDUMP_PATH = 'mysqldump';
const MONGO_IMPORT_PATH = 'C:/MongoDb/bin/mongoimport.exe';
const MONGO_EXPORT_PATH = 'C:/MongoDb/bin/mongoexport.exe';

// Función para asegurar el directorio temporal
const ensureTempDir = () => {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    console.log(`[Init] Directorio temporal creado: ${TEMP_DIR}`);
  }
  return TEMP_DIR;
};

// Función mejorada para exportar datos a JSON
const exportTableToMongoJSON = async (tableName) => {
  const tempDir = ensureTempDir();
  const outputPath = path.join(tempDir, `${tableName}.json`);
  
  // Limpiar archivo existente si hay
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password123',
    database: 'biblioteca'
  });

  try {
    console.log(`[Export] Obteniendo datos de ${tableName}...`);
    const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
    
    console.log(`[Export] Escribiendo ${rows.length} registros a ${outputPath}`);
    const writeStream = fs.createWriteStream(outputPath);
    
    // Escribir como array JSON válido
    writeStream.write('[\n');
    for (let i = 0; i < rows.length; i++) {
      writeStream.write(JSON.stringify(rows[i]));
      if (i < rows.length - 1) writeStream.write(',\n');
      
      // Flush periódico para asegurar escritura
      if (i % 5000 === 0) {
        await new Promise(resolve => writeStream.write('', 'utf8', resolve));
        console.log(`[Export] Progreso ${tableName}: ${i}/${rows.length} registros`);
      }
    }
    writeStream.write('\n]');
    writeStream.end();

    // Esperar a que se escriba completamente
    await new Promise(resolve => writeStream.on('finish', resolve));
    
    // Verificación robusta del archivo generado
    if (!fs.existsSync(outputPath)) {
      throw new Error(`El archivo ${outputPath} no se creó`);
    }
    
    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error(`El archivo ${outputPath} está vacío`);
    }

    console.log(`[Export] ${tableName} completado. Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    return outputPath;
  } finally {
    await connection.end();
  }
};

// Función mejorada para importar a MongoDB
const importToMongoDB = async (collectionName, jsonPath) => {
  // Verificación exhaustiva del archivo
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Archivo no encontrado: ${jsonPath}`);
  }

  const stats = fs.statSync(jsonPath);
  console.log(`[Import] Preparando importación de ${collectionName}`);
  console.log(`- Ruta: ${jsonPath}`);
  console.log(`- Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  try {
    const cmd = `"${MONGO_IMPORT_PATH}" --db BiblioMongo --collection ${collectionName} --file "${jsonPath}" --jsonArray`;
    console.log(`[Import] Ejecutando: ${cmd}`);
    
    const startTime = Date.now();
    const output = execSync(cmd, { stdio: 'pipe', maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer
    
    console.log(output.toString());
    console.log(`[Import] ${collectionName} completado en ${((Date.now() - startTime)/1000).toFixed(2)}s`);
  } catch (err) {
    console.error(`[ERROR] Fallo en importación de ${collectionName}:`);
    console.error(err.stderr?.toString() || err.message);
    
    // Diagnóstico avanzado
    try {
      const sampleSize = 200;
      const fileContent = fs.readFileSync(jsonPath, 'utf8');
      console.log('\n=== MUESTRA DEL ARCHIVO JSON (inicio) ===');
      console.log(fileContent.substring(0, sampleSize));
      console.log('\n=== MUESTRA DEL ARCHIVO JSON (final) ===');
      console.log(fileContent.slice(-sampleSize));
    } catch (readErr) {
      console.error('No se pudo leer el archivo para diagnóstico:', readErr.message);
    }
    
    throw new Error(`Importación fallida para ${collectionName}`);
  }
};

// Función para eliminar tablas MySQL
const dropMySQLTables = async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password123',
    database: 'biblioteca'
  });
  
  try {
    console.log('[MySQL] Deshabilitando verificaciones de clave foránea...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    console.log('[MySQL] Eliminando tablas...');
    await connection.query('DROP TABLE IF EXISTS Libro');
    await connection.query('DROP TABLE IF EXISTS Autor');
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('[MySQL] Tablas eliminadas correctamente');
  } finally {
    await connection.end();
  }
};

// Función para restaurar datos en MySQL
const restoreMySQLFromJSON = async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password123',
    database: 'biblioteca',
    multipleStatements: true
  });

  try {
    // Crear estructura de tablas (sin cambios)
    console.log('[Restore] Creando estructura de tablas...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Autor(
        id INT,
        license VARCHAR(12) NOT NULL PRIMARY KEY,
        name TINYTEXT NOT NULL,
        lastName TINYTEXT,
        secondLastName TINYTEXT,
        year SMALLINT
      );
      CREATE TABLE IF NOT EXISTS Libro(
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

    // Función mejorada para cargar datos desde JSON
    const loadDataFromJSON = async (jsonFile, tableName) => {
      console.log(`[Restore] Cargando ${tableName} desde ${jsonFile}...`);
      
      if (!fs.existsSync(jsonFile)) {
        throw new Error(`Archivo no encontrado: ${jsonFile}`);
      }

      // Leer y parsear el archivo JSON
      const fileContent = fs.readFileSync(jsonFile, 'utf8');
      let data;
      try {
        data = JSON.parse(fileContent);
      } catch (e) {
        console.error('Error parseando JSON:', e.message);
        console.error('Contenido del archivo (primeros 200 caracteres):', fileContent.substring(0, 200));
        throw e;
      }

      console.log(`[Restore] Encontrados ${data.length} registros para ${tableName}`);
      
      // Filtrar columnas no deseadas (especialmente _id)
      const columns = Object.keys(data[0])
        .filter(key => key !== '_id')
        .join(', ');
      
      const batchSize = 100;
      let importedCount = 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const values = batch.map(row => {
          // Crear copia del objeto sin _id
          const rowCopy = {...row};
          delete rowCopy._id;
          
          return '(' + Object.values(rowCopy).map(val => {
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            // Escapar comillas simples para SQL
            return `'${String(val).replace(/'/g, "''")}'`;
          }).join(', ') + ')';
        }).join(', ');

        try {
          await connection.query(`INSERT INTO ${tableName} (${columns}) VALUES ${values}`);
          importedCount += batch.length;
        } catch (e) {
          console.error(`Error insertando lote ${i}-${i+batchSize}:`, e.message);
          console.error('Primer registro del lote:', batch[0]);
          throw e;
        }

        if (i % 1000 === 0 || i + batchSize >= data.length) {
          console.log(`[Restore] Progreso ${tableName}: ${importedCount}/${data.length}`);
        }
      }

      console.log(`[Restore] ${tableName} completado. Total: ${importedCount} registros`);
    };

    // Cargar datos
    await loadDataFromJSON('mongo_autor.json', 'Autor');
    await loadDataFromJSON('mongo_libro.json', 'Libro');

  } finally {
    await connection.end();
  }
};

// Función principal
(async () => {
  try {
    console.log("[STEP 9] Iniciando proceso de respaldo completo...");
    const globalStartTime = Date.now();
    ensureTempDir();

    // Objeto para almacenar los tiempos de cada etapa
    const stageTimes = {
      backupMySQL: { start: 0, end: 0, duration: 0 },
      exportToJSON: { start: 0, end: 0, duration: 0 },
      importToMongo: { start: 0, end: 0, duration: 0 },
      dropMySQLTables: { start: 0, end: 0, duration: 0 },
      exportFromMongo: { start: 0, end: 0, duration: 0 },
      restoreMySQL: { start: 0, end: 0, duration: 0 }
    };

    // --- (a) Backup MySQL ---
    stageTimes.backupMySQL.start = Date.now();
    console.log("\n[9a] Creando respaldo SQL de la base de datos...");
    execSync(`"${MYSQLDUMP_PATH}" -uroot -ppassword123 biblioteca > mysql_backup.sql`);
    stageTimes.backupMySQL.end = Date.now();
    stageTimes.backupMySQL.duration = (stageTimes.backupMySQL.end - stageTimes.backupMySQL.start) / 1000;
    console.log("[9a] Backup SQL completado");

    // --- (b) Exportar datos a JSON ---
    stageTimes.exportToJSON.start = Date.now();
    console.log("\n[9b] Exportando tablas a JSON...");
    const autorJsonPath = await exportTableToMongoJSON('Autor');
    const libroJsonPath = await exportTableToMongoJSON('Libro');
    stageTimes.exportToJSON.end = Date.now();
    stageTimes.exportToJSON.duration = (stageTimes.exportToJSON.end - stageTimes.exportToJSON.start) / 1000;
    console.log("[9b] Exportación JSON completada");

    // --- (c) Importar a MongoDB ---
    stageTimes.importToMongo.start = Date.now();
    console.log("\n[9c] Importando datos a MongoDB...");
    console.log("\n[9c] Limpiando colecciones MongoDB...");
    execSync(`"C:/MongoDb/bin/mongosh.exe" BiblioMongo --eval "db.Autor.drop()"`);
    execSync(`"C:/MongoDb/bin/mongosh.exe" BiblioMongo --eval "db.Libro.drop()"`);
    console.log("[9c] Colecciones limpiadas");
    await importToMongoDB('Autor', autorJsonPath);
    await importToMongoDB('Libro', libroJsonPath);
    stageTimes.importToMongo.end = Date.now();
    stageTimes.importToMongo.duration = (stageTimes.importToMongo.end - stageTimes.importToMongo.start) / 1000;
    console.log("[9c] Importación MongoDB completada");

    // --- (d) Eliminar tablas MySQL ---
    stageTimes.dropMySQLTables.start = Date.now();
    console.log("\n[9d] Eliminando tablas en MySQL...");
    await dropMySQLTables();
    stageTimes.dropMySQLTables.end = Date.now();
    stageTimes.dropMySQLTables.duration = (stageTimes.dropMySQLTables.end - stageTimes.dropMySQLTables.start) / 1000;
    console.log("[9d] Tablas eliminadas correctamente");

    // --- (e) Exportar desde MongoDB ---
    stageTimes.exportFromMongo.start = Date.now();
    console.log("\n[9e] Exportando desde MongoDB a JSON...");
    execSync(`"${MONGO_EXPORT_PATH}" --db BiblioMongo --collection Autor --jsonArray --fields="id,license,name,lastName,secondLastName,year" --out mongo_autor.json`);
    execSync(`"${MONGO_EXPORT_PATH}" --db BiblioMongo --collection Libro --jsonArray --fields="id,ISBN,title,autor_license,editorial,pages,year,genre,language,format,sinopsis,content" --out mongo_libro.json`);
    stageTimes.exportFromMongo.end = Date.now();
    stageTimes.exportFromMongo.duration = (stageTimes.exportFromMongo.end - stageTimes.exportFromMongo.start) / 1000;
    console.log("[9e] Exportación desde MongoDB completada");

    // --- (f) Restaurar MySQL ---
    stageTimes.restoreMySQL.start = Date.now();
    console.log("\n[9f] Restaurando datos en MySQL...");
    await restoreMySQLFromJSON();
    stageTimes.restoreMySQL.end = Date.now();
    stageTimes.restoreMySQL.duration = (stageTimes.restoreMySQL.end - stageTimes.restoreMySQL.start) / 1000;
    console.log("[9f] Restauración completada");

    // Reporte de tiempos al final
    const totalTime = ((Date.now() - globalStartTime) / 1000).toFixed(2);
    
    console.log('\n══════════════════════════════════════════════════');
    console.log('           TIEMPOS DE EJECUCIÓN DETALLADOS         ');
    console.log('══════════════════════════════════════════════════');
    console.log(`1. Respaldo MySQL:          ${stageTimes.backupMySQL.duration.toFixed(2)}s`);
    console.log(`2. Exportar a JSON:         ${stageTimes.exportToJSON.duration.toFixed(2)}s`);
    console.log(`3. Importar a MongoDB:      ${stageTimes.importToMongo.duration.toFixed(2)}s`);
    console.log(`4. Eliminar tablas MySQL:   ${stageTimes.dropMySQLTables.duration.toFixed(2)}s`);
    console.log(`5. Exportar desde MongoDB:  ${stageTimes.exportFromMongo.duration.toFixed(2)}s`);
    console.log(`6. Restaurar MySQL:         ${stageTimes.restoreMySQL.duration.toFixed(2)}s`);
    console.log('──────────────────────────────────────────────────');
    console.log(`TIEMPO TOTAL:               ${totalTime}s`);
    console.log('══════════════════════════════════════════════════');

  } catch (err) {
    console.error("\n[ERROR CRÍTICO] El proceso ha fallado:");
    console.error("- Mensaje:", err.message);
    process.exit(1);
  }
})();