/**
 * @author Interprise Solutions
 */
define([
	'collection/base',
	'localstorage'
], function(BaseCollection, Store){
	var UrlCollection = BaseCollection.extend({		
	    localStorage: new Store('servers')
	    //localStorage : new Store('WebServicesUrl')
	});
	return UrlCollection;
});