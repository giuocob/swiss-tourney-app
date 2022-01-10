import RouteMain from './main.vue';
import PageNotFound from './page-not-found.vue';
import RoutePlayerEntry from './player-entry.vue';
import RouteRoundEdit from './round-edit.vue';
import RouteRoundSetup from './round-setup.vue';
import RouteRoundActive from './round-active.vue';
import RouteStandings from './standings.vue';
import RouteTournamentSetup from './tournament-setup.vue';

export default [
	{ path: '/', component: RouteMain },
	{ path: '/player-entry', component: RoutePlayerEntry },
	{ path: '/setup', component: RouteTournamentSetup },
	{ path: '/round-edit/:roundNumber', component: RouteRoundEdit },
	{ path: '/round-setup/:roundNumber', component: RouteRoundSetup },
	{ path: '/round/:roundNumber', component: RouteRoundActive },
	{ path: '/standings', component: RouteStandings },
	{ path: '/:catchAll(.*)', component: PageNotFound }
];
