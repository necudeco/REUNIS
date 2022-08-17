const  Tesseract = require('tesseract.js');


async function main(){

    let data = await Tesseract.recognize(
        './images/COVID-PERU-2022-08-15.png',
        'eng');
        
    let text = data.data.text;
    console.log(text);

    text = text.replace(",","");


    let number = parseInt(text);

    console.log(number+1);

}

main();