# YGO-DB-to-Yugipedia

This script extracts decks from the [Yu-Gi-Oh! Card Database](https://www.db.yugioh-card.com/yugiohdb/?request_locale=en) and formats them for [Yugipedia's Decklist template](https://yugipedia.com/wiki/Template:Decklist).

## Features
- **Extract Decks:** Pulls deck data directly from the official Yu-Gi-Oh! Card Database.
- **Format Decklists:** Converts the extracted data into a structured format that follows the {{Decklist}} template on Yugipedia.

## Prerequisites

- **[Node.js](https://nodejs.org/)** (version 12 or higher)

## Installation

- If you have [Git](https://git-scm.com/downloads) installed, navigate to the folder where you want to install the project, open the Terminal and run one of the following commands:

PowerSheel:
```powershell
git clone https://github.com/emanueljoab/YGO-DB-to-Yugipedia.git; cd YGO-DB-to-Yugipedia; npm install
```

CMD:
```cmd
git clone https://github.com/emanueljoab/YGO-DB-to-Yugipedia.git && cd YGO-DB-to-Yugipedia && npm install
```

- Or download the [ZIP file](https://github.com/emanueljoab/YGO-DB-to-Yugipedia/archive/refs/heads/main.zip), extract it, navigate to the folder, open the Terminal, and run the command `npm install`.

## How to use

- Run `start.bat`.
- Enter a valid YGO DB deck URL.
- The formatted decklist will be saved as a .txt file inside the `Decklist` folder.
