const puppeteer = require('puppeteer');
const readline = require('readline');

//OPTIONS

// # Of decklists to get, starting from 1st place
const topNDecklists = 32;
// output dir
var dir = "C:/Users/Blake/Desktop/TESTOUTPUTGOOBER";

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
  if (!fs.existsSync(`${dir}`)) {
    fs.mkdirSync(`${dir}`);
  }

  const text = await page.evaluate(() => Array.from(document.querySelectorAll('.tournament-decklist'), element => element.getAttribute("data-deckid")));
  for (var i = 0; i < topNDecklists; i++) {
    await page.goto(`https://www.mtggoldfish.com/deck/${text[i]}#paper`, { waitUntil: 'load' });
    var title = (await page.$eval(".title", (el) => el.innerText)).split(/\sby\s/);
    var deckName = title[0];
    //var authorName = title[1];
    await page.goto(`https://www.mtggoldfish.com/deck/arena_download/${text[i]}#paper`, { waitUntil: 'load' });
    var deckList = await page.$eval("body > main > div > textarea", span => span.innerHTML);
    //var ordInput = getOrdinal(i+1);
    /*if (manualTournamentResults) {
      ordInput = await readLine(`Placement for player ${authorName} : `);
    }*/
    const creatureDict = ["Phlage, Titan of Fire's Fury","Ragavan, Nimble Pilferer","Guide of Souls","Ocelot Pride","Ajani, Nacatl Pariah","Seasoned Pyromancer","Obsidian Charmaw","Voice of Victory","Orcish Bowmasters","Haywire Mite","Tamiyo, Inquisitive Student","Harbinger of the Seas","Monastery Swiftspear","Emrakul, the Promised End","Dragon's Rage Channeler","Soulless Jailer","Sowing Mycospawn","Psychic Frog","Subtlety","Devourer of Destiny","Solitude","Magebane Lizard","Slickshot Show-Off","Murktide Regent","World Breaker","Walking Ballista","Emperor of Bones","Witch Enchanter","Emry, Lurker of the Loch","Phelia, Exuberant Shepherd","Writhing Chrysalis","Sire of Seven Deaths","Ral, Monsoon Mage","Clarion Conqueror","Glaring Fleshraker","Aftermath Analyst","Arboreal Grazer","Primeval Titan","Thought-Knot Seer","Boggart Trawler","Endurance","Six","Overlord of the Balemurk","White Orchid Phantom","Cultivator Colossus","Kappa Cannoneer","Scion of Draco","Thundertrap Trainer","Fallaji Archaeologist","Drannith Magistrate","Cori-Steel Cutter","Ruby Medallion","Goblin Charbelcher","Leyline of the Guildpact","Leyline Binding","Jeskai Ascendancy","Living End","Basking Broodscale","Yawgmoth, Thran Physician","Hollow One","Detective's Phoenix","Goryo's Vengeance","Teferi, Hero of Dominaria","Through the Breach","Kozilek's Command","Urza's Tower","Urza's Power Plant","Urza's Mine","Ugin's Labyrinth","Urza's Saga","Lightning Bolt","Galvanic Discharge","Prismatic Ending","Spell Snare","Counterspell","Wrath of the Skies","Force of Negation","Boltwave","Ruin Crab","Hedron Crab","Fatal Push","Thoughtseize"];
    //const placement = getOrdinal(parseInt(ordInput, 10));
    var decklistAsArray = deckList.split("\n");

    var deckListDict = [];
    var importantCards = [];

    if(deckListDict.findIndex(x=>x == deckName) == -1){
      deckListDict.push(deckName);
    }

    for (let index = 0; index < creatureDict.length; index++) {
      importantCards[index] = 0;
    }

    for (let i = 1; i < decklistAsArray.length; i++) {
      const line = decklistAsArray[i];
      if(line == "Sideboard"){
        continue;
      }
      // format is always `cardCount cardName` in goldfish
      var cardName = line.slice(2);
      var cardCount = line.split(" ")[0];
      importantCards[creatureDict.findIndex(x => x == cardName)] = cardCount;
    }

    const decklineString = [deckListDict.find(x => x == deckName)].concat(importantCards).join(",") + "\n";

    fs.appendFile(`output.txt`, decklineString, (err) => {
      if (err) {
        console.error('An error occurred:', err);
      } else {
        console.log('Appended successfully!');
      }

    });
  };

  await browser.close();

})();
