// Logic for running through a Swiss bracket, including pairings, standings, etc.

function getDefaultMaxRounds(numPlayers) {
	return Math.ceil(Math.log(numPlayers) / Math.log(2));
}

export default {
	getDefaultMaxRounds
};
