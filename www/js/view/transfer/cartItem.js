/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',    
	'view/common/global',
	'text!template/transfer/cartItem.tpl.html',    

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
            this.model.on("itemDeleted", this.CartItemModel_Deleted, this);
            return this.$el.html(this._template(this.model.toJSON()));
        },                

    });
    return CartItemView;
});