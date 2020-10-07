/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'view/common/global',
    'view/common/shared',
	'text!template/pick/cardList.tpl.html'
], function ($, _, Backbone,
	Global, Shared, CardListTemplate) {

    var CardListView = Backbone.View.extend({
        _template: _.template(CardListTemplate),
        tagName: "li",

        render: function () {
            this.model.set({ SkippedListItemID: this.model.get('SkippedListItemID') });
            return this.$el.html(this._template(this.model.toJSON()));
        }

    });
    return CardListView;
});