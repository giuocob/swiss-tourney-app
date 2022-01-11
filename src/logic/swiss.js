// Logic for running through a Swiss bracket, including pairings, standings, etc.

function isRealPlayerId(id) {
	if (id === 'bye' || id === 'forfeit') return false;
	return true;
}

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


function roundTiebreak(num) {
	return Math.floor(num * 1000) / 1000;
}

function calculateStandings(rounds, players) {
	let scores = {};
	let opponents = {};
	for (let playerId in players) {
		if (isRealPlayerId(playerId)) {
			scores[playerId] = {
				wins: 0,
				losses: 0,
				draws: 0,
				matchPoints: 0,
				matchPointsAvailable: 0,
				gamePoints: 0,
				gamePointsAvailable: 0,
				mwp: 0.33,
				omwp: 0,
				gwp: 0.33,
				ogwp: 0
			}
			opponents[playerId] = [];
		}
	}

	for (let round of rounds) {
		for (let pairing of round.pairings) {
			let gamesPlayed = pairing.wins[0] + pairing.wins[1] + pairing.draws;
			for (let [ ownIndex, oppIndex ] of [ [ 0, 1 ], [ 1, 0 ] ]) {
				let ownId = pairing.playerIds[ownIndex], oppId = pairing.playerIds[oppIndex];
				if (!isRealPlayerId(ownId)) continue;
				if (!scores[ownId]) {
					throw new Error('Unknown playerId: ' + ownId);
				}
				opponents[ownId].push(oppId);
				if (oppId === 'forfeit') continue;

				scores[ownId].matchPointsAvailable += 3;
				scores[ownId].gamePointsAvailable += (3 * gamesPlayed);
				scores[ownId].gamePoints += ((3 * pairing.wins[ownIndex]) + pairing.draws);
				if (pairing.winnerIndex === ownIndex) {
					scores[ownId].wins += 1;
					scores[ownId].matchPoints += 3;
				} else if (pairing.winnerIndex === oppIndex) {
					scores[ownId].losses += 1;
				} else if (pairing.winnerIndex === -1) {
					scores[ownId].draws += 1;
					scores[ownId].matchPoints += 1;
				}
			}
		}
	}

	for (let playerId in scores) {
		let scoreObj = scores[playerId];
		if (scoreObj.matchPointsAvailable === 0) {
			scoreObj.mwp = 0;
		} else {
			scoreObj.mwp = roundTiebreak(scoreObj.matchPoints / scoreObj.matchPointsAvailable);
		}
		if (scoreObj.mwp < 0.33) scoreObj.mwp = 0.33;
		if (scoreObj.gamePointsAvailable === 0) {
			scoreObj.gwp = 0;
		} else {
			scoreObj.gwp = roundTiebreak(scoreObj.gamePoints / scoreObj.gamePointsAvailable);
		}
		if (scoreObj.gwp < 0.33) scoreObj.gwp = 0.33;
	}

	for (let playerId in scores) {
		let scoreObj = scores[playerId];
		let realOpps = 0;
		let totalOmwp = 0;
		let totalOgwp = 0;
		for (let oppId of opponents[playerId]) {
			if (isRealPlayerId(oppId)) {
				realOpps += 1;
				totalOmwp += scores[oppId].mwp;
				totalOgwp += scores[oppId].gwp;
			}
		}
		if (realOpps === 0) {
			scoreObj.omwp = 0;
			scoreObj.ogwp = 0;
		} else {
			scoreObj.omwp = roundTiebreak(totalOmwp / realOpps);
			scoreObj.ogwp = roundTiebreak(totalOgwp / realOpps);
		}
	}

	let sortedPlayerIds = Object.keys(players).sort((a, b) => {
		let sa = scores[a], sb = scores[b];
		if (!sa || !sb) throw new Error();
		if (sa.matchPoints > sb.matchPoints) return -1;
		if (sa.matchPoints < sb.matchPoints) return 1;
		if (sa.omwp > sb.omwp) return -1;
		if (sa.omwp < sb.omwp) return 1;
		if (sa.gwp > sb.gwp) return -1;
		if (sa.gwp < sb.gwp) return 1;
		if (sa.ogwp > sb.ogwp) return -1;
		if (sa.ogwp < sb.ogwp) return 1;
		if (sa < sb) return -1;
		if (sa > sb) return 1;
		return 0;
	});
	let currentRank = 1;
	for (let playerId of sortedPlayerIds) {
		if (isRealPlayerId(playerId) && (players[playerId].status === 'active')) {
			scores[playerId].rank = currentRank;
			currentRank++;
		}
	}

	for (let playerId in scores) {
		delete scores[playerId].matchPointsAvailable;
		delete scores[playerId].gamePoints;
		delete scores[playerId].gamePointsAvailable;
	}
	return scores;
}

export default {
	isRealPlayerId,
	getDefaultMaxRounds,
	getPlayerStandingString,
	getSortedPlayerIds,
	getPairings,
	calculateStandings
};
