/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',		
	'backbone',	
	'view/common/global',	
	'text!template/pack/shipMethodItem.tpl.html'
],function($, _, Backbone,
	Global, ShipItemTemplate){   
    
	var ShipItemView = Backbone.View.extend({
		_template : _.template( ShipItemTemplate ),
		tagName : "tr",		
		
		events: { },
		
		initialize : function(){
			this.on("change:boxCount", this.UpdateBoxCount);
		},
		
		render: function () {
			return this.$el.html(this._template(this.model.toJSON()));					
		},

		UpdateBoxCount: function() {
			this.$el.find(".boxCount").text(this.model.get("boxCount"));
		}	
		
	});
	return ShipItemView;
});