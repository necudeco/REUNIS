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

    await loadPage(page, URL);

    //browser.close();

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
    const fileName = `images/COVID-${name}-${moment().format('YYYY-MM-DD_HH:mm')}.png`;

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
    }
}

async function selectCity(page){

    await sleep(10);

    //const iframe = await page.waitForSelector('iframe');
    //const frame = await iframe.contentFrame();
    const selector = ".tabComboBoxButtonHolder";

    let frame = page;

    console.log("SelectCity", selector);
    try{
        await page.waitForSelector(selector);
    }catch(e){
        console.log("Selector NOT FOUND. Retrying");
        await loadPage(page, URL);

        return ;
    }
    
    
    const element = await page.evaluate(function(){

        const selector = ".tabComboBoxButtonHolder";
        const selectores = document.querySelectorAll(selector);
        const icons = Array.from( selectores );
        for (const i of icons) {
            console.log("ICON",i);
        }


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
            //icons[2].click();

            simulateClick(icons[2]);

            await sleep(2);

            let checkboxes = document.querySelectorAll("input.FICheckRadio");
            console.log("CITIES",  checkboxes[0]);
    
            simulateClick(checkboxes[0]);

            let trujillo = document.querySelectorAll("a.FIText[title=TRUJILLO]");
            let divTrujillo = trujillo[0].parentNode;
            let checkboxTrujillo = divTrujillo.querySelectorAll("input.FICheckRadio");

            console.log("TRUJILLO DISTRITO", trujillo, checkboxTrujillo );

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

    });

    //const elements = await page.$$(selector);

    console.log("SELECTOR", selector, element );
    //element.click();
    //console.log(frame);

}

async function loadPage(page, url){
    ntimes = 0;
    await sleep(2);
    console.log("");
    console.log("");
    console.log("Loading URL ", url, new Date());
    try {
        await page.goto(url);
    }catch(e){
        console.log("loadPage Exception", e);
        console.log("RETRYING");

        await loadPage(page, url );
        return ;
    }
    
    await sleep(10);

    await screenshot(page,"PERU");

    await selectCity(page);

    await sleep(25);

    await screenshot(page,"TRUJILLO");
}


main();