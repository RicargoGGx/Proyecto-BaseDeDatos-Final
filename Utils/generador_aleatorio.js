// Utils/generador_aleatorio.js

let bookCounter = 1; // Contador global

function random_number(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function random_text(length) {
  let txt = "";
  for (let i = 0; i < length; i++) {
    txt += String.fromCharCode(random_number(65, 91));
  }
  return txt;
}

/**
 * Genera una línea CSV para la tabla Libro con 12 columnas:
 * id, ISBN, title, autor_license, editorial, pages, year, genre, language, format, sinopsis, content.
 * Usa el contador global para valores únicos.
 */
function generateBookRow() {
  const id = bookCounter;
  const isbn = (978000000 + id).toString();
  const title = "Titulo" + random_text(random_number(5, 15));
  const autor_license = "LICENSE123"; // Debe existir en Autor.
  const editorial = "Ed" + random_text(random_number(3, 8));
  const pages = random_number(50, 999);
  const year = random_number(1950, 2025);
  const genre = "Gen" + random_text(random_number(2, 6));
  const language = "ES";
  const format = "Form" + random_text(2);
  const sinopsis = "Sinop" + random_text(random_number(10, 20));
  const content = "Cont" + random_text(random_number(20, 40));

  bookCounter++; // Incrementa para el siguiente registro.
  return `${id},${isbn},${title},${autor_license},${editorial},${pages},${year},${genre},${language},${format},${sinopsis},${content}\n`;
}

function generate_csv(size) {
  let csv = "";
  for (let i = 0; i < size; i++) {
    csv += generateBookRow();
  }
  return csv;
}

function setBookCounter(value) {
  bookCounter = value;
}

module.exports = {
  random_number,
  random_text,
  generate_csv,
  generateBookRow, 
  setBookCounter
};
