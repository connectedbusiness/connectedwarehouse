/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',	
	'view/common/global',	
	'text!template/label/pictureItem.tpl.html'
],function($, _, Backbone, 
	Global, PictureItemTemplate){   
    
	var PictureItemView = Backbone.View.extend({	
	    _template: _.template(PictureItemTemplate),
		
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
	return PictureItemView;
});