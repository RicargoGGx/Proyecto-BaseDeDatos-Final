// Utils/generador_aleatorio.js
const fs = require('fs');

function random_number(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function random_text(characters_num) {
    let text = "";
    for (let i = 0; i < characters_num; i++) {
        // 65 - 90 (A-Z). Ajusta si quieres letras minúsculas.
        const letra = String.fromCharCode(random_number(65, 90));
        text += letra;
    }
    return text;
}

/**
 * Genera un CSV para "Libros" con columnas:
 * ISBN, title, autor_license, pages, year, language
 */
function generate_csv(size) {
    let csv = "";
    for (let i = 0; i < size; i++) {
        const isbn = Math.round(Math.random() * 9999999999);
        const title = random_text(random_number(5, 15));
        // Ajusta autor_license si deseas forzar un autor existente
        const autor_license = 'LICENSE123';
        const pages = random_number(50, 999);
        const year = random_number(1950, 2025);
        const language = "ES";

        // Crea cada línea separada por comas
        csv += `${isbn},${title},${autor_license},${pages},${year},${language}\n`;
    }
    return csv;
}

/**
 * Genera un JSON con campos típicos de "Libros"
 * y lo escribe a un archivo si se especifica 'stream'.
 */
function generate_json(size, stream) {
    let output = "";
    let fileStream = null;
    if (stream) {
        fileStream = fs.createWriteStream(stream, { flags: 'w' });
    }

    for (let i = 0; i < size; i++) {
        const isbn = Math.round(Math.random() * 9999999999);
        const title = random_text(random_number(5, 15));
        const autor_license = 'LICENSE123';
        const pages = random_number(50, 999);
        const year = random_number(1950, 2025);
        const language = "ES";

        const record = {
            isbn,
            title,
            autor_license,
            pages,
            year,
            language
        };

        const line = JSON.stringify(record) + "\n";
        if (fileStream) {
            fileStream.write(line);
        } else {
            output += line;
        }
    }

    if (fileStream) {
        fileStream.close();
    } else {
        return output;
    }
}

module.exports = {
    random_number,
    random_text,
    generate_csv,
    generate_json
};
