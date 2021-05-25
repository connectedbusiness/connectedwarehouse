/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',	
	'view/common/global',	
	'text!template/lookup/boxItem.tpl.html'
],function($, _, Backbone, 
	Global, BoxItemTemplate){   
    
	var BoxItemView = Backbone.View.extend({	
	    _template: _.template(BoxItemTemplate),
		
		events: {	
		},		
		
		tagName : "tr",
		
		initialize : function(){			
		},	
		
		InitializeChildViews : function() {
		},
		
		render : function(model) {			
			this.model.set({ ViewID : this.cid });			
			return this.$el.html(this._template(this.model.toJSON()));								
		}
		});
	return BoxItemView;
});