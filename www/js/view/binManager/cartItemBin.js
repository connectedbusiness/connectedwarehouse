﻿/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'view/common/global',
	'text!template/binManager/cartItemBin.tpl.html'
], function ($, _, Backbone,
	Global, CartItemBinTemplate) {

    var CartItemBinView = Backbone.View.extend({
        _template: _.template(CartItemBinTemplate),

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
            this.model.set({ ViewID: this.cid });
            this.model.on("itemDeleted", this.CartItemModel_Deleted, this);

            return this.$el.html(this._template(this.model.toJSON()));
        }
    });
    return CartItemBinView;
});