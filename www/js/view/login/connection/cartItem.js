/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',	
	'view/common/global',	
	'text!template/login/connection/cartItem.tpl.html'
],function($, _, Backbone, 
	Global, template){   
    
	var CartItemView = Backbone.View.extend({	
		_template : _.template( template),
		
		events: {		    
		},	    
		
		tagName : "tr",
		
		initialize : function(){				
		},

		render: function () {
		    this.model.set({ ViewID: this.cid });
		    return this.$el.html(this._template(this.model.toJSON()));
		}
	});
	return CartItemView;
});