/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',	
	'view/common/global',	
	'text!template/label/pictureItemFS.tpl.html'
],function($, _, Backbone, 
	Global, PictureItemTemplate){   
    
	var PictureItemFSView = Backbone.View.extend({	
	    _template: _.template(PictureItemTemplate),
		
		events: {	
		},		
		
		tagName : "li",
		
		initialize : function(){			
		},	
		
		InitializeChildViews : function() {
		},				

		render: function (model) {		    			
			return this.$el.html(this._template(this.model.toJSON()));								
		}
		});
	return PictureItemFSView;
});