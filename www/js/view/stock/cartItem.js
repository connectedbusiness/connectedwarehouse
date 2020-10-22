/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',    
	'view/common/global',
	'text!template/stock/cartItem.tpl.html',    

], function ($, _, Backbone,
	Global,
    CartItemTemplate) {
    
    var CartItemView = Backbone.View.extend({
        _template: _.template(CartItemTemplate),               

        tagName: "tr",

        events: {            
        },        
        
        initialize: function () {
        },

        CartItemModel_Deleted: function (e) {
            this.remove();
            e.destroy();
        },

        render: function () {
            if (this.model.get('IsItemsRemaining')) this.model.set({ TapeItemID: this.model.get('RemainingItemID') });
            else this.model.set({ TapeItemID: "ITEM" + this.model.get('ItemID') });

            this.model.on("itemDeleted", this.CartItemModel_Deleted, this);

            return this.$el.html(this._template(this.model.toJSON()));
        },                

    });
    return CartItemView;
});