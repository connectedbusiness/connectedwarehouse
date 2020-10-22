/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'view/common/global',
	'text!template/stockTake/cartSkippedItem.tpl.html'
], function ($, _, Backbone,
	Global, CartSkippedItemTemplate) {

    var CartSkippedItemView = Backbone.View.extend({
        _template: _.template(CartSkippedItemTemplate),
        tagName: "tr",

        events: {
        },

        initialize: function () {
        },

        render: function () {
            this.model.set({ SkippedListItemID: this.model.get('SkippedListItemID') });

            return this.$el.html(this._template(this.model.toJSON()));
        },

        InitializeChildViews: function () {
        },

    });
    return CartSkippedItemView;
});