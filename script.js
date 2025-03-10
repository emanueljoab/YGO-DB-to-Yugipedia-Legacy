const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

function cleanText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/\n/g, '')
        .replace(/\t/g, '')
        .trim();
}

function sanitizeCardName(name) {
    return name.replace(/[#<>[\]{}|]/g, '');
}

function sanitizeDeckName(name) {
    return name.replace(/[<>:"/\\|?*]/g, '');
}

function ensureEnglishURL(url) {
    if (!url.includes('request_locale=')) {
        if (url.includes('?')) {
            url += '&request_locale=en';
        } else {
            url += '?request_locale=en';
        }
    } else {
        url = url.replace(/request_locale=\w+/, 'request_locale=en');
    }
    return url;
}

function promptUserForURL() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('> Enter deck URL: ', (url) => {
            rl.close();
            resolve(url);
        });
    });
}

function promptUserForMasterDuel() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        const ask = () => {
            rl.question('> Is this a Master Duel deck? (Y/N): ', (answer) => {
                const normalized = answer.trim().toUpperCase();
                if (normalized === 'Y' || normalized === 'N') {
                    rl.close();
                    resolve(normalized === 'Y');
                } else {
                    console.log('Invalid input. Please enter Y or N.');
                    ask();
                }
            });
        };
        ask();
    });
}

async function fetchDeckData() {
    console.log('Welcome! Please enter a valid Yu-Gi-Oh Card Database deck URL or type "exit" to quit.');
    const browser = await puppeteer.launch({ headless: true });

    const decklistsDir = path.join(__dirname, 'Decklists');
    if (!fs.existsSync(decklistsDir)) {
        fs.mkdirSync(decklistsDir);
        console.log(`Created directory: ${decklistsDir}`);
    }

    try {
        while (true) {
            const page = await browser.newPage();

            try {
                const userURL = await promptUserForURL();
                if (userURL.toLowerCase() === 'exit') {
                    break;
                }

                const isMasterDuel = await promptUserForMasterDuel();
                const DECK_URL = ensureEnglishURL(userURL);
                console.log(`Navigating to the entered page. Please wait...`);
                await page.goto(DECK_URL, { waitUntil: 'networkidle2' });

                console.log('Waiting for the page elements to load...');
                await page.waitForSelector('.t_row.c_normal', { timeout: 10000 });

                await page.exposeFunction('sanitizeCardName', sanitizeCardName);

                const deckName = await page.evaluate(() => {
                    const header = document.querySelector('#broad_title h1');
                    return header ? header.innerText.trim() : 'Unnamed Deck';
                });

                const cleanedDeckName = cleanText(deckName);
                console.log(`Deck name extracted: ${cleanedDeckName}`);

                const sanitizedDeckName = sanitizeDeckName(cleanedDeckName);
                const OUTPUT_FILE = path.join(decklistsDir, `${sanitizedDeckName} decklist.txt`);

                console.log('Extracting card information...');
                const deckData = await page.evaluate(async () => {
                    function getMonsterType(typeText) {
                        if (typeText.includes('Ritual')) return 'ritual monsters';
                        if (typeText.includes('Pendulum')) return 'pendulum monsters';
                        if (typeText.includes('Tuner')) return 'tuner monsters';
                        if (typeText.includes('Gemini')) return 'gemini monsters';
                        if (typeText.includes('Union')) return 'union monsters';
                        if (typeText.includes('Spirit')) return 'spirit monsters';
                        if (typeText.includes('Toon')) return 'toon monsters';
                        if (typeText.includes('Effect')) return 'effect monsters';
                        return 'normal monsters';
                    }

                    function getExtraMonsterType(typeText) {
                        if (typeText.includes('Fusion')) return 'fusion monsters';
                        if (typeText.includes('Synchro')) return 'synchro monsters';
                        if (typeText.includes('Xyz')) return 'xyz monsters';
                        if (typeText.includes('Link')) return 'link monsters';
                        return 'fusion monsters';
                    }

                    const deck = {
                        main: { monsters: [], spells: [], traps: [] },
                        extra: { monsters: [] },
                        side: { monsters: [], spells: [], traps: [] }
                    };

                    async function processCard(card, section) {
                        const name = await window.sanitizeCardName(card.querySelector('.card_name')?.innerText.trim() || 'Name not found');
                        const quantity = parseInt(card.querySelector('.cards_num_set span')?.innerText.trim()) || 1;

                        const attributeElement = card.querySelector('.box_card_attribute span');
                        const attribute = attributeElement ? attributeElement.innerText.trim() : '';

                        if (attribute === 'SPELL' || attribute === 'TRAP') {
                            const effectElement = card.querySelector('.box_card_effect span');
                            const subcategory = effectElement ? effectElement.innerText.trim() : '';
                            const type = subcategory || `Normal ${attribute}`;

                            if (section === 'main') {
                                if (attribute === 'SPELL') deck.main.spells.push({ name, quantity });
                                else if (attribute === 'TRAP') deck.main.traps.push({ name, quantity });
                            } else if (section === 'side') {
                                if (attribute === 'SPELL') deck.side.spells.push({ name, quantity });
                                else if (attribute === 'TRAP') deck.side.traps.push({ name, quantity });
                            }
                        } else {
                            const typeText = card.querySelector('.card_info_species_and_other_item')?.innerText.trim() || '';

                            if (section === 'main') {
                                const type = getMonsterType(typeText);
                                deck.main.monsters.push({ name, quantity, type });
                            } else if (section === 'extra') {
                                const type = getExtraMonsterType(typeText);
                                deck.extra.monsters.push({ name, quantity, type });
                            } else if (section === 'side') {
                                const type = getMonsterType(typeText);
                                deck.side.monsters.push({ name, quantity, type });
                            }
                        }
                    }

                    const mainDeckCards = document.querySelectorAll('#detailtext_main .t_row.c_normal');
                    for (const card of mainDeckCards) {
                        await processCard(card, 'main');
                    }

                    const extraDeckCards = document.querySelectorAll('#detailtext_ext .t_row.c_normal');
                    for (const card of extraDeckCards) {
                        await processCard(card, 'extra');
                    }

                    const sideDeckCards = document.querySelectorAll('#detailtext_side .t_row.c_normal');
                    for (const card of sideDeckCards) {
                        await processCard(card, 'side');
                    }

                    return deck;
                });

                console.log('Formatting the output in the Yugipedia template...');

                function formatCardList(cards, isMasterDuel) {
                    return cards.map(card => {
                        const quantity = card.quantity > 1 ? ` x${card.quantity}` : '';
                        return isMasterDuel 
                            ? `* [[${card.name} (Master Duel)|${card.name}]]${quantity}`
                            : `* [[${card.name}]]${quantity}`;
                    }).join('\n');
                }

                function countTotal(cards) {
                    return cards.reduce((total, card) => total + card.quantity, 0);
                }

                const mainMonsters = {
                    'normal monsters': [],
                    'effect monsters': [],
                    'toon monsters': [],
                    'spirit monsters': [],
                    'union monsters': [],
                    'gemini monsters': [],
                    'tuner monsters': [],
                    'pendulum monsters': [],
                    'ritual monsters': []
                };

                deckData.main.monsters.forEach(monster => {
                    mainMonsters[monster.type].push({ name: monster.name, quantity: monster.quantity });
                });

                const extraMonsters = {
                    'fusion monsters': [],
                    'synchro monsters': [],
                    'xyz monsters': [],
                    'link monsters': []
                };

                deckData.extra.monsters.forEach(monster => {
                    extraMonsters[monster.type].push({ name: monster.name, quantity: monster.quantity });
                });

                const sideMonsters = {
                    'side normal monsters': [],
                    'side effect monsters': [],
                    'side toon monsters': [],
                    'side spirit monsters': [],
                    'side union monsters': [],
                    'side gemini monsters': [],
                    'side tuner monsters': [],
                    'side pendulum monsters': [],
                    'side ritual monsters': []
                };

                deckData.side.monsters.forEach(monster => {
                    sideMonsters[`side ${monster.type}`].push({ name: monster.name, quantity: monster.quantity });
                });

                const totalMonsters = countTotal(deckData.main.monsters);
                const totalExtraMonsters = countTotal(deckData.extra.monsters);
                const totalSpells = countTotal(deckData.main.spells);
                const totalTraps = countTotal(deckData.main.traps);

                const template = `{{Decklist|${cleanedDeckName}
<!-- Main Deck -->
| total m = ${totalMonsters}
${Object.entries(mainMonsters)
                    .filter(([_, cards]) => cards.length > 0)
                    .map(([type, cards]) => `| ${type} =\n${formatCardList(cards, isMasterDuel)}`)
                    .join('\n')}
| total s = ${totalSpells}
${deckData.main.spells.length > 0 ? `| spells =\n${formatCardList(deckData.main.spells, isMasterDuel)}` : ''}
| total t = ${totalTraps}
${deckData.main.traps.length > 0 ? `| traps =\n${formatCardList(deckData.main.traps, isMasterDuel)}` : ''}

<!-- Extra Deck -->
| total me = ${totalExtraMonsters}
${Object.entries(extraMonsters)
                    .filter(([_, cards]) => cards.length > 0)
                    .map(([type, cards]) => `| ${type} =\n${formatCardList(cards, isMasterDuel)}`)
                    .join('\n')}

<!-- Side Deck -->
${Object.entries(sideMonsters)
                    .filter(([_, cards]) => cards.length > 0)
                    .map(([type, cards]) => `| ${type} =\n${formatCardList(cards, isMasterDuel)}`)
                    .join('\n')}${deckData.side.spells.length > 0 ? `| side spells =\n${formatCardList(deckData.side.spells, isMasterDuel)}` : ''}${deckData.side.traps.length > 0 ? `| side traps =\n${formatCardList(deckData.side.traps, isMasterDuel)}` : ''}
}}`.trim();

                console.log(`Saving the decklist to the file: ${OUTPUT_FILE}...`);
                fs.writeFileSync(OUTPUT_FILE, template, 'utf-8');

                console.log('File saved successfully!');
            } catch (error) {
                console.error('Error processing the URL:', error.message);
                console.log('Please try again with a valid URL.');
            } finally {
                await page.close();
            }
        }
    } catch (error) {
        console.error('Error extracting data:', error);
    } finally {
        console.log('Ending...');
        await browser.close();
    }
}

fetchDeckData();