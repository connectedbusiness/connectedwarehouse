/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',	
	'view/common/global',	
	'text!template/lookup/shipmentItem.tpl.html'
],function($, _, Backbone, 
	Global, ShipmentItemTemplate){   
    
	var ShipmentItemView = Backbone.View.extend({	
	    _template: _.template(ShipmentItemTemplate),
		
		events: {	
		},		
		
		tagName : "tr",
		
		initialize : function(){			
		},	
		
		InitializeChildViews : function() {
		},				

		render: function (model) {		    
			this.model.set({ ViewID : this.cid });
			return this.$el.html(this._template(this.model.toJSON()));								
		}
		});
	return ShipmentItemView;
});