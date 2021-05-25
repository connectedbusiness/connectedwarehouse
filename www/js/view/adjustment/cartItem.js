/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',	
	'view/common/global',	
	'text!template/adjustment/cartItem.tpl.html'
],function($, _, Backbone, 
	Global, template){   
    
    var CartItemView = Backbone.View.extend({
        _template: _.template(template),

        events: {
        },

        tagName: "tr",

        initialize: function () {
        },

        CartItemModel_Deleted: function (e) {
            this.remove();
            e.destroy();
        },

        render: function () {
            this.model.on("itemDeleted", this.CartItemModel_Deleted, this);

            return this.$el.html(this._template(this.model.toJSON()));
        }
    });
    return CartItemView;
});