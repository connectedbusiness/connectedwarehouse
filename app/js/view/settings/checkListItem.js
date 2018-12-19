/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',    
    'view/common/enum',
	'view/common/global',
    'view/common/service',
    'view/common/method',
    'view/common/preference',    
	'text!template/settings/checkListItem.tpl.html'
], function ($, _, Backbone,    
	Enum, Global, Service, Method, CurrentPreference,
    CheckListContainerTemplate) {
    
    var CheckListItemView = Backbone.View.extend({
        _template: _.template(CheckListContainerTemplate),
	                    
	    events: {	        
		},	    

        tagName: "tr",

	    initialize: function () {	        
		},				

		render: function (model) {
		    if (model) {
		        return this.$el.html(this._template(model.toJSON()));
		    } else {
		       this.model.set({ ViewID: this.cid });
		       return this.$el.html(this._template(this.model.toJSON()));
		    }
		},

		InitializeChildViews: function () {
		},			
				
		});
    return CheckListItemView;
});