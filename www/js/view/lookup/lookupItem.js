/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'view/common/global',
	'text!template/lookup/lookupItem.tpl.html'
], function ($, _, Backbone,
	Global, LookupItemTemplate) {

    var LookupItemView = Backbone.View.extend({
        _template: _.template(LookupItemTemplate),

        events: {
        },

        tagName: "tr",

        initialize: function () {
        },

        InitializeChildViews: function () {
        },

        render: function (model) {
            this.model.set({ ViewID: this.cid });
            return this.$el.html(this._template(this.model.toJSON()));
        }
    });
    return LookupItemView;
});