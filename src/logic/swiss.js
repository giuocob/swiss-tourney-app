// Logic for running through a Swiss bracket, including pairings, standings, etc.
import shuffle from 'array-shuffle';

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


// Calculate the next round of pairings. Assumes that the players' scores are up to date.
async function getNextPairings(prevRounds, players) {

	function canPair(pid1, pid2) {
		if (
			playerOpponents[pid1][pid2] ||
			playerOpponents[pid2][pid1]
		) {
			return false;
		}
		return true;
	}

	// { 33: [ 'p0001', 'p0002' ], ... } (does not include dropped or locked players)
	let playersByScore = {};
	// { p0001: { p0002: true, p0004: true } ... }
	let playerOpponents = {};
	// { p0001: true, ... }
	let playerByes = {};

	// Populate the above three maps from prevRounds and players
	for (let playerId in players) {
		if (!isRealPlayerId(playerId)) continue;
		playerOpponents[playerId] = {};
		let player = players[playerId];
		if (player.status === 'active') {
			let matchPoints = player.scores.matchPoints;
			if (!playersByScore[matchPoints]) playersByScore[matchPoints] = [];
			playersByScore[matchPoints].push(playerId);
		}
	}
	for (let round of prevRounds) {
		for (let pairing of round.pairings) {
			for (let [ ownIndex, oppIndex ] of [ [ 0, 1 ], [ 1, 0 ] ]) {
				let ownId = pairing.playerIds[ownIndex], oppId = pairing.playerIds[oppIndex];
				if (!isRealPlayerId(ownId)) continue;
				if (!playerOpponents[ownId]) playerOpponents[ownId] = {};
				playerOpponents[ownId][oppId] = true;
				if (oppId === 'bye') {
					playerByes[oppId] = true;
				}
			}
		}
	}

	// Call this with increasingly lax restrictions if needed
	const ATTEMPTS_PER_BUCKET = 5;
	function attemptPair(aopts = {}) {
		let scoreBuckets = Object.keys(playersByScore)
			.map((n) => parseInt(n))
			.sort((a, b) => b - a)
			.map((score) => {
				return [ ...playersByScore[score] ];
			});
		let cPairs = [];
		let byePlayerId = null;
		let floatPlayers = [];
		let fullFail = false;
		for (let sbi = 0; sbi < scoreBuckets.length; sbi++) {
			if (fullFail) break;
			for (let sbattempt = 1; sbattempt <= ATTEMPTS_PER_BUCKET; sbattempt++) {
				let currentBucket = shuffle([ ...scoreBuckets[sbi] ]);
				let currentFloatPlayers = shuffle([ ...floatPlayers ]);
				let bucketCPairs = [];
				let failedToPair = [];
				let bucketFail = false;

				// If this is lowest bucket and we need a bye, pick the bye player now
				if (
					(sbi === scoreBuckets.length - 1) &&
					((floatPlayers.length + currentBucket.length) % 2 === 1)
				) {
					for (let bi = 0; bi < currentBucket.length; bi++) {
						let cPlayerId = currentBucket[bi];
						if (!playerByes[cPlayerId] || aopts.allowMultipleByes) {
							byePlayerId = cPlayerId;
							currentBucket.splice(bi, 1);
							break;
						}
					}
					if (!byePlayerId) {
						bucketFail = true;
					}
				}

				// For each player in the bucket, pair with the nearest available player in score bucket
				// Players floating down get paired first
				while (currentFloatPlayers.length > 0) {
					let floatPlayerId = currentFloatPlayers[0];
					currentFloatPlayers.splice(0, 1);
					let didPair = false;
					for (let pi = 0; pi < currentBucket.length; pi++) {
						let oppPlayerId = currentBucket[pi];
						if (canPair(floatPlayerId, oppPlayerId) || aopts.allowRepeats) {
							bucketCPairs.push([ floatPlayerId, oppPlayerId ]);
							currentBucket.splice(pi, 1);
							didPair = true;
							break;
						}
					}
					if (!didPair) {
						failedToPair.push(floatPlayerId);
						bucketFail = true;
					}
				}
				while (currentBucket.length > 1) {
					let matchPlayerId = currentBucket[0];
					currentBucket.splice(0, 1);
					let didPair = false;
					for (let pi = 0; pi < currentBucket.length; pi++) {
						let oppPlayerId = currentBucket[pi];
						if (canPair(matchPlayerId, oppPlayerId) || aopts.allowRepeats) {
							bucketCPairs.push([ matchPlayerId, oppPlayerId ]);
							currentBucket.splice(pi, 1);
							didPair = true;
							break;
						}
					}
					if (!didPair) {
						failedToPair.push(matchPlayerId);
						bucketFail = true;
					}
				}

				if (bucketFail) {
					if (sbattempt < ATTEMPTS_PER_BUCKET) {
						// Reset and try bucket again
						continue;
					} else if (sbi === scoreBuckets.length - 1) {
						// Unresolved pairings at the end; scrap attempt
						fullFail = true;
						break;
					} else {
						// Float all failed pairings down and hope for the best :)
						floatPlayers = [ ...currentBucket, ...failedToPair ];
						cPairs.push(...bucketCPairs);
						break;
					}
				} else {
					// Move to next bucket; anything left in currentBucket floats down
					if (currentBucket.length > 1) {
						throw new Error('Logical error in getNextPairings');
					}
					floatPlayers = [ ...currentBucket ];
					cPairs.push(...bucketCPairs);
					break;
				}
			}
		}

		if (fullFail) {
			return null;
		} else {
				if (floatPlayers.length > 0) {
					throw new Error('Logical error in getNextPairings');
				}
				if (byePlayerId) {
					cPairs.push([ byePlayerId, 'bye' ]);
				}
				return cPairs;
		}

	}

	// Attempt 10 pairs normally, then 10 allowing multiple byes, then 1 allowing anything
	const ATTEMPTS_NORMAL = 10;
	const ATTEMPTS_MULTIPLE_BYES = 10;
	const ATTEMPTS_ANYTHING = 1;
	let retPairings;
	for (let i = 0; i < ATTEMPTS_NORMAL; i++) {
		retPairings = attemptPair({});
		if (retPairings) break;
	}
	if (!retPairings) {
		for (let i = 0; i < ATTEMPTS_MULTIPLE_BYES; i++) {
			retPairings = attemptPair({ allowMultipleByes: true });
			if (retPairings) break;
		}
	}
	if (!retPairings) {
		for (let i = 0; i < ATTEMPTS_ANYTHING; i++) {
			retPairings = attemptPair({ allowMultipleByes: true, allowRepeats: true });
			if (retPairings) break;
		}
	}
	if (!retPairings) {
		throw new Error('Logical error in getNextPairings');
	}

	return retPairings.map((p) => {
		return { playerIds: p };
	});
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
	getNextPairings,
	calculateStandings
};
