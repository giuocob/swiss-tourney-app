// Logic for running through a Swiss bracket, including pairings, standings, etc.

function getDefaultMaxRounds(numPlayers) {
	return Math.ceil(Math.log(numPlayers) / Math.log(2));
}

function getPlayerStandingString(playerObj) {
	return `${playerObj.scores.wins}-${playerObj.scores.losses}-${playerObj.scores.draws}`;
}

function getSortedPlayerIds(players) {
	return Object.keys(players).sort((a, b) => {
		let pa = players[a], pb = players[b];
		if (pa.rank < pb.rank) return -1;
		if (pa.rank > pb.rank) return 1;
		if (a < b) return -1;
		if (a > b) return 1;
		return 0;
	});
}

// Temporary
function getPairings(players) {
	let playerIds = getSortedPlayerIds(players);
	let pairings = [];
	for (let i = 0; i < playerIds.length; i += 2) {
		if ((i + 1) < playerIds.length) {
			pairings.push([ playerIds[i], playerIds[i + 1] ]);
		} else {
			pairings.push([ playerIds[i], 'bye' ]);
		}
	}
	return pairings;
}

export default {
	getDefaultMaxRounds,
	getPlayerStandingString,
	getSortedPlayerIds,
	getPairings
};
