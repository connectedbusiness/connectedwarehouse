/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',		
	'backbone',	
	'view/common/global',	
	'text!template/pack/boxItem.tpl.html'
],function($, _, Backbone,
	Global, BoxItemTemplate){   
    
	var BoxItemView = Backbone.View.extend({	
		_template : _.template( BoxItemTemplate ),
		tagName : "tr",
		
		events: { },
		
		initialize : function() { },		
		
		BoxItemModel_Deleted: function (e) {
		    this.remove();
		    e.destroy();
		},

		BoxItemModel_Error: function (e) {
		    $("#boxItem" + this.model.get("BoxID") + " .icon-archive").removeClass("icon-archive").addClass("icon-exclamation-sign").css("color", "#c0392b");;
		},
		
		BoxItemModel_Validated: function (e) {
		    $("#boxItem" + this.model.get("BoxID") + " .icon-exclamation-sign").removeClass("icon-exclamation-sign").addClass("icon-archive").css("color", "#606060");;
		},

		render: function () {
		    this.model.set({ BoxID: this.cid });
		    this.model.on("itemDeleted", this.BoxItemModel_Deleted, this);
		    this.model.on("boxError", this.BoxItemModel_Error, this);
		    this.model.on("boxValidated", this.BoxItemModel_Validated, this);

			return this.$el.html(this._template(this.model.toJSON()));					
		},		
		
		hidetoggle: function() {
			var tr = this.$el;
			if (this.model.get('Hide') == true) {
				tr.css('display', 'none');
			} else {
				tr.css('display', 'block');
			}
		}
		
	});
	return BoxItemView;
});