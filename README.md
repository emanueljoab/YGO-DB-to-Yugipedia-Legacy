# YGO-DB-to-Yugipedia

This script extracts decks from the [Yu-Gi-Oh! Card Database](https://www.db.yugioh-card.com/yugiohdb/?request_locale=en) and formats them for [Yugipedia's Decklist template](https://yugipedia.com/wiki/Template:Decklist).

## Features

- **Extract Decks:** Pulls deck data directly from the official Yu-Gi-Oh! Card Database.
- **Format Decklists:** Converts the extracted data into a structured format that follows the {{Decklist}} template on Yugipedia.

## Prerequisites

- **[Node.js](https://nodejs.org/)**.

## Installation

### Using Terminal (requires [Git](https://git-scm.com/downloads](https://nodejs.org/en/download)))
- Open a terminal in the folder where you want to install the project.
- Run **one of** the following commands based on your CLI:

PowerShell:
```powershell
git clone https://github.com/emanueljoab/YGO-DB-to-Yugipedia.git; cd YGO-DB-to-Yugipedia; npm install
```

CMD:
```cmd
git clone https://github.com/emanueljoab/YGO-DB-to-Yugipedia.git && cd YGO-DB-to-Yugipedia && npm install
```

### ZIP file

- Download [ZIP file](https://github.com/emanueljoab/YGO-DB-to-Yugipedia/archive/refs/heads/main.zip).
- Extract it.
- Navigate to the folder.
- Open the terminal.
- Run the command `npm install`.

## How to use

- Run `start.bat`.
- Enter a valid YGO DB deck URL.
- Enter `Y` if it is a Master Duel deck, otherwise enter `N`.
- The formatted decklist will be saved as a .txt file inside the `Decklist` folder.

## Notes

- Only public decks work. Make sure your decks are public.
- If a card wasn't released in the TCG, its Japanese name will be displayed.
