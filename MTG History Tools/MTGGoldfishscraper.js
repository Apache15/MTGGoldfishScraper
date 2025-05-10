const puppeteer = require('puppeteer');
const readline = require('readline');

//OPTIONS

// # Of decklists to get, starting from 1st place
const topNDecklists = 8;
// output dir
var dir = "C:/Users/Blake/Desktop/MTG HISTORY ARCHIVE/2019";

var manualTournamentResults = (process.argv[2] === "true");

// rl.close() in func outside main because it stopped execution when put in main, idfk why
async function readLine(questionString) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(questionString, (answer) => {
      rl.close();
      resolve(answer)
    });
  })
}

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

(async () => {
  const tournamentLink = await readLine('>>MTG Goldfish tournament link: ');

  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(tournamentLink);

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });
  // get tournament title
  const tournament = await page.$eval("body > main > div > h2", element => element.textContent);
  // stupid shit way of getting date, should probably use better selector on first decklist
  const date = await page.$eval("body > main > div > p:nth-child(6)", element => element.textContent.split(/Date:\s/)[1]);
  const fs = require('fs');
  // Open first N decklists to get player name and decklist
  // MTGGoldfish creates their tables in a weird ass way, harder to get the data from main page, just rip the deck ID and open pages to scrape data that way.
  if (!fs.existsSync(`${dir}/${tournament}`)) {
    fs.mkdirSync(`${dir}/${tournament}`);
  }

  const text = await page.evaluate(() => Array.from(document.querySelectorAll('.tournament-decklist'), element => element.getAttribute("data-deckid")));
  for (var i = 0; i < topNDecklists; i++) {
    await page.goto(`https://www.mtggoldfish.com/deck/${text[i]}#paper`, { waitUntil: 'load' });
    var title = (await page.$eval(".title", (el) => el.innerText)).split(/\sby\s/);
    var deckName = title[0];
    var authorName = title[1];
    await page.goto(`https://www.mtggoldfish.com/deck/arena_download/${text[i]}#paper`, { waitUntil: 'load' });
    var deckList = await page.$eval("body > main > div > textarea", span => span.innerHTML);
    var ordInput = getOrdinal(i+1);
    if (manualTournamentResults) {
      ordInput = await readLine(`Placement for player ${authorName} : `);
    }
    const placement = getOrdinal(parseInt(ordInput, 10));
    fs.writeFile(`${dir}/${tournament}/${placement}-${authorName} -- ${deckName}.txt`, deckList, (err) => {
      if (err) {
        console.error('An error occurred:', err);
      } else {
        console.log('File created successfully!');
      }

    });
  };

  await browser.close();

})();
