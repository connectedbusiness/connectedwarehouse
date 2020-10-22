/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',
	'model/pack',	
	'view/common/global',			
	'text!template/adjustment/complete.tpl.html'	
],function($, _, Backbone,
	PackModel,	
	Global,
	CompleteTemplate){
    
	var CompleteView = Backbone.View.extend({
		_template : _.template( CompleteTemplate ),		
		
		events: {
			"click #linkBack" : "linkBack_click",
			"click #buttonAdjust" : "buttonAdjust_click"
		},
		
		initialize : function() {				
		},
		
		// render : function() {
// 			
		// },
		
		linkBack_click : function (e) {
			window.location.hash = "dashboard";
		},
		
		buttonAdjust_click : function (e) {
			window.location.hash = "adjustment"
		},
		
		InitializeChildViews : function() {	
			this.$el.html(this._template());		
		}
	});
	return CompleteView;
});