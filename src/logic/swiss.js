// Logic for running through a Swiss bracket, including pairings, standings, etc.
import shuffle from 'array-shuffle';

function isRealPlayerId(id) {
	if (id === 'bye' || id === 'forfeit' || id === 'none') return false;
	return true;
}

function getDefaultMaxRounds(numPlayers) {
	return Math.ceil(Math.log(numPlayers) / Math.log(2));
}

function getPlayerStandingString(playerObj) {
	return `${playerObj.scores.wins}-${playerObj.scores.losses}-${playerObj.scores.draws}`;
}

function getRoundSettings(players, roundOptions) {
	let playerCount = Object.values(players).reduce((acc, elem) => {
		if (elem.status === 'active') return acc + 1;
		return acc;
	}, 0);
	let minPlayersPerRound, pairingSizes, byes, mwpBound;
	if (roundOptions.playersPerRound === 2) {
		minPlayersPerRound = 2;
		byes = playerCount % 2;
		mwpBound = 0.33;
		pairingSizes = [];
		for (let i = 1; i < playerCount; i += 2) {
			pairingSizes.push(2);
		}
	} else {
		minPlayersPerRound = roundOptions.playersPerRound - 1;
		mwpBound = 0.1;
		pairingSizes = [];
		let minPlayerPairingCount = Math.floor(playerCount / minPlayersPerRound);
		let maxPlayerPairingCount = 0;
		let leftoverPlayers = playerCount % minPlayersPerRound;
		if (minPlayerPairingCount === 0) {
			byes = playerCount;
		} else {
			// Use byes to fill up as many pairings as possible
			let byesToMove = Math.min(leftoverPlayers, minPlayerPairingCount);
			minPlayerPairingCount -= byesToMove;
			maxPlayerPairingCount += byesToMove;
			leftoverPlayers -= byesToMove;
			if (leftoverPlayers > 0) {
				byes = leftoverPlayers;
			} else {
				byes = 0;
				// Comine min pairings to make optimal pairings
				maxPlayerPairingCount += Math.floor(minPlayerPairingCount / roundOptions.playersPerRound) * minPlayersPerRound;
				minPlayerPairingCount = minPlayerPairingCount % roundOptions.playersPerRound;
			}
		}
		for (let i = 0; i < maxPlayerPairingCount; i++) {
			pairingSizes.push(roundOptions.playersPerRound);
		}
		for (let i = 0; i < minPlayerPairingCount; i++) {
			pairingSizes.push(minPlayersPerRound);
		}
	}

	return {
		playersPerRound: roundOptions.playersPerRound,
		minPlayersPerRound,
		pairingSizes,
		byes,
		mwpBound
	};
}


// Calculate the next round of pairings. Assumes that the players' scores are up to date.
async function getNextPairings(prevRounds, players, roundOptions = {}) {

	roundOptions = {
		playersPerRound: roundOptions.playersPerRound || 2
	};
	let roundSettings = getRoundSettings(players, roundOptions);

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
			for (let currentPlayerIndex = 0; currentPlayerIndex < pairing.playerIds.length; currentPlayerIndex++) {
				let currentPlayerId = pairing.playerIds[currentPlayerIndex];
				if (!isRealPlayerId(currentPlayerId)) continue;
				if (!playerByes[currentPlayerId]) playerByes[currentPlayerId] = 0;
				let oppPlayerIds = pairing.playerIds.filter((elem, i) => (i !== currentPlayerIndex));
				if (!playerOpponents[currentPlayerId]) playerOpponents[currentPlayerId] = {};
				for (let oppPlayerId of oppPlayerIds) {
					if (isRealPlayerId(oppPlayerId)) {
						if (!playerOpponents[currentPlayerId][oppPlayerId]) playerOpponents[currentPlayerId][oppPlayerId] = 0;
						playerOpponents[currentPlayerId][oppPlayerId]++;
					}
				}
				if (oppPlayerIds.every((pid) => (pid === 'bye' || pid === 'none'))) {
					playerByes[currentPlayerId]++;
				}
			}
		}
	}

	// Returns true if player can be added to the pairing under current aopt restrictions
	function canPair(pid, pairing, aopts) {
		if (aopts.allowAllRepeats) return true;
		let repeatsByPlayer = {};
		for (let playerId of [ pid, ...pairing ]) {
			if (!playerOpponents[playerId]) {
				throw new Error('Logical error in canPair');
			}
			repeatsByPlayer[playerId] = 0;
			for (let oppPlayerId of [ pid, ...pairing ]) {
				if (!playerOpponents[oppPlayerId]) {
					throw new Error('Logical error in canPair');
				}
				if (
					playerOpponents[playerId][oppPlayerId] ||
					playerOpponents[oppPlayerId][playerId]
				) {
					repeatsByPlayer[playerId] += 1;
				}
			}
		}
		for (let playerId in repeatsByPlayer) {
			if (repeatsByPlayer[playerId] > (aopts.allowPartialRepeats || 0)) {
				return false;
			}
		}
		return true;
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
		let pairingSizes = [ ...roundSettings.pairingSizes ];
		let cPairs = [];
		let byePlayers = [];
		let floatPlayers = [];
		let fullFail = false;
		for (let sbi = 0; sbi < scoreBuckets.length; sbi++) {
			if (fullFail) break;
			for (let sbattempt = 1; sbattempt <= ATTEMPTS_PER_BUCKET; sbattempt++) {
				let currentBucket = shuffle([ ...scoreBuckets[sbi] ]);
				let currentFloatPlayers = shuffle([ ...floatPlayers ]);
				let bucketPairingSizes = [ ...pairingSizes ];
				let bucketCPairs = [];
				let failedToPair = [];
				let bucketFail = false;

				// For each player in the bucket, pair with the nearest available player in score bucket
				// Players floating down get paired first
				let currentPair = [];
				let allAvailablePlayers = [ ...currentFloatPlayers, ... currentBucket ];

				// If this is lowest bucket and we need a bye, pick the bye player(s) now
				if (
					(sbi === scoreBuckets.length - 1) &&
					(roundSettings.byes > 0)
				) {
					for (let bi = allAvailablePlayers.length - 1; bi >= 0; bi--) {
						let cPlayerId = allAvailablePlayers[bi];
						if (!playerByes[cPlayerId] || aopts.allowMultipleByes) {
							byePlayers.push(cPlayerId);
							allAvailablePlayers.splice(bi, 1);
							if (byePlayers.length === roundSettings.byes) break;
						}
					}
					if (byePlayers.length !== roundSettings.byes) {
						bucketFail = true;
					}
				}

				// Each iteration always removes 1 pid from allAvailablePlayers, OR clears currentPair
				// to guarantee an element removal from the next one
				while (allAvailablePlayers.length + currentPair.length >= (bucketPairingSizes[0] || 0)) {
					if (bucketPairingSizes.length === 0) break;
					if (currentPair.length === 0) {
						// Add first pid in line to start the pairing
						currentPair.push(allAvailablePlayers.shift());
					} else {
						// Look for a random player to fit the current pair
						let didPair = false;
						for (let cPid of shuffle([ ...allAvailablePlayers ])) {
							if (canPair(cPid, currentPair, aopts)) {
								currentPair.push(cPid);
								allAvailablePlayers = allAvailablePlayers.filter((elem) => (elem !== cPid));
								didPair = true;
								break;
							}
						}
						if (!didPair) {
							failedToPair.push(...currentPair);
							currentPair = [];
							bucketFail = true;
						} else if (didPair && currentPair.length === bucketPairingSizes[0]) {
							bucketCPairs.push([ ...currentPair ]);
							currentPair = [];
							bucketPairingSizes.shift();
						} else {
							// Do nothing (leave partial pairing for next loop iteration)
						}
					}
				}

				if (currentPair.length > 0) {
					throw new Error('Logical error in getNextPairings');
				}
				if (bucketFail) {
					if (sbattempt < ATTEMPTS_PER_BUCKET) {
						// Reset and try bucket again
						continue;
					} else if (sbi === scoreBuckets.length - 1) {
						// Unresolved pairings at the end; scrap attempt
						fullFail = true;
						break;
					} else if (!aopts.allowExtraFloats) {
						// Attempts with bucket fails aren't allowed yet
						fullFail = true;
						break;
					} else {
						// Float all failed pairings down and hope for the best :)
						floatPlayers = [ ...allAvailablePlayers, ...failedToPair ];
						cPairs.push(...bucketCPairs);
						pairingSizes = [ ...bucketPairingSizes ];
						break;
					}
				} else {
					// Move to next bucket; anything left in currentBucket floats down
					if ((sbi === scoreBuckets.length - 1) && (allAvailablePlayers.length > 0)) {
						throw new Error('Logical error in getNextPairings');
					}
					floatPlayers = [ ...allAvailablePlayers ];
					cPairs.push(...bucketCPairs);
					pairingSizes = [ ...bucketPairingSizes ];
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
				if (pairingSizes.length > 0) {
					throw new Error('Logical error in getNextPairings');
				}
				for (let cPair of cPairs) {
					while (cPair.length < roundSettings.playersPerRound) {
						cPair.push('none');
					}
				}
				for (let byePlayerId of byePlayers) {
					let byePair = [ byePlayerId ];
					while (byePair.length < roundSettings.playersPerRound) {
						byePair.push('bye');
					}
					cPairs.push(byePair);
				}
				return cPairs;
		}
	}

	// Attempt 10 pairs normally, then 10 allowing multiple byes, then 1 allowing anything
	const ATTEMPTS_NORMAL = 10;
	const ATTEMPTS_ALLOW_EXTRA_FLOATS = 10;
	const ATTEMPTS_ALLOW_PARTIAL_REPEATS = 10;
	const ATTEMPTS_MULTIPLE_BYES = 10;
	const ATTEMPTS_ANYTHING = 1;
	let retPairings;
	let attemptOptions = {};
	for (let i = 0; i < ATTEMPTS_NORMAL; i++) {
		retPairings = attemptPair({ ...attemptOptions });
		if (retPairings) break;
	}
	if (!retPairings) {
		attemptOptions.allowExtraFloats = true;
		for (let i = 0; i < ATTEMPTS_ALLOW_EXTRA_FLOATS; i++) {
			retPairings = attemptPair({ ...attemptOptions });
			if (retPairings) break;
		}
	}
	if (!retPairings) {
		// In multiplayer tourneys, allow players to repeat one opponent per pod, then, two, etc,
		// stopping just short of allowing a full pod repeat
		for (let repeatCount = 1; repeatCount < roundSettings.playersPerRound - 1; repeatCount++) {
			attemptOptions.allowPartialRepeats = repeatCount;
			for (let i = 0; i < ATTEMPTS_ALLOW_PARTIAL_REPEATS; i++) {
				retPairings = attemptPair({ ...attemptOptions });
				if (retPairings) break;
			}
			if (retPairings) break;
		}
	}
	if (!retPairings) {
		attemptOptions.allowMultipleByes = true;
		for (let i = 0; i < ATTEMPTS_MULTIPLE_BYES; i++) {
			retPairings = attemptPair({ ...attemptOptions });
			if (retPairings) break;
		}
	}
	if (!retPairings) {
		attemptOptions.allowAllRepeats = true;
		for (let i = 0; i < ATTEMPTS_ANYTHING; i++) {
			retPairings = attemptPair({ ...attemptOptions });
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


// Get the set of players that need to be marked eliminated at the end of a round.
// Assumes player scores are up to date.
function getEliminatedPlayers(players, elimThreshold) {
	let elimPlayers = [];
	if (!elimThreshold || elimThreshold <=0) return elimPlayers;
	let maxMatchPoints = 0;
	for (let player of Object.values(players)) {
		if ((player?.scores?.matchPoints || 0) > maxMatchPoints) {
			maxMatchPoints = player.scores.matchPoints;
		}
	}
	for (let playerId in players) {
		let player = players[playerId];
		if (player.status !== 'active') continue;
		if ((player?.scores?.matchPoints || 0) <= (maxMatchPoints - elimThreshold)) {
			elimPlayers.push(playerId);
		}
	}
	return elimPlayers;
}


function roundTiebreak(num) {
	return Math.floor(num * 1000) / 1000;
}

function calculateStandings(rounds, players, roundOptions) {
	roundOptions = {
		playersPerRound: roundOptions.playersPerRound || 2
	};
	let roundSettings = getRoundSettings(players, roundOptions);

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
				mwp: roundSettings.mwpBound,
				omwp: 0,
				gwp: roundSettings.mwpBound,
				ogwp: 0
			}
			opponents[playerId] = [];
		}
	}

	for (let round of rounds) {
		for (let pairing of round.pairings) {
			let gamesPlayed = pairing.wins.reduce((acc, elem) => acc + elem, 0);
			for (let i = 0; i < pairing.playerIds.length; i++) {
				let ownId = pairing.playerIds[i];
				if (!isRealPlayerId(ownId)) continue;
				if (!scores[ownId]) {
					throw new Error('Unknown playerId: ' + ownId);
				}
				for (let k = 0; k < pairing.playerIds.length; k++) {
					let oppId = pairing.playerIds[k];
					if (i !== k) opponents[ownId].push(oppId);
				}
				scores[ownId].matchPointsAvailable += 3;
				scores[ownId].gamePointsAvailable += (3 * gamesPlayed);
				scores[ownId].gamePoints += ((3 * pairing.wins[i]) + pairing.draws);
				if (typeof pairing.winnerIndex !== 'number') {
					// Round is somehow unscored, so ignore
				} else if (pairing.winnerIndex === i) {
					// Player is round winner
					scores[ownId].wins += 1;
					scores[ownId].matchPoints += 3;
				} else if (pairing.winnerIndex === -1) {
					// Round is a draw
					scores[ownId].draws += 1;
					scores[ownId].matchPoints += 1;
				} else {
					// Player is round loser
					scores[ownId].losses += 1;
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
		if (scoreObj.mwp < roundSettings.mwpBound) scoreObj.mwp = roundSettings.mwpBound;
		if (scoreObj.gamePointsAvailable === 0) {
			scoreObj.gwp = 0;
		} else {
			scoreObj.gwp = roundTiebreak(scoreObj.gamePoints / scoreObj.gamePointsAvailable);
		}
		if (scoreObj.gwp < roundSettings.mwpBound) scoreObj.gwp = roundSettings.mwpBound;
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
		if (
			isRealPlayerId(playerId) &&
			((players[playerId].status === 'active') || (players[playerId].status === 'eliminated'))
		) {
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
	getRoundSettings,
	getNextPairings,
	getEliminatedPlayers,
	calculateStandings
};
