import '../public/style.css';
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit';
import domtoimage from 'dom-to-image';
import axios from 'axios';
import Compressor from 'compressorjs';

let stringsArray = ["", "", "", "", "", "", ""];
let clientLogoBlob = null;
let imagesBytesArray = [];
let planBytesArray = [];
let quoteBytesArray = [];
let pdfBytes;
let graphImageUrl;

/*---------------------------------------------------------------*/
/*----------------------------START------------------------------*/
/*---------------------------------------------------------------*/
// Função assíncrona para criar o PDF
async function createPdf() {

  const pdfDoc = await PDFDocument.create()

  //FONTS
  const urlLight = 'fonts/Montserrat-Light.ttf';
  const urlRegular = 'fonts/Montserrat-Regular.ttf';
  const urlBold = 'fonts/Montserrat-ExtraBold.ttf';

  const fontBytesLight = await fetch(urlLight).then(res => res.arrayBuffer());
  const fontBytesRegular = await fetch(urlRegular).then(res => res.arrayBuffer());
  const fontBytesBold = await fetch(urlBold).then(res => res.arrayBuffer());

  pdfDoc.registerFontkit(fontkit)
  const light = await pdfDoc.embedFont(fontBytesLight);
  const regular = await pdfDoc.embedFont(fontBytesRegular);
  const bold = await pdfDoc.embedFont(fontBytesBold);

  //PAGES
  let page = [];
  page.push(pdfDoc.addPage()); // 0 Cover
  page.push(pdfDoc.addPage()); // 1 Indice
  page.push(pdfDoc.addPage()); // 2 Briefing
  page.push(pdfDoc.addPage()); // 3 Type
  page.push(pdfDoc.addPage()); // 4 Portofoilo
  page.push(pdfDoc.addPage()); // 5 Portofoilo

  page.push(pdfDoc.addPage()); // 6 End
  //const { width, height } = page[0].getSize();

  //CONTENT

  //Cover
  const pdfCoverUrl = '../public/pdf/Cover.pdf';
  const pdfCoverBytes = await fetch(pdfCoverUrl).then(res => res.arrayBuffer());
  const [pdfCover] = await pdfDoc.embedPdf(pdfCoverBytes);

  page[0].drawPage(pdfCover, {
    x: 0,
    y: 0,
  });

  if (clientLogoBlob != null) {

    let clientLogo = null;
    const clientLogoBytes = await clientLogoBlob.arrayBuffer();

    if (clientLogoBlob.type === "image/jpeg") {
      clientLogo = await pdfDoc.embedJpg(clientLogoBytes);
    } else if (clientLogoBlob.type === "image/png") {
      clientLogo = await pdfDoc.embedPng(clientLogoBytes);
    } else {
      console.error('Unsupported image format');
      return;
    }

    const imageLogoScale = Math.min((170 / clientLogo.width), (114 / clientLogo.height));
    page[0].drawImage(clientLogo, {
      x: 358 + (170 - clientLogo.width * imageLogoScale) / 2,
      y: 415 + (114 - clientLogo.height * imageLogoScale) / 2,
      width: clientLogo.width * imageLogoScale,
      height: clientLogo.height * imageLogoScale,
    });
  }

  //Briefing
  const pdfBriefUrl = '../public/pdf/Briefing.pdf';
  const pdfBriefBytes = await fetch(pdfBriefUrl).then(res => res.arrayBuffer());
  const [pdfBrief] = await pdfDoc.embedPdf(pdfBriefBytes);
  page[2].drawPage(pdfBrief, {
    x: 0,
    y: 0,
  });
  page[2].drawText(stringsArray[1], {
    x: 113,
    y: 743,
    size: 8,
    font: regular,
    color: rgb(0, 0, 0),
  });
  page[2].drawText(stringsArray[2], {
    x: 113,
    y: 707,
    size: 8,
    font: regular,
    color: rgb(0, 0, 0),
  });
  page[2].drawText(stringsArray[4], {
    x: 113,
    y: 671,
    size: 8,
    font: regular,
    color: rgb(0, 0, 0),
  });
  page[2].drawText(stringsArray[3], {
    x: 113,
    y: 635,
    size: 8,
    font: regular,
    color: rgb(0, 0, 0),
  });

  //Briefing
  /*
  const clientBrief = stringsArray[5];
  formatAndDrawText(clientBrief, 50, 576, 48, page[2], regular, 8, rgb(0, 0, 0));

  const graphImageBytes = await fetch(graphImageUrl).then(res => res.arrayBuffer());
  const graphImage = await pdfDoc.embedJpg(graphImageBytes);
  console.log(graphImageBytes);

  page[2].drawImage(graphImage, {
    width: 270,
    height: 750,
    x: 304,
    y: 20
  });
*/
  //Proposal
  const clientProposal = stringsArray[6];
  formatAndDrawText(clientProposal, 50, 331, 48, page[2], regular, 8, rgb(0, 0, 0));




  //Event Type & Portofolio
  const pdfTypeUrl = `../public/pdf/${stringsArray[0]}.pdf`;
  const pdfTypeBytes = await fetch(pdfTypeUrl).then(res => res.arrayBuffer());
  const pdfType0 = await pdfDoc.embedPdf(pdfTypeBytes, [0]);
  const pdfType1 = await pdfDoc.embedPdf(pdfTypeBytes, [1]);
  const pdfType2 = await pdfDoc.embedPdf(pdfTypeBytes, [2]);

  page[3].drawPage(pdfType0[0], {
    x: 0,
    y: 0,
  });
  page[4].drawPage(pdfType1[0], {
    x: 0,
    y: 0,
  });
  page[5].drawPage(pdfType2[0], {
    x: 0,
    y: 0,
  });

  //Common (Loop)
  const header = `${stringsArray[1]}${stringsArray[2] != '' ? '    |    ' : ''}${stringsArray[2]}${stringsArray[3] != '' ? '    |    ' : ''}${stringsArray[3]}${stringsArray[4] != '' ? '    |    ' : ''}${stringsArray[4]}`;

  for (let i = 1; i < (page.length - 1); i++) {
    page[i].drawRectangle({
      x: 0,
      y: 822,
      width: 595,
      height: 20,
      color: rgb(0, 0, 0),
    });
    page[i].drawText(header, {
      x: 20,
      y: 828,
      size: 8,
      font: regular,
      color: rgb(1, 1, 1),
    });
    page[i].drawText(i.toString(), {
      x: 570,
      y: 828,
      size: 8,
      font: light,
      color: rgb(1, 1, 1),
    });
  }

  /*
  

  if (imagesBytesArray[0] != null) {
    const imageLogo = await pdfDoc.embedJpg(imagesBytesArray[0]); // Se a imagem for JPG, use embedJpg
    page.drawImage(imageLogo, {
      x: 50,
      y: height - 10 - 400,
    });
  }

  if (planBytesArray[0] != null) {
    const imageLogo = await pdfDoc.embedJpg(planBytesArray[0]); // Se a imagem for JPG, use embedJpg
    page.drawImage(imageLogo, {
      x: 50,
      y: height - 10 - 500,
    });
  }*/
  //SAVE
  pdfBytes = await pdfDoc.save();
}

/*---------------------------------------------------------------*/
/*----------------------------END--------------------------------*/
/*---------------------------------------------------------------*/

// Função para formatar e desenhar texto com quebras de linha e limite de caracteres
function formatAndDrawText(text, startX, startY, maxCharsPerLine, page, font, fontSize, color) {
  const textArray = [];

  if (text !== "") {
    // Dividir o texto em parágrafos com base em quebras de linha
    const paragraphs = text.split('\n');

    paragraphs.forEach(paragraph => {
      const wordsArray = paragraph.split(' ');
      let currentLine = '';

      // Agrupar palavras em linhas de até maxCharsPerLine caracteres
      for (let i = 0; i < wordsArray.length; i++) {
        if ((currentLine + wordsArray[i]).length < maxCharsPerLine) {
          currentLine += (currentLine ? ' ' : '') + wordsArray[i];
        } else {
          textArray.push(currentLine);
          currentLine = wordsArray[i];
        }
      }

      // Adicionar a última linha do parágrafo ao array
      if (currentLine.length > 0) {
        textArray.push(currentLine);
      }

      // Adicionar uma linha vazia entre parágrafos
      textArray.push("");
    });
  }

  // Desenhar o texto no PDF
  let yOffset = 0;
  for (let i = 0; i < textArray.length; i++) {
    if (textArray[i] !== "") {
      page.drawText(textArray[i], {
        x: startX,
        y: startY + yOffset,
        size: fontSize,
        font: font,
        color: color,
      });
    }
    yOffset -= (textArray[i] === "" ? 4 : 12); // Espaço maior entre parágrafos
  }
}

window.generatePDF = async function () {
  await createPdf();
  const pdfViewer = document.querySelector('#pdfViewer');
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  pdfViewer.src = URL.createObjectURL(blob);
};

window.saveString = function (i, value) {
  stringsArray[i] = value;
  //generatePDF();
};
/*
const graph = document.getElementById('graph-content');
window.timelineF = function (value) {
  graph.innerHTML = '';
  const itens = value.split('\n');

  for (let i = 0; i < itens.length; i++) {

    if (itens[i].startsWith(".")) {

      const dayDiv = document.createElement('div');
      dayDiv.id = 'day';
      const text = itens[i].slice(1);
      const textNode = document.createTextNode(text);
      dayDiv.appendChild(textNode);
      graph.appendChild(dayDiv);

    } else if (itens[i].includes('-')) {
      const itenBreak = itens[i].split('-');

      const lineDiv = document.createElement('div');
      lineDiv.id = 'line';
      const timeDiv = document.createElement('div');
      timeDiv.id = 'time';
      const textDiv = document.createElement('div');
      textDiv.id = 'text';

      const text0 = itenBreak[0].trim();
      const textNode0 = document.createTextNode(text0);
      const text1 = itenBreak[1].trim();
      const textNode1 = document.createTextNode(text1);

      const spaceDiv = document.createElement('div');
      spaceDiv.id = 'space';

      lineDiv.appendChild(timeDiv);
      lineDiv.appendChild(textDiv);
      timeDiv.appendChild(textNode0);
      textDiv.appendChild(textNode1);
      graph.appendChild(spaceDiv);
      graph.appendChild(lineDiv);
    }
  }

  domtoimage.toJpeg(document.getElementById('graph'), { quality: 0.95 }).then(function (dataUrl) {
    graphImageUrl = dataUrl;
  });

  //generatePDF();
}*/

window.preview = function (value) {
  generatePDF();
}


window.clientLogo = async function (file) {
  if (!file) {
    return;
  }

  new Compressor(file, {
    quality: 0.6,

    success(result) {
      clientLogoBlob = result;
      // Você pode fazer o upload ou qualquer outro processamento necessário com o ArrayBuffer
      const formData = new FormData();
      formData.append('file', result, result.name);

      axios.post('/path/to/upload', formData).then(() => {
        console.log('Upload success');
      }).catch((err) => {
        console.log('Erro ao converter o Blob para ArrayBuffer:', err);
      });
    },

    error(err) {
      console.log('Erro ao comprimir a imagem:', err.message);
    },
  });
};

window.refImages = async function (files) {
  imagesBytesArray = [];

  const promises = Array.from(files).map(async (file) => {
    const imageBytes = await file.arrayBuffer();

    // Converte e comprime a imagem para JPEG e redimensiona
    const compressedImageBytes = await compressedImage(imageBytes, 'image/jpeg', 100);

    // Armazena a imagem comprimida no array de bytes
    imagesBytesArray.push(new Uint8Array(compressedImageBytes));
  });

  try {
    // Aguarda a conclusão de todas as compressões e redimensionamentos
    await Promise.all(promises);
    console.log('Todas as imagens foram carregadas e comprimidas com sucesso:', imagesBytesArray);
    //generatePDF();  // Gera o PDF após o carregamento e compressão
  } catch (error) {
    console.error('Erro ao carregar e comprimir as imagens:', error);
  }
};



window.planImages = async function (files) {
  planBytesArray = [];

  const promises = Array.from(files).map(async (file) => {
    const imageBytes = await file.arrayBuffer();

    // Converte e comprime a imagem para JPEG e redimensiona
    const compressedImageBytes = await compressedImage(imageBytes, 'image/jpeg', 100);

    // Armazena a imagem comprimida no array de bytes
    planBytesArray.push(new Uint8Array(compressedImageBytes));
  });

  try {
    // Aguarda a conclusão de todas as compressões e redimensionamentos
    await Promise.all(promises);
    console.log('Todas as imagens foram carregadas e comprimidas com sucesso:', imagesBytesArray);
    //generatePDF();  // Gera o PDF após o carregamento e compressão
  } catch (error) {
    console.error('Erro ao carregar e comprimir as imagens:', error);
  }
};

window.quote = function () {
  //generatePDF();
}

window.downloadPDF = async function () {
  await createPdf();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = "pdf-lib_creation_example.pdf";
  link.click();
};

window.addEventListener('DOMContentLoaded', async () => {
  await generatePDF();
});

const presencialInput = document.getElementById('presencial');
const digitalInput = document.getElementById('digital');
const espacoInput = document.getElementById('espaco');

document.addEventListener('keydown', function (event) {
  if (event.key === "Enter") {
    console.log('Tecla Enter pressionada!');
  }
});
