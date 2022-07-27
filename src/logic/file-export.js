import { createObjectCsvStringifier } from 'csv-writer';
import swiss from './swiss';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

async function downloadStandingsCsv(tState) {
	let filename = '';
	if (tState.lifecycle === 'complete') {
		filename = 'final_standings.csv';
	} else if (tState.currentRoundNumber === 1) {
		filename = 'initial_standings.csv';
	} else {
		filename = `standings_after_round_${tState.currentRoundNumber - 1}.csv`;
	}
	let headers = [
		{ id: 'rank', title: 'Rank' },
		{ id: 'name', title: 'Name' },
		{ id: 'score', title: 'Score' },
		{ id: 'omwp', title: 'OMW' },
		{ id: 'gwp', title: 'GW' },
		{ id: 'ogwp', title: 'OGW' }
	];
	let records = Object.values(tState.players)
		.sort((a, b) => {
				let aRank = a.scores.rank || -1, bRank = b.scores.rank || -1;
				if (aRank < bRank) return -1;
				if (aRank > bRank) return 1;
				if (a.id < b.id) return -1;
				if (a.id > b.id) return 1;
				return 0;
			})
			.filter((player) => ((player.status === 'active') || (player.status === 'eliminated')))
			.map((player) => {
				return {
					name: player.name,
					score: swiss.getPlayerStandingString(player),
					...(player.scores || {})
				};
			});

	let csvStringifier = createObjectCsvStringifier({ header: headers });
	let csvData = `${csvStringifier.getHeaderString()}${csvStringifier.stringifyRecords(records)}`;
	let e = document.createElement('a');
	e.setAttribute('href', 'data:text/csv;charset=utf8,' + encodeURIComponent(csvData));
	e.setAttribute('download', filename);
	e.style.display = 'none';
	document.body.appendChild(e);
	e.click();
	document.body.removeChild(e);
}

async function downloadRoundCsv(tState, expandedPairings, roundNumber, includeScores) {
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
		...nameHeaders
	];
	if (includeScores) {
		headers.push(...winHeaders, { id: 'draws', title: 'draws' });
	}
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

async function downloadAllRoundsCsv(tState, getters) {
	let nameHeaders = [], winHeaders = []
	for (let i = 0; i < tState.playersPerRound; i++) {
		let name = `player${i + 1}`;
		let wins = `player${i + 1}Wins`;
		nameHeaders.push({ id: name, title: name });
		winHeaders.push({ id: wins, title: wins });
	}
	let headers = [
		{ id: 'round', title: 'round' },
		{ id: 'tableNumber', title: 'tableNumber' },
		...nameHeaders,
		...winHeaders,
		{ id: 'draws', title: 'draws' }
	];
	let records = [];
	for (let i = 0; i < tState.rounds.length; i++) {
		let roundNumber = i + 1;
		let expandedPairings = getters.expandedPairingsByRound(roundNumber);
		records.push(...expandedPairings.map((pairing) => {
			let record = {
				round: roundNumber,
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
		}));
	}

	let csvStringifier = createObjectCsvStringifier({ header: headers });
	let csvData = `${csvStringifier.getHeaderString()}${csvStringifier.stringifyRecords(records)}`;
	let csvFilename = `all_pairings.csv`;

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
	const FONT_SIZE = 14;
	const LINE_SPACING = FONT_SIZE * 1.2;
	const X_MARGIN = 50;
	const BLOCK_Y_MARGIN = 30;

	let roundNumberStr = '' + ((roundNumber === 'currentRound') ? tState.currentRoundNumber : roundNumber);
	let filename = `round_${roundNumberStr}_slips.pdf`;
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
		let lineTexts = [
			`Round ${roundNumberStr}, Table ${pairing.tableNumber}`,
			`(please circle winner)`,
			' ',
			...pairing.players.map((player) => {
				let playerName = player.name;
				if (!swiss.isRealPlayerId(player.id)) {
					playerName = `(${playerName})`;
				}
				return playerName;
			}),
			' ',
			'(Circle if draw)',
			'_________________________________________________________________'
		]
		for (let text of lineTexts) {
			currentPage.drawText(text, {
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
	e.setAttribute('download', filename);
	e.style.display = 'none';
	document.body.appendChild(e);
	e.click();
	document.body.removeChild(e);
}

export { downloadRoundCsv, downloadAllRoundsCsv, downloadStandingsCsv, downloadRoundPairingSlipsPdf };
