import { createObjectCsvStringifier } from 'csv-writer';
import swiss from './swiss';

async function downloadFile(filename, fileData) {
	let e = document.createElement('a');
	e.setAttribute('href', 'data:text/csv;charset=utf8,' + encodeURIComponent(fileData));
	e.setAttribute('download', filename);
	e.style.display = 'none';
	document.body.appendChild(e);
	e.click();
	document.body.removeChild(e);
}

async function exportRoundCsv(tState, expandedPairings, roundNumber) {
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
	await downloadFile(csvFilename, csvData);
}

export { exportRoundCsv };
