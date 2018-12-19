/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',		
	'backbone',	
	'view/common/global',
    'view/common/shared',
	'text!template/stockTake/card.tpl.html'
],function($, _, Backbone,
	Global, Shared, CardTemplate){   
    
	var CartItemView = Backbone.View.extend({	
	    _template: _.template(CardTemplate),
	
		render : function() {
			return this.$el.html(this._template(this.model.toJSON()));								
		}
		
	});
	return CartItemView;
});