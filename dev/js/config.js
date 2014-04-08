/*
 * Config for lunchpad frontend
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */


angular.module('lpConfig',[
])

.factory('LpConfig',[
function(){

	var server = {
		'pages': '',
		'templates': '',
		'routes': '',
		'socket': ''
	}

	var pages = {
		'root': '/',
		'login': '/login',
		'manifesto': '/manifesto'
	}

	var templates = {
		'view.venues': 'view.venuelist.html',
		'view.venuedetail': 'view.venuedetail.html',
		'view.settings': 'view.settings.html',

		'tmpl.erroralert': 'tmpl.erroralert.html'
	}

	var routes = {
		'auth.login': '/auth/login',
		'auth.logout': '/auth/logout'
	}

	var events = {
		'error':'error',

		'chat.send': 'chat send',
		'chat.message': 'chat message',

		'venue.read.list': 'venue read list',
		'venue.read.one': 'venue read one',
		'venue.create': 'venue create',
		'venue.create.done': 'venue create done',
		'venue.update.name': 'venue update name',
		'venue.update.name.done': 'venue update name done',
		'venue.update.url': 'venue update url',
		'venue.update.url.done': 'venue update url done',
		'venue.delete': 'venue delete',
		'venue.delete.done': 'venue delete done',

		'checkin.create': 'checkin create',
		'checkin.create.done': 'checking create done',
		'checkin.delete': 'checkin delete',
		'checkin.delete.done': 'checkin delete done',

		'comment.read.list': 'comment read list',
		'comment.create': 'comment create',
		'comment.create.done': 'comment create done',
		'comment.delete': 'comment delete',
		'comment.delete.done': 'comment delete done',

		'user.read.list': 'user read list',
		'user.read.one': 'user read one',
		'user.create': 'user create',
		'user.create.done': 'user create done',
		'user.update.password': 'user update password',
		'user.update.password.done': 'user update password done',
		'user.update.notifications': 'user update norifications',
		'user.update.notifications.done': 'user update notifications done',
		'user.update.activeitem': 'user update activeitem',
		'user.update.activeitem.done': 'user update activeitem done',
		'user.update.inventory': 'user update inventory',
		'user.delete': 'user delete',
		'user.delete.done': 'user delete done',

		'item.read.list': 'item read list',
		'item.read.one': 'item read one',
		'item.read.multiple': 'item read multiple',
		'item.create': 'item create',
		'item.create.done': 'item create done',
		'item.delete': 'item delete',
		'item.delete.done': 'item delete done'
	}

	return {
		getServer: function(serverKey){
			if(server[serverKey])
				return server[serverKey];
			else throw 'Server Key not defined';
		},
		getTemplate: function(templateKey){
			if(templates[templateKey]) 
				return server.templates + templates[templateKey];
			else throw 'Template not defined';
		},
		getPage: function(pageKey){
			if(pages[pageKey])
				return server.pages + pages[pageKey];
			else throw 'Page not defined';
		},
		getRoute: function(routeKey){
			if(routes[routeKey])
				return server.routes + routes[routeKey];
			else throw 'Route not defined';
		},
		getEvent: function(eventKey){
			if(events[eventKey])
				return events[eventKey];
			else throw 'Event not defined';
		}
	}


}]);