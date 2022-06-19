import _ from 'lodash';
import swiss from './swiss';
import { exportRoundCsv } from './file-export';

/*
	Sample structure of tState:
	{
		lifecycle: 'in-progress',
		players: [
			{ id: 2, name: 'Alice', status: 'active' },
			{ id: 3, name: 'Bob', status: 'dropped' }
		],
		nextPlayerIdNum: 4,
		maxRounds: 3,
		currentRoundNumber: 2,
		currentRound: {
			pairings: [ {
				pairingId: 1,
			  playerIds: [ 'p0001', 'bye' ],
				wins: [ 2, 0 ],
				draws: 0,
				winnerIndex: 0  // -1 for draw, undefined for no winner decided
		  } ]
		},
		roundLifecycle: 'in-progress',
		standingsRefreshed: true,
		rounds: [ ... ]  // Only completed rounds
	}
*/
const INITIAL_TSTATE = {
	lifecycle: 'setup-player-entry',
	players: {},
	rounds: [],
	nextPlayerIdNum: 1,
	standingsRefreshed: true
};

function vuexConfig(appContext) {
	return {
		state: {
			activeTournament: {}
		},
		mutations: {
			setActiveTournament(state, payload) {
				state.activeTournament = _.cloneDeep(payload);
			},
			setLifecycle(state, { lifecycle }) {
				state.activeTournament.lifecycle = lifecycle;
			},
			setupAddPlayer(state, payload) {
				let tState = state.activeTournament;
				let playerId = 'p' + ('' + tState.nextPlayerIdNum).padStart(4, '0');
				tState.players[playerId] = {
					id: playerId,
					name: payload.name,
					status: 'setup'
				};
				tState.nextPlayerIdNum += 1;
			},
			activeAddPlayer(state, payload) {
				let tState = state.activeTournament;
				let playerId = 'p' + ('' + tState.nextPlayerIdNum).padStart(4, '0');
				tState.players[playerId] = {
					id: playerId,
					name: payload.name,
					status: 'active',
					scores: {}
				};
				if (tState.currentRound && tState.roundLifecycle === 'setup') {
					tState.currentRound.pairingsValid = false;
				}
				tState.nextPlayerIdNum += 1;
			},
			setupDeletePlayer(state, { playerId }) {
				let tState = state.activeTournament;
				delete tState.players[playerId];
			},
			dropPlayer(state, { playerId }) {
				let tState = state.activeTournament;
				let player = tState.players[playerId];
				if (player) player.status = 'dropped';
			},
			setPlayerEliminated(state, { playerId }) {
				let tState = state.activeTournament;
				let player = tState.players[playerId];
				if (player) player.status = 'eliminated';
			},
			setOptions(state, { maxRounds, playersPerRound, byeGamesAwarded, matchPointElimThreshold }) {
				state.activeTournament.maxRounds = maxRounds;
				state.activeTournament.playersPerRound = playersPerRound;
				state.activeTournament.byeGamesAwarded = byeGamesAwarded;
				state.activeTournament.matchPointElimThreshold = matchPointElimThreshold;
			},
			preparePlayers(state) {
				for (let player of Object.values(state.activeTournament.players)) {
					player.status = 'active';
					player.scores = {};
				}
			},

			setupNextRound(state) {
				let tState = state.activeTournament;
				if (tState.currentRoundNumber) {
					tState.currentRoundNumber += 1;
				} else {
					tState.currentRoundNumber = 1;
				}
				tState.currentRound = {};
				tState.currentPairingId = 1;
				tState.currentRound.pairingsValid = false;
				tState.roundLifecycle = 'setup';
			},
			setPairings(state, { pairings, pairingsValid }) {
				for (let pairing of pairings) {
					pairing.pairingId = state.activeTournament.currentPairingId;
					state.activeTournament.currentPairingId += 1;
				}
				state.activeTournament.currentRound.pairings = pairings;
				state.activeTournament.currentRound.pairingsValid = pairingsValid;
			},
			dirtyUpdatePairingPlayers(state, { pairingId, playerIds }) {
				let tState = state.activeTournament;
				let pairings = tState.currentRound.pairings;
				if (!pairings) return;
				let pairing = pairings.find((elem) => elem.pairingId === pairingId);
				if (pairing) {
					pairing.playerIds = playerIds;
					pairing.locked = true;
					tState.currentRound.pairingsValid = false;
				}
			},
			setPairingLocked(state, { pairingId, locked }) {
				let pairings = state.activeTournament.currentRound.pairings;
				if (!pairings) return;
				let pairing = pairings.find((elem) => elem.pairingId === pairingId);
				if (pairing) pairing.locked = locked;
			},
			startRound(state) {
				state.activeTournament.roundLifecycle = 'in-progress';
			},
			cancelRound(state) {
				let tState = state.activeTournament;
				tState.roundLifecycle = 'setup';
				for (let pairing of tState.currentRound.pairings) {
					delete pairing.wins;
					delete pairing.draws;
					delete pairing.winnerIndex;
				}
			},

			setScores: function(state, { scores }) {
				let tState = state.activeTournament;
				for (let playerId in scores) {
					tState.players[playerId].scores = scores[playerId];
				}
				tState.standingsRefreshed = true;
			},
			setPairingScores: function(state, { pairingId, wins, draws }) {
				let pairings = state.activeTournament.currentRound.pairings;
				if (!pairings) return;
				let pairing = pairings.find((elem) => elem.pairingId === pairingId);
				if (pairing) {
					pairing.wins = wins || pairing.playerIds.map((elem) => 0);
					pairing.draws = draws || 0;
					pairing.canScore = true;
					// Handle trivial results like forfeits and byes
					let pairingHasForfeit = !!pairing.playerIds.find((id) => (id === 'forfeit'));
					let pairingRealPlayerCount = pairing.playerIds.reduce((sum, elem) => {
						if (swiss.isRealPlayerId(elem)) sum++;
						return sum;
					}, 0);
					if (pairingHasForfeit) {
						pairing.canScore = false;
					} else if (pairingRealPlayerCount === 1) {
						pairing.canScore = false;
						pairing.winnerIndex = pairing.playerIds.findIndex((elem) => swiss.isRealPlayerId(elem));
						pairing.wins[pairing.winnerIndex] = state.activeTournament.byeGamesAwarded;
					} else if (wins) {
						// Calculate winnerIndex
						let bestGameScore = 0;
						let bestIndexes = [];
						for (let i = 0; i < wins.length; i++) {
							if (wins[i] > bestGameScore) {
								bestGameScore = wins[i];
								bestIndexes = [ i ];
							} else if (wins[i] === bestGameScore) {
								bestIndexes.push(i);
							}
						}
						if (bestGameScore > 0 && bestIndexes.length === 1) {
							pairing.winnerIndex = bestIndexes[0];
						} else {
							pairing.winnerIndex = -1;
						}
					} else {
						pairing.winnerIndex = undefined;
					}
				}
			},
			completeRound: function(state) {
				let tState = state.activeTournament;
				tState.rounds.push(tState.currentRound);
				tState.roundLifecycle = 'complete';
			}
		},
		actions: {
			setActiveTournament: async function({ commit }, payload) {
				if (payload.flushStorage) {
					await appContext.storageEngine.setActiveTournament(tState);
				}
				commit('setActiveTournament', payload.tournament);
			},
			createNewTournament: async function({ commit }) {
				let tState = { ...INITIAL_TSTATE };
				commit('setActiveTournament', tState);
				appContext.storageEngine.setActiveTournament(tState);
			},
			deleteActiveTournament: async function({ commit }) {
				commit('setActiveTournament', {});
				appContext.storageEngine.clearActiveTournament();
			},

			setupAddPlayer: async function({ commit, state }, payload) {
				let nameConflict = Object.values(state.activeTournament.players).find((elem) => elem.name === payload.name);
				if (nameConflict) {
					let err = new Error('Name conflict');
					err.name = 'NameConflictError';
					throw err;
				}
				commit('setupAddPlayer', payload);
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			activeAddPlayer: async function({ commit, state, dispatch }, payload) {
				if (state.activeTournament.lifecycle !== 'in-progress') {
					throw new Error('Invalid dispatch of activeAddPlayer');
				}
				let nameConflict = Object.values(state.activeTournament.players).find((elem) => elem.name === payload.name);
				if (nameConflict) {
					let err = new Error('Name conflict');
					err.name = 'NameConflictError';
					throw err;
				}
				commit('activeAddPlayer', payload);
				await dispatch('recalculateStandings', {});
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			setupDeletePlayer: async function({ commit, state }, payload) {
				commit('setupDeletePlayer', payload);
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			dropPlayer: async function({ commit, state, dispatch }, { playerId }) {
				if (state.activeTournament.lifecycle !== 'in-progress') {
					throw new Error('Invalid dispatch of activeAddPlayer');
				}
				commit('dropPlayer', { playerId });
				await dispatch('recalculateStandings', {});
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			setupConfirmPlayers: async function({ commit, state }) {
				commit('setLifecycle', { lifecycle: 'setup-options' });
				commit('setOptions', {
					maxRounds: swiss.getDefaultMaxRounds(Object.keys(state.activeTournament.players).length),
					playersPerRound: 2
				});
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			setupSetOptions: async function(
				{ commit, state },
				{ maxRounds, playersPerRound, byeGamesAwarded, matchPointElimThreshold }
			) {
				commit('setOptions', { maxRounds, playersPerRound, byeGamesAwarded, matchPointElimThreshold });
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			startTournament: async function({ commit, state }) {
				let tState = state.activeTournament;
				commit('preparePlayers');
				let standings = swiss.calculateStandings(
					[],
					tState.players,
					{ playersPerRound: tState.playersPerRound }
				)
				commit('setScores', { scores: standings });
				let pairings = await swiss.getNextPairings(
					[],
					tState.players,
					{ playersPerRound: tState.playersPerRound }
				);
				commit('setupNextRound');
				commit('setPairings', { pairings, pairingsValid: true });
				commit('setLifecycle', { lifecycle: 'in-progress' });
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},

			setPairingLocked: async function({ commit, state }, { pairingId, locked }) {
				commit('setPairingLocked', { pairingId, locked });
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			recalculatePairings: async function({ commit, state, getters }) {
				let tState = state.activeTournament;
				if (!tState || !tState.currentRound || tState.roundLifecycle !== 'setup') {
					throw new Error('Invalid dispatch of recalculatePairings');
				}
				let lockedPairings = tState.currentRound.pairings.filter((pairing) => !!pairing.locked);
				let realLockedPlayerCount = 0;
				for (let pairing of lockedPairings) {
					for (let playerId of pairing.playerIds) {
						if (swiss.isRealPlayerId(playerId)) realLockedPlayerCount++;
					}
				}
				let activePlayerCount = 0;
				for (let player of Object.values(tState.players)) {
					if (player.status === 'active') activePlayerCount++;
				}
				if (realLockedPlayerCount + getters.unlockedPlayers.length !== activePlayerCount) {
					throw new Error('Player count error in recalculatePairings');
				}
				let pairingPlayers = {};
				for (let player of getters.unlockedPlayers) {
					pairingPlayers[player.id] = player;
				}
				let newPairings = await swiss.getNextPairings(
					tState.rounds,
					pairingPlayers,
					{ playersPerRound: tState.playersPerRound }
				);
				commit('setPairings', { pairings: lockedPairings.concat(newPairings), pairingsValid: true });
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			startRound: async function({ commit, state }) {
				let tState = state.activeTournament;
				if (
					!tState || !tState.currentRound ||
					(tState.roundLifecycle !== 'setup') || !tState.currentRound.pairingsValid
				) {
					throw new Error('Invalid dispatch of startRound');
				}
				commit('startRound');
				for (let pairing of tState.currentRound.pairings) {
					commit('setPairingScores', { pairingId: pairing.pairingId })
				}
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			cancelRound: async function({ commit, state }) {
				if (state.activeTournament.roundLifecycle !== 'in-progress') {
					throw new Error('Invalid dispatch of cancelRound');
				}
				commit('cancelRound');
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},

			submitPairingScores: async function({ commit, state }, { pairingId, wins, draws }) {
				commit('setPairingScores', { pairingId, wins, draws });
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			recalculateStandings: async function({ commit, state }, { includeCurrentRound }) {
				let tState = state.activeTournament;
				let allRounds = [ ...tState.rounds ].filter((elem) => !!elem);
				if (tState.currentRound && includeCurrentRound) {
					allRounds.push(tState.currentRound);
				}
				let newStandings = swiss.calculateStandings(
					allRounds,
					tState.players,
					{ playersPerRound: tState.playersPerRound }
				);
				commit('setScores', { scores: newStandings });
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			completeRound: async function({ commit, state, dispatch }) {
				let tState = state.activeTournament;
				if (tState.roundLifecycle !== 'in-progress') throw new Error ('Invalid dispatch of completeRound');
				await dispatch('recalculateStandings', { includeCurrentRound: true });
				commit('completeRound');
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},
			setupNextRound: async function({ commit, state }) {
				let tState = state.activeTournament;
				if (tState.roundLifecycle !== 'complete') throw new Error('Invalid dispatch of setupNextRound');
				let elimPlayers = swiss.getEliminatedPlayers(tState.players, tState.matchPointElimThreshold);
				for (let playerId of elimPlayers) {
					commit('setPlayerEliminated', { playerId });
				}
				let pairings = await swiss.getNextPairings(
					tState.rounds,
					tState.players,
					{ playersPerRound: tState.playersPerRound }
				);
				commit('setupNextRound');
				commit('setPairings', { pairings, pairingsValid: true });
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},

			completeTournament: async function({ commit, state }) {
				let tState = state.activeTournament;
				if (tState.lifecycle !== 'in-progress' || tState.roundLifecycle !== 'complete') {
					throw new Error('Invalid dispatch of completeTournament');
				}
				commit('setLifecycle', { lifecycle: 'complete' });
				await appContext.storageEngine.setActiveTournament(state.activeTournament);
			},

			downloadRoundCsv: async function({ commit, state, getters }, { roundNumber }) {
				let tState = state.activeTournament;
				let expandedPairings = getters.expandedPairingsByRound(roundNumber);
				await exportRoundCsv(tState, expandedPairings, roundNumber);
			}
		},
		getters: {
			hasActiveTournament: function(state) {
				if (!state.activeTournament || Object.keys(state.activeTournament).length === 0) return false;
				return true;
			},
			expandedPairingsByRound: function(state) {
				return function(roundNumber) {
					let pairings;
					if (roundNumber === 'currentRound') {
						pairings = state.activeTournament.currentRound && state.activeTournament.currentRound.pairings;
					} else if (typeof roundNumber === 'number') {
						pairings = state.activeTournament.rounds[roundNumber - 1] &&
							state.activeTournament.rounds[roundNumber - 1].pairings;
					}
					if (!pairings) return [];
					let players = state.activeTournament.players;
					if (!pairings || !players) return null;
					let ep = pairings.map((pairing) => {
						let ret = {
							pairingId: pairing.pairingId,
							locked: !!pairing.locked,
							canScore: !!pairing.canScore,
							wins: pairing.wins,
							draws: pairing.draws,
							winnerIndex: pairing.winnerIndex,
							isReal: true
						};
						ret.players = pairing.playerIds.map((playerId, index) => {
							if (!swiss.isRealPlayerId(playerId)) ret.isReal = false;
							if (playerId === 'none') return { id: playerId, name: 'None' };
							if (playerId === 'bye') return { id: playerId, name: 'Bye' };
							if (playerId === 'forfeit') return { id: playerId, name: 'Forfeit' };

							let player = players[playerId];
							if (!player) return null;
							return {
								id: player.id,
								index: index,
								name: player.name,
								standing: swiss.getPlayerStandingString(player),
								wins: pairing.wins && pairing.wins[index]
							};
						});
						if (typeof ret.winnerIndex === 'number') {
							ret.submitted = true;
							if (ret.winnerIndex === -1) {
								for (let player of ret.players) {
									player.result = 'draw';
								}
							} else {
								for (let i = 0; i < ret.players.length; i++) {
									if (i === ret.winnerIndex) {
										ret.players[i].result = 'winner';
									} else {
										ret.players[i].result = 'loser';
									}
								}
							}
						}
						return ret;
					});
					return ep;
				}
			},
			expandedPairings: function(state, getters) {
				return getters.expandedPairingsByRound('currentRound');
			},
			unlockedPlayers: function(state, getters) {
				let tState = state.activeTournament;
				let unlockedPlayerIds = {};
				let players = tState.players;
				for (let playerId in players) {
					if (players[playerId].status === 'active') {
						unlockedPlayerIds[playerId] = true;
					}
				}
				for (let pairing of tState.currentRound.pairings) {
					if (pairing.locked) {
						for (let playerId of pairing.playerIds) {
							delete unlockedPlayerIds[playerId];
						}
					}
				}
				return Object.keys(unlockedPlayerIds).map((id) => players[id]);
			}
		}
	};
}

export default { vuexConfig };

const { isRealPlayerId } = swiss;
export { isRealPlayerId };
