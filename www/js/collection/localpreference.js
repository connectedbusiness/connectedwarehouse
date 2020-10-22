/**
 * @author Interprise Solutions
 */
define([
	'collection/base',
	'localstorage'
], function (BaseCollection, Store) {
    var LocalPreferenceCollection = BaseCollection.extend({
        localStorage: new Store('Preference')        
    });
    return LocalPreferenceCollection;
});