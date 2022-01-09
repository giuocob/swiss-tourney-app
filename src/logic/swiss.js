// Logic for running through a Swiss bracket, including pairings, standings, etc.

function getDefaultMaxRounds(numPlayers) {
	return Math.ceil(Math.log(numPlayers) / Math.log(2));
}

function getPlayerStandingString(playerObj) {
	return `${playerObj.scores.wins}-${playerObj.scores.losses}-${playerObj.scores.draws}`;
}

function getSortedPlayerIds(players) {
	return players.sort((a, b) => {
		if (a.rank < b.rank) return -1;
		if (a.rank > b.rank) return 1;
		if (a.id < b.id) return -1;
		if (a.id > b.id) return 1;
		return 0;
	}).map((p) => p.id);
}

// Temporary
function getPairings(players) {
	let playerIds = getSortedPlayerIds(players);
	let pairings = [];
	for (let i = 0; i < playerIds.length; i += 2) {
		if ((i + 1) < playerIds.length) {
			pairings.push({ playerIds: [ playerIds[i], playerIds[i + 1] ] });
		} else {
			pairings.push({ playerIds: [ playerIds[i], 'bye' ] });
		}
	}
	return pairings;
}

function calculateScores(players) {
		console.log(JSON.stringify(players,null,4));
}

export default {
	getDefaultMaxRounds,
	getPlayerStandingString,
	getSortedPlayerIds,
	getPairings
};
