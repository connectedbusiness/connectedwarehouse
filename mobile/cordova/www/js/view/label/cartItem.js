/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'view/common/global',
	'text!template/label/cartItem.tpl.html'
], function ($, _, Backbone,
	Global, CartItemTemplate) {

    var CartItemView = Backbone.View.extend({
        _template: _.template(CartItemTemplate),

        events: {
        },

        tagName: "tr",

        initialize: function () {
        },

        InitializeChildViews: function () {
        },

        CartItemModel_Deleted: function (e) {
            this.remove();
            e.destroy();
        },

        render: function (model) {
            this.model.set({ TapeItemID: this.cid });

            this.model.on("itemDeleted", this.CartItemModel_Deleted, this);

            return this.$el.html(this._template(this.model.toJSON()));
        }
    });
    return CartItemView;
});