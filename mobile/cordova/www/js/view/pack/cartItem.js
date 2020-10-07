/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',		
	'backbone',	
	'view/common/global',	
	'text!template/pack/cartItem.tpl.html'
],function($, _, Backbone,
	Global, CartItemTemplate){   
    
	var CartItemView = Backbone.View.extend({
		_template : _.template( CartItemTemplate ),
		tagName : "tr",		
		
		events: { },
		
		initialize : function(){ },
		
		render: function () {		    
		    if (this.model.get('IsItemsRemaining')) this.model.set({ TapeItemID: this.model.get('RemainingItemID') });
		    else this.model.set({ TapeItemID: "ITEM" + this.model.get('ItemID') });

		    if (this.model.get('Hide') == true) {

		    } else {
		    	return this.$el.html(this._template(this.model.toJSON()));
		    }
		    
		},		
		
	});
	return CartItemView;
});