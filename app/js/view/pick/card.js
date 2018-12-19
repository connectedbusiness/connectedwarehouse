/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',		
	'backbone',
	'text!template/pick/card.tpl.html'
],function($, _, Backbone, CardTemplate){   
    
	var CartItemView = Backbone.View.extend({	
	    _template: _.template(CardTemplate),

		render : function() {
		    return this.$el.html(this._template(this.model.toJSON()));		    
		}
		
	});
	return CartItemView;
});