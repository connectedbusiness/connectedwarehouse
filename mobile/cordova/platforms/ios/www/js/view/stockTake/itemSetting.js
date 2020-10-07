/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'view/common/global',
    'view/common/shared',
	'text!template/stockTake/itemSetting.tpl.html'
], function ($, _, Backbone,
	Global, Shared, ItemSetting) {

    var ItemSettingView = Backbone.View.extend({
        _template: _.template(ItemSetting),

        render: function () {
            return this.$el.html(this._template(this.model.toJSON()));
        }

    });
    return ItemSettingView;
});