/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',	
	'view/common/global',	
	'text!template/lookup/itemLookup/cartItem.tpl.html'
],function($, _, Backbone, 
	Global, CartItemTemplate){   
    
	var CartItemView = Backbone.View.extend({	
		_template : _.template( CartItemTemplate ),
		
		events: {	
		},		
		
		tagName : "tr",
		
		initialize : function(){			
		},	
		
		InitializeChildViews : function() {
		},				

		render: function (model) {		    
		    return this.$el.html(this._template(this.model.toJSON()));
		}
		});
	return CartItemView;
});