import RouteMain from './main.vue';
import PageNotFound from './page-not-found.vue';
import RoutePlayerEntry from './player-entry.vue';
import RouteRoundEdit from './round-edit.vue';
import RouteRoundSetup from './round-setup.vue';
import RouteRoundActive from './round-active.vue';
import RouteRoundComplete from './round-complete.vue';
import RouteRoundReview from './round-review.vue';
import RoutePlayers from './players.vue';
import RouteStandings from './standings.vue';
import RouteTournamentSetup from './tournament-setup.vue';

export default [
	{ path: '/', component: RouteMain },
	{ path: '/player-entry', component: RoutePlayerEntry },
	{ path: '/setup', component: RouteTournamentSetup },
	{ path: '/round-edit/:roundNumber', component: RouteRoundEdit },
	{ path: '/round-setup/:roundNumber', component: RouteRoundSetup },
	{ path: '/round/:roundNumber', component: RouteRoundActive },
	{ path: '/round-complete', component: RouteRoundComplete },
	{ path: '/round-review/:roundNumber', component: RouteRoundReview },
	{ path: '/players', component: RoutePlayers },
	{ path: '/standings', component: RouteStandings },
	{ path: '/:catchAll(.*)', component: PageNotFound }
];
