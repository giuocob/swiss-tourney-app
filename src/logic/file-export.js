import { createObjectCsvStringifier } from 'csv-writer';
import swiss from './swiss';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

async function downloadRoundCsv(tState, expandedPairings, roundNumber) {
	let roundNumberStr = '' + ((roundNumber === 'currentRound') ? tState.currentRoundNumber : roundNumber);
	let nameHeaders = [], winHeaders = []
	for (let i = 0; i < tState.playersPerRound; i++) {
		let name = `player${i + 1}`;
		let wins = `player${i + 1}Wins`;
		nameHeaders.push({ id: name, title: name });
		winHeaders.push({ id: wins, title: wins });
	}
	let headers = [
		{ id: 'tableNumber', title: 'tableNumber' },
		...nameHeaders,
		...winHeaders,
		{ id: 'draws', title: 'draws' }
	];
	let records = expandedPairings.map((pairing) => {
		let record = {
			tableNumber: pairing.tableNumber,
			draws: pairing.draws || 0
		};
		for (let i = 0; i < pairing.players.length; i++) {
			let playerName = pairing.players[i].name;
			if (!swiss.isRealPlayerId(pairing.players[i].id)) {
				playerName = `(${playerName})`;
			}
			record[`player${i + 1}`] = playerName
			record[`player${i + 1}Wins`] = pairing.players[i].wins || 0;
		}
		return record;
	});

	let csvStringifier = createObjectCsvStringifier({ header: headers });
	let csvData = `${csvStringifier.getHeaderString()}${csvStringifier.stringifyRecords(records)}`;
	let csvFilename = `round_${roundNumberStr}_pairings.csv`;

	let e = document.createElement('a');
	e.setAttribute('href', 'data:text/csv;charset=utf8,' + encodeURIComponent(csvData));
	e.setAttribute('download', csvFilename);
	e.style.display = 'none';
	document.body.appendChild(e);
	e.click();
	document.body.removeChild(e);
}

async function downloadRoundPairingSlipsPdf(tState, expandedPairings, roundNumber) {
	const SLIPS_PER_PAGE = 4;
	const FONT_SIZE = 16;
	const LINE_SPACING = FONT_SIZE * 1.2;
	const X_MARGIN = 50;
	const BLOCK_Y_MARGIN = 30;

	let pdfDoc = await PDFDocument.create();
	let pdfFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
	let currentPage = pdfDoc.addPage();
	let { width, height } = currentPage.getSize();
	let currentPagePos = 0;

	for (let pairing of expandedPairings) {
		if (!pairing.canScore) continue;
		if (currentPagePos >= SLIPS_PER_PAGE) {
			currentPagePos = 0;
			currentPage = pdfDoc.addPage();
		}
		let blockTopMarker = height - (height * currentPagePos / SLIPS_PER_PAGE);
		let blockBottomMarker = height - (height * (currentPagePos + 1) / SLIPS_PER_PAGE);
		let [ blockYStart, blockYEnd ] = [ blockTopMarker - BLOCK_Y_MARGIN, blockBottomMarker + BLOCK_Y_MARGIN ];
		let currentBlockPos = 0;
		for (let player of pairing.players) {
			let playerName = player.name;
			if (!swiss.isRealPlayerId(player.id)) {
				playerName = `(${playerName})`;
			}
			currentPage.drawText(playerName, {
				x: X_MARGIN,
				y: blockYStart - currentBlockPos * LINE_SPACING,
				size: FONT_SIZE,
				font: pdfFont,
				color: rgb(0, 0, 0)
			});
			currentBlockPos++;
		}
		currentPagePos++;
	}

	let pdfBytes = await pdfDoc.save();
	let blob = new Blob([ pdfBytes ], { type: 'application/pdf' });
	let e = document.createElement('a');
	e.setAttribute('href', window.URL.createObjectURL(blob));
	e.setAttribute('download', 'test.pdf');
	e.style.display = 'none';
	document.body.appendChild(e);
	e.click();
	document.body.removeChild(e);
}

export { downloadRoundCsv, downloadRoundPairingSlipsPdf };
