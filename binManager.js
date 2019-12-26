/**
 * @author Interprise Solutions
 */
define([
	'jquery',
	'underscore',
	'backbone',
    'model/binManager',
	'model/cartItem',
    'model/checkListItem',
    'model/lookupcriteria',
	'collection/cart',
	'view/common/enum',
	'view/common/global',
	'view/common/service',
	'view/common/shared',
	'view/common/method',
    'view/common/preference',    
    'view/binManager/cartItem',
    'view/binManager/cartItemBin',
    'view/binManager/checkListItem',
	'text!template/binManager/binManager.tpl.html',
    'js/libs/iscroll.js'
], function ($, _, BackBone,
    BinManagerModel, CartItemModel, CheckListItemModel, LookupCriteriaModel,
    CartCollection,
    Enum, Global, Service, Shared, Method, Preference,
    CartItemView, CartItemBinView, CheckListItemView,
    BinManagerTemplate) {

    var BinManagerView = BackBone.View.extend({
        _binManagerTemplate: _.template( BinManagerTemplate ),

        events: {
            "keypress #textSearchAdd": "textSearchAdd_keypress"
        },
        
        buttonBackBin_tap: function (e) {            
            this.HideBinContainer();
        },

        buttonBackBinItems_tap: function (e) {
            this.ShowItemBinSection(false);
        },

        buttonBackCheckList_tap: function (e) {
            this.SwitchDisplay("page1");
        },

        buttonCancelRemoveBins_tap: function (e) {
            Shared.RemoveCheckedItems(this.binCollection, "BinManager");
        },

        buttonCancelRemoveItems_tap: function (e) {
            Shared.RemoveCheckedItems(this.itemBinCollection);            
        },

        buttonMenu_tap: function (e) {
            window.location.hash = "dashboard";
        },

        buttonZone_tap: function (e) {
            this.LoadLocationLookup();
        },

        buttonDeleteBin_tap: function (e) {
            this.RemoveAllBin();
        },

        buttonDeleteSpecificBin_tap: function (e) {
            this.RemoveBin(this.currentBinView);            
        },

        buttonRemoveBins_tap: function (e) {
            this.RemoveBin();
        },

        buttonRemoveItems_tap: function (e) {
            this.RemoveItemBin(this.currentBinView);
        },

        buttonSearchAdd_tap: function (e) {
            this.ValidateBinIfExisting();
        },

        textSearchAdd_keypress: function (e) {
            if (e.keyCode === 13) this.ValidateBinIfExisting();
        },

        initialize: function () {
            this.InitializeModel();
        },

        InitializeAllBinCollection: function () {            
            if (this.allBinCollection) {
                this.allBinCollection.reset();
            }
            else {
                this.allBinCollection = new CartCollection();
                this.allBinCollection.on("reset", this.ClearCart, this);
            }
        },

        InitializeBinCollection: function () {
            if (this.binCollection) {
                this.binCollection.reset();
            }
            else {
                this.binCollection = new CartCollection();
                this.binCollection.on("reset", this.ClearCart, this);
            }
        },

        InitializeItemBinCollection: function () {
            if (this.itemBinCollection) {
                this.itemBinCollection.reset();
            }
            else {
                this.itemBinCollection = new CartCollection();
                this.itemBinCollection.on("reset", this.ClearCart, this);
            }
        },

        InitializeModel: function () {
            this.model = new BinManagerModel();
            this.model.set({
                ItemCode: "",
                LocationCode: "Zone1",
                LocationCodeDesc: "Normal",
                TotalBins: 0,
                Counter: 0
            });
            this.$el.html(this._binManagerTemplate(this.model.toJSON()));
        },

        InitializeChildViews: function () {
            this.InitializeAllBinCollection();
            this.InitializeBinCollection();
            this.InitializeItemBinCollection();
            this.ShowControls();
            this.LoadBinLocationLookup();
            this.WireEvents();
        },

        AddBinToCart: function (response, isExisting) {
            var self = this;
            var binModel = new CartItemModel();
            var counter = this.model.get("Counter");            
            counter += 1;

            if (!isExisting) {
                binModel.set({
                    BinLocationCode: response.BinLocationCode,
                    BinLocationName: response.BinLocationName,
                    WarehouseCode: Preference.DefaultLocation,
                    LocationCode: "Zone1",
                    RowNumber: counter,
                    BinItemID: "BIN" + counter
                });
            }
            else {
                binModel.set({
                    BinLocationCode: response.get("BinLocationCode"),
                    BinLocationName: response.get("BinLocationName"),
                    WarehouseCode: response.get("WarehouseCode"),
                    LocationCode: response.get("LocationCode"),
                    RowNumber: counter,
                    BinItemID: "BIN" + counter
                });
            }           

            this.binCollection.add(binModel);

            var binView = new CartItemView({ model: binModel });

            alert(binView);
            this.$("#cartListContainer tbody").append(binView.render());

            Shared.AddRemoveHandler("." + binView.model.get('BinItemID') + "-itemcol-3", 'tap', function (e) {
                $('td').removeClass('highlight');
                $("#" + binView.cid).addClass('highlight');
                self.currentBinView = binView;
                if (Global.ApplicationType == "BinInventory") self.LoadInventoryBinLocation(binView.model.get("BinLocationCode"));
            });

            if (Global.ApplicationType == "Receive" || Global.ApplicationType == "Pick") {
                Shared.AddRemoveHandler('.' + binView.model.get('BinItemID') + "-itemcol-1", 'tap', function () {
                    Shared.ToggleItemCheck(binView.model, "BinManager");
                    Shared.ShowRemoveFooter(self.binCollection, "BinManager");
                });
            }
                        
            this.LoadiScroll();
            this.UpdateCounter(1);
            this.UpdateTotalBins(1);
            this.$('#buttonDeleteBin').prop('disabled', false);
            if (Global.ApplicationType == "Pick") self.AssignItemBinLocation(response, binView, isExisting);
            else this.UpdateAssignedBin(binView);
        },

        AnimateBinManager: function (isAnimate, isFullScreen) {
            this.ProgressScreen = Shared.ShowProgress(this.ProgressScreen, isAnimate, "binMainSlider", isFullScreen);
        },

        AssignItemBinLocation: function (response, binView, isExisting) {
            var self = this;
            var cartModel = new CartItemModel();
            
            cartModel.url = Global.ServiceUrl + Service.PRODUCT + Method.ASSIGNITEMBINLOCATION;

             

            if (!isExisting) {
                cartModel.set({
                    ItemCode: this.model.get("ItemCode"),
                    BinLocationCode: response.BinLocationCode,
                    BinLocationName: response.BinLocationName,
                    WarehouseCode: response.WarehouseCode,
                    LocationCode: response.LocationCode
                });
            }
            else {
                cartModel.set({
                    ItemCode: this.model.get("ItemCode"),
                    BinLocationCode: response.get("BinLocationCode"),
                    BinLocationName: response.get("BinLocationName"),
                    WarehouseCode: response.get("WarehouseCode"),
                    LocationCode: response.get("LocationCode")
                });
            }

            this.AnimateBinManager(true, true);
            cartModel.save(null, {
                success: function(model, response, options) {
                    if (!model.get("hasError")) self.UpdateAssignedBin(binView);
                },
                progress: self.ProgressScreen
            });
        },

        AssignItems: function (items) {
            var self = this;
            var cartItem = new CartItemModel();
            var binName = this.currentBinView.model.get('BinLocationName');
            var counter = 0;
            this.itemBinCollection.reset();
            this.$("#cartListItemsContainer tbody").html("");

            if (items && items.length > 0) {

                console.log(items);


                _.each(items, function (item) {
                    counter += 1;
                    var itemModel = new CartItemModel();

                    itemModel.set({
                        CartItemImage: Shared.GetImageUrl(Enum.ImageType.CartItem, item.ItemIconFile),
                        BinLocationCode: item.BinLocationCode,
                        ItemCode: item.ItemCode,
                        ItemName: item.ItemName,
                        ItemDescription: item.ItemDescription, //-- Added items description for bin manager By Surinder Kaur-----
                        UnitsInStock: item.UnitsInStock, //---  Added items unit in stock for bin manager By Surinder Kaur-----
                        RowNumber: counter,
                        TapeItemID: "ITEM" + counter,
                        UPCCode: item.UPCCode,
                        UnitMeasureCode: item.UnitMeasureCode
                    });

                    self.itemBinCollection.add(itemModel);

                    var binItemView = new CartItemBinView({ model: itemModel });
                    self.$("#cartListItemsContainer tbody").append(binItemView.render());

                    Shared.AddRemoveHandler('.' + binItemView.model.get('TapeItemID') + "-itemcol-1", 'tap', function () {
                        Shared.ToggleItemCheck(binItemView.model);
                        Shared.ShowRemoveFooter(self.itemBinCollection);
                    });
                });
                this.$('#textTotalItems').text(counter);
                this.$('#binItemsTitle').text(binName);
                this.ShowItemBinSection(true);
                this.iScrollBinItems = Shared.LoadiScroll(this.iScrollBinItems, "BinItems");
            }
            else {
                navigator.notification.alert("There are no item/s found in this bin", null, "Bin Name:" + binName, "OK");
                $('td').removeClass('highlight');
            }
        },

        AssignToCurrentBin: function (existingBin) {
            var binModel = new CartItemModel();
            binModel.set({
                BinLocationCode: existingBin.get('BinLocationCode'),
                BinLocationName: existingBin.get('BinLocationName'),
                WarehouseCode: existingBin.get('WarehouseCode'),
                LocationCode: existingBin.get('LocationCode'),
            });
            var binView = new CartItemView({ model: binModel });
            this.currentBinView = binView;
        },

        CreateBinLocation: function (binLocationName) {
            var self = this;
            var binModel = new BinManagerModel();
            var locationCode = this.model.get('LocationCode');

            binModel.url = Global.ServiceUrl + Service.PRODUCT + Method.CREATEBINLOCATION + binLocationName + "/" + Preference.DefaultLocation + "/" + locationCode;

            this.AnimateBinManager(true, true);
            binModel.save(null, {
                success: function (model, response, options) {                    
                    if (!model.get("hasError")) {
                        if (response != null) self.AddBinToCart(response, false);
                    }
                },
                progress: self.ProgressScreen
            });
        },

        CurrentItem: null,

        FindBin: function (binName) {
            var binCollection = this.allBinCollection;
            binName = binName.toLowerCase();

            if (binCollection.length > 0) {
                return binCollection.find(function (cartItem) {
                    var binLocationName = cartItem.get("BinLocationName");
                    if (binLocationName) {
                        binLocationName = binLocationName.toLowerCase();
                        if (binLocationName == binName) return true;
                    }
                });
            }
        },
        
        HideBinContainer: function () {            
            switch (Global.ApplicationType) {
                case "Receive":
                    $("#receiveHeader").show();
                    Shared.Focus('#textScanItem');
                    break;
                case "Stock":
                    $("#stockHeader").show();
                    Shared.Focus('#textboxSearchStock');
                    break;
                case "Pick":
                    Shared.Focus('#textScanItem');
                    break;
            }
                        
            $('td').removeClass('highlight');
            $("#binManagerSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
            $("#binManagerSlider").removeAttr("style");
            $('.numericpad').addClass('slideOutDown').removeClass('slideInUp');
            $('#itemLookupSection').addClass('slideOutDown').removeClass('slideInUp');
        },

        HighLightListItem: function (itemView) {
            this.$('.listitem-1').addClass('listitem-1').removeClass('listitem-2');
            this.$('.listitem-2').addClass('listitem-1').removeClass('listitem-2');
            Shared.HighLightItem(itemView.cid, "CheckList");
            this.$('#listItem' + itemView.model.get('ViewID')).removeClass('listitem-1').addClass('listitem-2');
        },

        IsUpdate: false,
                              
        LoadAllBin: function (binName) {


           
            var binModel = new BinManagerModel();
            var self = this;

            binModel.set({
                IsLoadAll: true,
                ItemCode: null,
                LocationCode: this.model.get("LocationCode"),
                WarehouseCode: Preference.DefaultLocation
            });

            binModel.url = Global.ServiceUrl + Service.PRODUCT + Method.BINLOCATIONLOOKUP;

            this.AnimateBinManager(true, false);
            binModel.save(null, {
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        self.PopulateAllBinCollection(response.ItemsBinLocation);
                        self.ScanBin(binName);
                    }
                },
                progress: self.ProgressScreen
            });
        },

        LoadBinLocationLookup: function () {
         
            var binModel = new BinManagerModel();            
            var self = this;
            
            binModel.set({
                IsLoadAll: false,
                ItemCode: this.model.get("ItemCode"),
                LocationCode: this.model.get("LocationCode"),
                WarehouseCode: Preference.DefaultLocation
            });

            binModel.url = Global.ServiceUrl + Service.PRODUCT + Method.BINLOCATIONLOOKUP;
            
            this.AnimateBinManager(true, false);
            binModel.save(null, {
                success: function (model, response, options) {                    
                    if (!model.get("hasError")) {
                        if (response != null && response.ItemsBinLocation != null && response.ItemsBinLocation.length > 0) {
                            self.PopulateCartItem(response.ItemsBinLocation);
                        }
                        else {
                            if (Global.ApplicationType == "BinInventory") self.ResetModel();
                            else self.$('#buttonDeleteBin').prop('disabled', true);
                        }
                    }
                },
                progress: self.ProgressScreen
            });            
        },

        LoadInventoryBinLocation: function (binLocationCode) {
            var binModel = new BinManagerModel();
            var self = this;

            binModel.set({
                BinLocationCode: binLocationCode,
                LocationCode: this.model.get("LocationCode"),
                UseCbeImage: Preference.UseCbeImage,
                WarehouseCode: Preference.DefaultLocation,
                WebsiteCode: Preference.WebSiteCode
            });

            binModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADINVENTORYITEMBINLOCATIONBYLOCATIONCODE;

            this.AnimateBinManager(true, false);
            binModel.save(null, {
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        if (response != null) self.AssignItems(response.Items);
                    }                    
                },
                progress: self.ProgressScreen
            });
        },

        LoadLocationLookup: function () {
            var lookupModel = new LookupCriteriaModel();
            var self = this;

            lookupModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADSTOCKFROMTOZONELOOKUP;
            lookupModel.set({ WarehouseCode: Preference.DefaultLocation });

            this.AnimateBinManager(true, false);
            lookupModel.save(null, {
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        self.RenderLocationLookup(response);
                    }
                },
                progress: self.ProgressScreen
            });
            
        },

        LoadiScroll: function () {
            this.myScroll = Shared.LoadiScroll(this.myScroll, "BinManager");
        },
        
        PopulateAllBinCollection: function (bins) {
            this.allBinCollection.reset();
            var self = this;

            _.each(bins, function (current) {
                var binModel = new CartItemModel();

                binModel.set({
                    BinLocationCode: current.BinLocationCode,
                    BinLocationName: current.BinLocationName,
                    WarehouseCode: current.WarehouseCode,
                    LocationCode: current.LocationCode,
                });

                self.allBinCollection.add(binModel);
            });
        },

        PopulateCartItem: function (bins) {
            this.binCollection.reset();
            var self = this;            
            
            if (Global.ApplicationType == "BinInventory") this.ResetModel();

            var counter = this.model.get("Counter");
            _.each(bins, function (current) {               
                counter = counter + 1;
                var binModel = new CartItemModel();
                
                binModel.set({
                    BinLocationCode: current.BinLocationCode,
                    BinLocationName: current.BinLocationName,
                    WarehouseCode: current.WarehouseCode,
                    LocationCode: current.LocationCode,
                    RowNumber: counter,
                    BinItemID: "BIN" + counter
                });

                self.binCollection.add(binModel);

                var binView = new CartItemView({ model: binModel });

                self.$("#cartListContainer tbody").append(binView.render());
                Shared.AddRemoveHandler("." + binView.model.get('BinItemID') + "-itemcol-3", 'tap', function (e) {
                    $('td').removeClass('highlight');
                    $("#" + binView.model.get('BinItemID')).addClass('highlight');
                    self.currentBinView = binView;
                    if (Global.ApplicationType == "BinInventory") self.LoadInventoryBinLocation(binView.model.get("BinLocationCode"));
                    else self.UpdateAssignedBin(binView);
                });

                if (Global.ApplicationType == "Receive" || Global.ApplicationType == "Pick") {
                    Shared.AddRemoveHandler('.' + binView.model.get('BinItemID') + "-itemcol-1", 'tap', function () {
                        Shared.ToggleItemCheck(binView.model, "BinManager");
                        Shared.ShowRemoveFooter(self.binCollection, "BinManager");
                    });
                }
                                
                self.UpdateCounter(1);
                self.UpdateTotalBins(1);                
            });

            this.LoadiScroll();
        },

        RemoveAllBin: function () {
            var self = this;

            navigator.notification.confirm("Are you sure you want to clear all bins?", function (button) {
                if (button == 1) {
                    var binModel = new BinManagerModel();
                    var itemCode = "";

                    if (Global.ApplicationType == "Pick") itemCode = self.model.get("ItemCode");

                    binModel.set({
                        WarehouseCode: Preference.DefaultLocation,
                        LocationCode: self.model.get('LocationCode'),
                        ItemCode: itemCode,
                        BinLocationCode: 0
                    });
                    binModel.url = Global.ServiceUrl + Service.PRODUCT + Method.DELETEBINLOCATION + true;

                    self.AnimateBinManager(true, true);
                    binModel.save(null, {
                        success: function (model, response, options) {                            
                            if (!model.get("hasError")) {
                                self.binCollection.reset();
                                self.$("#cartListContainer tbody").html("");
                                self.trigger("deleteBin", 0, self.binCollection, true);
                                self.$('#buttonDeleteBin').prop('disabled', true);
                                self.UpdateCounter(-(self.model.get("Counter")));
                                self.UpdateTotalBins(-(self.model.get("TotalBins")));
                            }
                        },
                        progress: self.ProgressScreen
                    });
                }
            }, "Clear All Bins", "Yes,No");
        },      

        RemoveBin: function (binView) {
            var self = this;
            var binModel = new BinManagerModel();

            navigator.notification.confirm("Are you sure you want to clear this bin?", function (button) {
                if (button == 1) {
                    var itemsToDelete = new CartCollection();

                    if (binView) {
                        _.each(self.binCollection.models, function (current) {
                            if (binView.model.get('BinLocationCode') == current.get('BinLocationCode')) itemsToDelete.add(current);
                        });
                    }
                    else {
                        _.each(self.binCollection.models, function (current) {
                            if (current.get("IsChecked")) itemsToDelete.add(current);
                        });
                    }                    

                    binModel.set({
                        ItemCode: "",
                        ItemsBinLocation: itemsToDelete,
                        WarehouseCode: Preference.DefaultLocation,
                        LocationCode: self.model.get('LocationCode')
                    });
                    binModel.url = Global.ServiceUrl + Service.PRODUCT + Method.DELETEBINLOCATION + false;

                    self.AnimateBinManager(true, true);
                    binModel.save(null, {
                        success: function (model, response, options) {                                
                            if (!model.get("hasError")) {
                                if (binView) {
                                    binView.model.RaiseItemDeleted();
                                    self.$('#containerTableBinItems tbody').html("");
                                    self.UpdateTotalItems(self.$('#textTotalItems').text());
                                    self.ShowItemBinSection(false);
                                    self.UpdateTotalBins(-1);
                                }
                                else {
                                    while (itemsToDelete.models.length > 0) {
                                        self.trigger("deleteBin", itemsToDelete.models[0].get('BinLocationCode'), self.binCollection, false);
                                        itemsToDelete.models[0].RaiseItemDeleted();
                                        self.UpdateCounter(-1);
                                        self.UpdateTotalBins(-1);
                                    }
                                    if (self.binCollection.length > 0) Shared.ShowRemoveFooter(self.binCollection, true);
                                    else {
                                        if (Global.ApplicationType == "BinInventory") self.ShowItemBinSection(false);
                                        else self.HideBinContainer();
                                    }
                                }
                                self.LoadiScroll();
                            }
                        },
                        progress: self.ProgressScreen
                    });
                }
            }, "Clear Bin", "Yes,No");
        },

        RemoveItemBin: function (currentBin) {
            if (this.itemBinCollection && this.itemBinCollection.length > 0) {
                var self = this;
                var itemBinModel = new BinManagerModel();

                navigator.notification.confirm("Are you sure do you want to clear this/these items from bin?", function (button) {
                    if (button == 1) {
                        var itemsToDelete = new CartCollection();

                        _.each(self.itemBinCollection.models, function (current) {
                            if (current.get("IsChecked")) itemsToDelete.add(current);  
                        });
                        
                        itemBinModel.set({
                            ItemsBinLocation: itemsToDelete,
                            BinLocationCode: currentBin.model.get("BinLocationCode"),
                            WarehouseCode: Preference.DefaultLocation,
                            LocationCode: currentBin.model.get("LocationCode")
                        });
                        itemBinModel.url = Global.ServiceUrl + Service.PRODUCT + Method.DELETEITEMBINLOCATION;

                        self.AnimateBinManager(true, true);
                        itemBinModel.save(null, {
                            success: function (model, response, options) {
                                if (!model.get("hasError")) {
                                    while (itemsToDelete.models.length > 0) {
                                        itemsToDelete.models[0].RaiseItemDeleted()
                                        self.UpdateTotalItems(1);
                                    }

                                    if (self.itemBinCollection.length > 0) Shared.RemoveCheckedItems(self.itemBinCollection);
                                    else self.ShowItemBinSection(false);

                                    self.iScrollBinItems = Shared.LoadiScroll(self.iScrollBinItems, "BinItems");
                                }
                            },
                            progress: self.ProgressScreen
                        });
                    }
                }, "Clear Items", "Yes,No");
            }
        },

        Render: function () {
            return this.$el.html(this._template);            
        },
        
        ResetModel: function () {
            this.$("#cartListContainer tbody").html('');
            this.model.set({
                ItemCode: "",
                TotalBins: 0,
                Counter: 0
            });
            this.$('#textTotalBins').text(0);
        },

        RenderLocationLookup: function (list) {
            if (list) {
                var self = this;
                this.$('#cartCheckList tbody').html('');
                if (list.LocationStockCounts.length > 0) {
                    _.each(list.LocationStockCounts, function (current) {
                        var checkListItemModel = new CheckListItemModel();
                        checkListItemModel.set({
                            ListItemTitle: current.LocationDescription,
                            ListItemRow1: current.StockType,
                            ListItemRow2: "",
                            LocationCode: current.LocationCode,
                            LocationDescription: current.LocationDescription,
                        });

                        var checklistItemView = new CheckListItemView({ model: checkListItemModel });
                        self.$('#cartCheckList tbody').append(checklistItemView.render());

                        var locationCode = checklistItemView.model.get('LocationCode');                        
                        var fromZone = self.model.get('LocationCode');

                        if (fromZone != null && fromZone != "") {
                            if (fromZone == locationCode) {
                                self.HighLightListItem(checklistItemView);
                            }
                        }
                         
                        Shared.AddRemoveHandler('.' + checklistItemView.cid, 'tap', function (e) {
                            self.UpdateLocation(checklistItemView);
                            self.HighLightListItem(checklistItemView);
                            self.LoadBinLocationLookup()
                            self.SwitchDisplay('page1');
                        });
                    });
                    this.iScrollCheckList = Shared.LoadiScroll(this.iScrollCheckList, "CheckList");
                    this.SwitchDisplay("page2");
                }
            }
        },

        ScanBin: function (binName) {
            var existingBin = this.FindBin(binName);
            if (existingBin) {
                if (Global.ApplicationType == "BinInventory") {
                    this.AssignToCurrentBin(existingBin);
                    this.LoadInventoryBinLocation(existingBin.get('BinLocationCode'));
                }
                else {
                    var binView = new CartItemView({ model: existingBin });
                    if (Global.ApplicationType == "Pick") this.AddBinToCart(existingBin, true);
                    this.UpdateAssignedBin(binView);
                }
            }
            else {
                if (Global.ApplicationType == "BinInventory") {
                    var self = this;
                    navigator.notification.confirm("Bin: " + binName + " does not exists. Do you want to add this bin?", function (button) {
                        if (button == 1) self.CreateBinLocation(binName);
                    }, "Create Bin", "Yes,No");
                }
                else this.CreateBinLocation(binName);
            }
        },

        ShowControls: function () {
            switch (Global.ApplicationType) {
                case "BinInventory":
                    this.$('#binManagerTitle').text('bin inventory');
                    this.$('#buttonCancelRemoveBins').hide();
                    this.$('#buttonRemoveBins').hide();
                    this.$('#buttonDeleteBin').hide();
                    this.$('#buttonBackBin').hide();
                    this.$('#buttonMenu').show();
                    this.$('#buttonZone').show();
                    this.$('#buttonSearchAdd i').removeClass('icon-plus').addClass('icon-search');
                    this.$('#binManagerBody').css({ 'min-height': '-=34', 'height': '-=34' });
                    this.$('#containerTableBinManager').css({ 'min-height': '-=34', 'height': '-=34' });
                    break;
                default:
                    this.$('#binManagerTitle').text('select bin location');
                    this.$('#buttonDeleteBin').show();
                    this.$('#buttonBackBin').show();
                    this.$('#buttonMenu').hide();
                    this.$('#buttonZone').hide();
                    this.$('#buttonSearchAdd i').removeClass('icon-search').addClass('icon-plus');                    
                    break;
            }
            Shared.Focus('#textSearchAdd');
        },

        ShowItemBinSection: function (isShow) {
            if (isShow) {
                this.$("#binItemsSlider").removeClass("container-remaining slideOutDown").addClass("container-remaining slideInUp");
                this.$("#binManagerBody").hide();
            }
            else {
                this.$("#binItemsSlider").removeClass("container-remaining slideInUp").addClass("container-remaining slideOutDown");
                this.$("#binManagerBody").show();
                this.LoadiScroll();
                $('td').removeClass('highlight');
                Shared.RemoveCheckedItems(this.itemBinCollection);
                Shared.Focus('#textSearchAdd');
            }
        },

        SwitchDisplay: function (page) {
            switch (page) {
                case "page1":
                    Shared.SlideX('#binMainSlider', 0);
                    Shared.Focus('#textSearchAdd');
                    this.LoadiScroll();
                    break;
                case "page2":
                    Shared.SlideX('#binMainSlider', Global.ScreenWidth * -1);
                    break;
            }
        },

        UpdateAssignedBin: function (binView) {
            if (!this.IsUpdate) {
                if (this.CurrentItem) {
                    if (this.CurrentItem instanceof BackBone.Model) {
                        this.CurrentItem.set({
                            BinLocationCode: binView.model.get("BinLocationCode"),
                            BinLocationName: binView.model.get("BinLocationName")
                        });
                    }
                    else {
                        this.CurrentItem.BinLocationCode = binView.model.get("BinLocationCode");
                        this.CurrentItem.BinLocationName = binView.model.get("BinLocationName");
                    }
                    this.trigger("selectedBin", this.CurrentItem);
                    this.HideBinContainer();
                }
            }
            else {
                this.trigger("selectedBin", binView);
                this.HideBinContainer();
            }
        },

        UpdateCounter: function (qtyAdded) {
            var counter = this.model.get("Counter");
            counter = counter + qtyAdded;
            this.model.set({ Counter: counter });
        },

        UpdateLocation: function (locationView) {
            if (locationView) {
                var selectedLocation = locationView.model.get('LocationCode');
                var selectedLocationDesc = locationView.model.get('ListItemRow1');
                this.model.set({
                    LocationCode: selectedLocation,
                    LocationCodeDesc: selectedLocationDesc
                });
            }
            this.$('#textZone').text(selectedLocationDesc);
        },

        UpdateTotalBins: function (qtyAdded) {
            var currentBinCount = this.model.get("TotalBins");
            currentBinCount = currentBinCount + qtyAdded;

            this.model.set({ TotalBins : currentBinCount });
            this.$('#textTotalBins').text(currentBinCount);
        },

        UpdateTotalItems: function (qtyDeleted) {
            var totalItems = this.$('#textTotalItems').text();
            totalItems -= qtyDeleted;
            this.$('#textTotalItems').text(totalItems);
        },

        ValidateBinIfExisting: function () {
            var binName = this.$("#textSearchAdd").val();
            $('td').removeClass('highlight');
            this.$("#textSearchAdd").val("");
            if (binName) this.LoadAllBin(binName);
        },

        WireEvents: function () {
            var self = this;                       

            Shared.AddRemoveHandler('#buttonBackBin', 'tap', function (e) { self.buttonBackBin_tap(e); });
            Shared.AddRemoveHandler('#buttonBackBinItems', 'tap', function (e) { self.buttonBackBinItems_tap(e); });
            Shared.AddRemoveHandler('#buttonBackCheckList', 'tap', function (e) { self.buttonBackCheckList_tap(e); });
            Shared.AddRemoveHandler('#buttonCancelRemoveBins', 'tap', function (e) { self.buttonCancelRemoveBins_tap(e); });
            Shared.AddRemoveHandler('#buttonCancelRemoveItems', 'tap', function (e) { self.buttonCancelRemoveItems_tap(e); });
            Shared.AddRemoveHandler('#buttonDeleteBin', 'tap', function (e) { self.buttonDeleteBin_tap(e); });
            Shared.AddRemoveHandler('#buttonDeleteSpecificBin', 'tap', function (e) { self.buttonDeleteSpecificBin_tap(e); });
            Shared.AddRemoveHandler('#buttonMenu', 'tap', function (e) { self.buttonMenu_tap(e); });
            Shared.AddRemoveHandler('#buttonRemoveBins', 'tap', function (e) { self.buttonRemoveBins_tap(e); });
            Shared.AddRemoveHandler('#buttonRemoveItems', 'tap', function (e) { self.buttonRemoveItems_tap(e); });
            Shared.AddRemoveHandler('#buttonSearchAdd', 'tap', function (e) { self.buttonSearchAdd_tap(e); });            
            Shared.AddRemoveHandler('#buttonZone', 'tap', function (e) { self.buttonZone_tap(e); })            
        },

    });
    return BinManagerView;
});