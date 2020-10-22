/**
 * @author Interprise Solutions
 */
define([
	'jquery',	
	'underscore',	
	'backbone',	
	'model/lookupcriteria',
	'model/cartItem',	
	'collection/cart',	
	'view/common/enum',
	'view/common/global',	
	'view/common/service',
	'view/common/shared',
	'view/common/method',
    'view/common/preference',
	'view/lookup/itemLookup/cartItem',
	'text!template/lookup/itemLookup/itemLookup.tpl.html',
],function($, _, Backbone,
	LookupCriteriaModel, CartItemModel,
	CartCollection,
	Enum, Global, Service, Shared, Method, Preference,
    CartItemView,
	ItemLookupTemplate){ 
    
	var ItemLookupView = Backbone.View.extend({
	    _template: _.template(ItemLookupTemplate),
		
		events: {},
		
		buttonSlideDownItemLookup_tap: function (e) {
		    this.SlideDownItemLookup();
		},

		initialize: function () { },		

		render: function () {
		    return this.$el.html(this._template);
		},

		ConvertToItemModel: function (item) {
		    var itemModel = new CartItemModel();
		    var counter = this.cartCollection.length + 1;

		    itemModel.set({
		        ItemCode: item.ItemCode,
		        ItemName: item.ItemName,
		        FreeStock: item.FreeStock,
		        IsDeleted: false,
		        LineNum: item.LineNum,
		        LookupItemID: "LOOKUP" + counter,
		        Quantity: item.Quantity,
                Quantity: item.QuantityAllocated,
		        QuantityLeft: item.QuantityLeft,
		        QuantityOrdered: item.QuantityOrdered,
		        QuantityReceived: item.QuantityReceived,
		        RowNumber: counter,
		        UPCCode: item.UPCCode,
		        UnitMeasureCode: item.UnitMeasureCode,
		        CartItemImage: Shared.GetImageUrl(Enum.ImageType.CartItem, item.ItemIconFile),
		        TransactionCode: item.TransactionCode,
		    });

		    return itemModel;
		},

		InitializeCartCollection: function () {
		    if (this.cartCollection) {
		        this.cartCollection.reset();
		    }
		    else {
		        this.cartCollection = new CartCollection();
		    }
		},

		InitializeChildViews: function () {
		    this.InitializeCartCollection();
		    this.WireEvents();
		},        

		RenderItems: function (items) {
		    if (items && items.length > 0) {
		        var self = this;
		        this.cartCollection.reset();
		        $('#cartListItemLookup tbody').html("");
		        if (items instanceof Backbone.Collection) {
		            _.each(items.models, function (current) {
		                self.RenderItem(current);
		            });
		        }
		        else {
		            _.each(items, function (current) {
		                self.RenderItem(current);
		            });
		        }
		    }
		    this.iScroll = Shared.LoadiScroll(this.iScroll, "ItemLookup");
		},

		RenderItem: function (item) {
		    if (item) {

		        var self = this;
		        var itemModel = null;

		        if (item instanceof Backbone.Model) {
		            var counter = this.cartCollection.length + 1;

		            item.set({
		                RowNumber: counter,
		                LookupItemID: "LOOKUP" + counter,
		            });

		            itemModel = item;

		        } else itemModel = this.ConvertToItemModel(item);

		        if (!itemModel.get('IsDeleted')) {
		            var itemView = new CartItemView({ model: itemModel });

		            this.cartCollection.add(itemModel);
		            $('#cartListItemLookup tbody').append(itemView.render());

		            Shared.AddRemoveHandler("." + itemView.model.get('LookupItemID'), 'tap', function () {
		                Shared.HighLightItem(itemView.model.get('LookupItemID'), "Default");
		                self.trigger("itemSelected", item);		                
		            });


		            $('#itemTransactionCode' + itemView.model.get('LookupItemID')).hide();
		            if (Global.IsPrePackMode) {
		                $('#itemTransactionCode' + itemView.model.get('LookupItemID')).text(itemModel.get("TransactionCode"));
		                $('#itemTransactionCode' + itemView.model.get('LookupItemID')).show();
		            }
		        }
		    }
		},

		SlideDownItemLookup: function () {
		    $('#itemLookupSection').addClass('slideOutDown').removeClass('slideInUp');
		    var headerName = '';

		    switch (Global.ApplicationType) {
		        case "Adjustment":
		            headerName = '#adjustmentHeader';
		            break;
		        case "Pack":
		            headerName = '#boxHeader';
		            break;
		        case "Pick":
		            headerName = '#pickHeader';
		            break;		        
		        case "Receive":
		            headerName = '#receiveHeader';
		            break;
		        case "Stock":
		            headerName = '#stockHeader';
		            break;		        
		        case "Transfer":
		            headerName = '#transferHeader';
		            break;
		        case "PrePack":
		            headerName = '#prepackHeader';
		            break;
		    }

		    $(headerName).show();
		},

		WireEvents: function () {
		    var self = this;
		    Shared.AddRemoveHandler('#buttonSlideDownItemLookup', 'tap', function (e) { self.buttonSlideDownItemLookup_tap(e); });
		},

	});
	return ItemLookupView;
});