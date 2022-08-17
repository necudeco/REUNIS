const { Console } = require('console');
const puppeteer = require('puppeteer');

//const URL = "https://www.minsa.gob.pe/reunis/data/resumen_covid19.asp";
const URL = "https://public.tableau.com/views/Resumen_Ejecutivo_Covid/ResumenCovid19?:embed=y&:showVizHome=no&:host_url=https%3A%2F%2Fpublic.tableau.com%2F&:embed_code_version=3&:tabs=no&:toolbar=no&:animate_transition=yes&:display_static_image=no&:display_spinner=no&:display_overlay=no&:display_count=no&:language=es-ES&:loadOrderID=0";
let ntimes = 0;

async function main(){

    console.log("Welcome to REUNIS");


    const opts = { 
        headless: false, 
        devtools: true, 
        defaultViewport: null
    };
    
    opts.headless = true;
    opts.devtools = false;

    await createRepo();

    const browser = await puppeteer.launch(opts);
    console.log("Browser loaded");

    const page = await browser.newPage();
    console.log("New Page Tab opened");

    page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
    });

        
    await getDistrito(page, null);
    await getDistrito(page, "TRUJILLO");
    await getDistrito(page, "CHICLAYO");
    await getDistrito(page, "FLORENCIA DE MORA");

    browser.close();
}

async function getDistrito(page, distrito, reloadImage = false){
    await loadPage(page, URL);
    if ( distrito   != null ){
        await selectCity(page, distrito);
    }else{
        distrito = "PERU";
    }
    
    fecha = await getDate(page);
    filename = `images/COVID-${distrito}-${fecha}.png`;
    await sleep(10);
    await getImage(page, `images/COVID-${distrito}-${fecha}.png`, reloadImage);
    contagios = await parseImage(filename, fecha);
    await writeRepo(contagios, fecha, distrito);

    console.log("CONTAGIOS", distrito, fecha, contagios);

    return contagios;
    
}

async function writeRepo(contagios, fecha, tag){
    const fs = require('fs');

    let data = {};

    if ( fs.existsSync(`data/data-${tag}.json`) ){ 
        
        data = JSON.parse(fs.readFileSync(`data/data-${tag}.json`));
    }

    data[fecha] = contagios;

    fs.writeFileSync(`data/data-${tag}.json`, JSON.stringify(data));

}

async function sleep(seconds){
    const promise = new Promise( function(resolve, reject){
      setTimeout(resolve, seconds*1000);
    });
    return promise;
}

async function createRepo(){
    const fs = require('fs');

    if ( ! fs.existsSync('images') ){
        fs.mkdirSync('images')
    }
    
}

async function screenshot(page,name){
    const KB = 1024;
    const moment = require('moment');
    const fileName = `${__dirname}/images/COVID-${name}-${moment().format('YYYY-MM-DD_HH:mm')}.png`;


    ntimes ++ ;
    await sleep(3);

    await page.screenshot({ path: fileName });
    
    const fs = require('fs');
    const stats = fs.statSync(fileName);

    //console.log(stats);

    if ( stats.size < 50*KB ) {
        console.log("Page is not ready for screenshot. Retrying");
        fs.unlinkSync(fileName);
        if ( ntimes > 10 ) {
            await loadPage(page, URL);
            return ;
        }
        await screenshot(page);
        return ;
    
    }

    console.log("Archivo grabado", fileName);
}


async function downloadURL(url, filename){
    const fs = require('fs');
    const moment = require('moment');
    const request = require('request');
    const Jimp = require('jimp');
    
    try{
        //console.log("Downloading", filename);
        const img = await Jimp.read(`${url}`);
        //console.log("Jimp loaded");

        await img.crop(6, 23, 120-6, 48-23);
        //console.log("Jimp cropped");

        await img.write(`${filename}`);
        console.log("Jimp saved", filename);

    }catch(e){
        console.log("downloadURL Exception", e);
        
    }
   
}

async function parseImage(filename){
    const  Tesseract = require('tesseract.js');

    let data = await Tesseract.recognize(
        filename,
        'eng');
        
    let text = data.data.text;
    
    text = text.replace(",","");

    let number = parseInt(text);

    return number;
}



async function getImage(page, filename, reloadImage = false){

    const fs = require('fs');

    if ( ( !reloadImage ) && fs.existsSync(filename) ){ 

        console.log("File exists", filename);
        return ;
    }
 
    const url = await page.evaluate(function(){

        const selector = "#view15279939737063049931_11217428939489486425 img";
        const imgs = document.querySelectorAll(selector);
        const url = imgs[0].src;

        return url;
    });

    //console.log("URL", url);

    await downloadURL(url, filename);
}




async function getDate(page){

    const fecha = await page.evaluate(function(){

        const meses = {
            "enero": "01",
            "febrero": "02",
            "marzo": "03",
            "abril": "04",
            "mayo": "05",
            "junio": "06",
            "julio": "07",
            "agosto": "08",
            "septiembre": "09",
            "octubre": "10",
            "noviembre": "11",
            "diciembre": "12"
        };

        //const selector = "#tabZoneId65 ";
        const selector = "#title15279939737063049931_9142565256263205313 > div > div > span > div > span";

        const selectores = document.querySelectorAll(selector);

        let fecha = selectores[2].innerText;

        
        fecha = fecha.replace("Datos disponibles al ", "");
        let fechas = fecha.split(" de ");

        const year = fechas[2];
        const month = meses[fechas[1]];
        const day = fechas[0];

        let nuevafecha = `${year}-${month}-${day}`;

        console.log("FECHA", nuevafecha);

        return nuevafecha;

    });

    console.log("FECHA", fecha);

    return fecha;
}




async function selectCity(page, distrito){

    await sleep(10);

    //const iframe = await page.waitForSelector('iframe');
    //const frame = await iframe.contentFrame();
    const selector = ".tabComboBoxButtonHolder";

    let frame = page;

    console.log("SelectCity", distrito);
    try{
        await page.waitForSelector(selector);
    }catch(e){
        console.log("Selector NOT FOUND. Retrying");
        await loadPage(page, URL);

        return ;
    }
    
    
    const element = await page.evaluate( distritoParam =>{

        console.log("DISTRITO", distritoParam);

        const selector = ".tabComboBoxButtonHolder";
        const selectores = document.querySelectorAll(selector);
        const icons = Array.from( selectores );
        /*for (const i of icons) {
            console.log("ICON",i);
        }*/


        simulateClick = function (element){
            simulateMouseEvent(element, "mousedown");
            simulateMouseEvent(element, "mouseup");
            simulateMouseEvent(element, "click");
            
        }

        simulateMouseEvent = function(element, eventName) {
    
            let box = element.getBoundingClientRect();
            let coordX = box.left + ( box.right - box.left ) / 2;
            let coordY = box.top + ( box.bottom - box.top ) / 2;
            console.log("click", box, coordX, coordY);
            element.dispatchEvent(new MouseEvent(eventName, {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: coordX,
              clientY: coordY,
              button: 0
            }));
          };
        
          async function sleep(seconds){
            const promise = new Promise( function(resolve, reject){
              setTimeout(resolve, seconds*1000);
            });
            return promise;
        }
          

        async function main() {
            console.log("ELEMENT", icons[2]);
          
            simulateClick(icons[2]);
            await sleep(2);

            let checkboxes = document.querySelectorAll("input.FICheckRadio");
            console.log("CITIES",  checkboxes[0]);
    
            simulateClick(checkboxes[0]);

            let trujillo = document.querySelectorAll(`a.FIText[title='${distritoParam}']`);
            let divTrujillo = trujillo[0].parentNode;
            let checkboxTrujillo = divTrujillo.querySelectorAll("input.FICheckRadio");

            console.log(`${distritoParam} DISTRITO`, trujillo, checkboxTrujillo );

            simulateClick(checkboxTrujillo[0]);

            let btnApply = document.querySelectorAll("button.tab-button.apply");
            console.log("APPLY", btnApply[0]);

            simulateClick(btnApply[0]);

            sleep(1);

            simulateClick(icons[2]);
            
            sleep(3);

        };

        main();
        
        

        return icons[2];

    }, distrito);

    //const elements = await page.$$(selector);

    //console.log("SELECTOR", selector, element );
    //element.click();
    //console.log(frame);

}

async function loadPage(page, url){
    ntimes = 0;
    await sleep(2);
    console.log("");
    console.log("");
    console.log("");
    console.log("Loading URL ", url, new Date());
    console.log("");
    try {
        await page.goto(url);
    }catch(e){
        console.log("loadPage Exception", e);
        console.log("RETRYING");

        await loadPage(page, url );
        return ;
    }
    
    await sleep(20);


    
}


main();
