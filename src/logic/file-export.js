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
	const pdfDoc = await PDFDocument.create();
	const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
	const page = pdfDoc.addPage();
	const { width, height } = page.getSize();
	const fontSize = 30;
	page.drawText('Creating PDFs in JavaScript is awesome!', {
	  x: 50,
	  y: height - 4 * fontSize,
	  size: fontSize,
	  font: timesRomanFont,
	  color: rgb(0, 0.53, 0.71),
	});
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
