import Tesseract from 'tesseract.js';

Tesseract.recognize(
  'image.png',
  'ind', // bahasa Indonesia
  {
    logger: m => console.log(m)
  }
).then(({ data: { text } }) => {
  console.log(text);
});
