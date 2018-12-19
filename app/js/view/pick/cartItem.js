/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'text!template/pick/cartItem.tpl.html'
], function ($, _, Backbone, CartItemTemplate) {

    var CartItemView = Backbone.View.extend({
        _template: _.template(CartItemTemplate),
        tagName: "tr",

        events: {
        },

        initialize: function () {
        },

        render: function () {
            if (this.model.get('IsItemsRemaining')) this.model.set({ TapeItemID: this.model.get('RemainingItemID') });
            else this.model.set({ TapeItemID: "ITEM" + this.model.get('ItemID') });
            return this.$el.html(this._template(this.model.toJSON()));            
        },

        InitializeChildViews: function () {
        },

    });
    return CartItemView;
});