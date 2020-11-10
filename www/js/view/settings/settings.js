/**
 * @author Interprise Solutions
 */
define([
	'jquery',    
	'underscore',
    'backbone',
    'bootstrap',
    'bootstrapSwitch',
	'model/settings',
    'model/checkListItem',
    'collection/localpreference',
    'collection/cart',
    'view/common/enum',
	'view/common/global',
    'view/common/service',
    'view/common/method',
    'view/common/preference',
    'view/common/shared',    
    'view/settings/checkListItem',    
	'text!template/settings/settings.tpl.html'
], function ($, _, Backbone, BootStrap, BootStrapSwitch,
	SettingsModel, CheckListItemModel,
    LocalPreferenceCollection, CartItemCollection,
	Enum, Global, Service, Method, CurrentPreference, Shared,   
    CheckListItemView,
	SettingsTemplate) {
    
    var ConnectionView = Backbone.View.extend({
        _template: _.template(SettingsTemplate),        
        events: {		                                 
            "keyup #textboxSearchWorkstations": "textboxSearchWorkstations_keyup"
        },

        checklistMode: null,

        selectedItem: null,
		
        initialize : function(){
            this.InitializeModel();            
            this.InitializeCartItemCollection();
        },				        	        

        buttonCreatePreference_tap: function () {
            this.CreatePreference();
        },

        checkListItem_tap: function (item) {
            if (this.HighLightItem(item)) {
                this.ReturnFromCheckList();
            }
        },

        rowDefaultLocation_tap: function () {
            this.HighLightSelectedRow('rowDefaultLocation', false);
            this.ShowCheckListSection(Enum.ListMode.DefaultLocations, "locations");
            this.LoadLocationLookup();
        },

        rowAdjustment_tap: function () {
            this.HighLightSelectedRow('rowAdjustment', false);
            this.SwitchDisplay(2);            
            this.ShowFeaturePreferenceSection(Enum.ListMode.AdjustmentPreference);
            this.InitializeFeaturePreference();
        },        

        rowLabel_tap: function () {
            this.HighLightSelectedRow('rowLabel', false);
            this.SwitchDisplay(2);
            this.ShowFeaturePreferenceSection(Enum.ListMode.LabelPreference);
            this.InitializeFeaturePreference();
        },

        rowPack_tap: function () {
            this.HighLightSelectedRow('rowPack', false);
            this.SwitchDisplay(2);            
            this.ShowFeaturePreferenceSection(Enum.ListMode.PackPreference);
            this.InitializeFeaturePreference();
        },

        rowPhysicalInventory_tap: function () {
            this.HighLightSelectedRow('rowPhysicalInventory', false);
            this.SwitchDisplay(2);
            this.ShowFeaturePreferenceSection(Enum.ListMode.PhysicalInventoryPreference);
            this.InitializeFeaturePreference();
        },

        rowPick_tap: function () {
            this.HighLightSelectedRow('rowPick', false);
            this.SwitchDisplay(2);            
            this.ShowFeaturePreferenceSection(Enum.ListMode.PickPreference);
            this.InitializeFeaturePreference();
        },

        rowPrePack_tap: function () {
            this.HighLightSelectedRow('rowPrePack', false);
            this.SwitchDisplay(2);
            this.ShowFeaturePreferenceSection(Enum.ListMode.PrePackPreference);
            this.InitializeFeaturePreference();
        },

        rowReceive_tap: function () {
            this.HighLightSelectedRow('rowReceive', false);
            this.SwitchDisplay(2);            
            this.ShowFeaturePreferenceSection(Enum.ListMode.ReceivePreference);
            this.InitializeFeaturePreference();
        },

        rowStock_tap: function () {
            this.HighLightSelectedRow('rowStock', false);
            this.SwitchDisplay(2);            
            this.ShowFeaturePreferenceSection(Enum.ListMode.StockPreference);
            this.InitializeFeaturePreference();
        },

        rowTransfer_tap: function () {
            this.HighLightSelectedRow('rowTransfer', false);
            this.SwitchDisplay(2);            
            this.ShowFeaturePreferenceSection(Enum.ListMode.TransferPreference);
            this.InitializeFeaturePreference();
        },

        rowWorkstationId_tap: function () {
            this.HighLightSelectedRow('rowWorkstationId', false);
            this.ShowCheckListSection(Enum.ListMode.Workstations, "workstations");
            this.LoadPreferenceLookup();
        },

        rowItemImage_tap: function () {
            this.HighLightSelectedRow('rowItemImage', false);            
            this.ShowFeaturePreferenceSection(Enum.ListMode.ItemImagesPreference);
            this.InitializeFeaturePreference();
            this.SwitchDisplay(2);
        },

        rowWebSite_tap: function () {
            this.HighLightSelectedRow('rowWebSite', false);
            this.ShowCheckListSection(Enum.ListMode.ItemImagesPreference, "web sites");
            this.LoadWebsiteLookup();
        },

        buttonMenu_tap: function () {            
            this.ShowDashBoard();
        },        
        
        buttonBackCheckList_tap: function () {                                    
            this.ReturnFromCheckList();
        },

        buttonBackFeaturePreference_tap: function () {          
            var self = this;

            this.UpdateFeaturePreference();
            this.UpdatePreference();
            setTimeout(function () { self.HideDescription("all"); }, 300);
        },

        buttonDeletePreference_tap: function () {
            this.DeletePreference();
        },

        buttonOrder_tap: function (e) {
            $('#textSourceTransaction').text("order");
            $('#buttonSourceTransaction').parent().removeClass('open');
        },

        buttonInvoice_tap: function (e) {
            $('#textSourceTransaction').text("invoice");
            $('#buttonSourceTransaction').parent().removeClass('open');
        },

        textboxSearchWorkstations_keyup: function (e) {
            if (e.keyCode === 13) {
                this.CreatePreference();
            }
        },

        AnimateSettings: function (isAnimate) {
            if (this.spinner == null) {
                this.spinner = new Spinner();
            }

            this.isAnimate = isAnimate;

            if (isAnimate) {
                var target = document.getElementById("settingsBody");
                this.spinner.spin(target);
            }
            else {
                this.spinner.stop();
            }

            this.$("#buttonMenu").prop("disabled", isAnimate);
            this.$("#settingsGroup1List").prop('aria-disabled', isAnimate);
            this.$("#settingsGroup2List").prop('aria-disabled', isAnimate);            
        },

        AssignCurrentPreference: function (preference) {
            CurrentPreference.WorkstationID = preference.WorkstationID;
            CurrentPreference.DefaultLocation = preference.DefaultLocation;
            CurrentPreference.AdjustmentIsAutoPost = preference.AdjustmentIsAutoPost;
            CurrentPreference.AdjustmentIsPromptForQty = preference.AdjustmentIsPromptForQty;
            CurrentPreference.AdjustmentIsShowQtyOnHand = preference.AdjustmentIsShowQtyOnHand;
            CurrentPreference.LabelSourceTransaction = preference.LabelSourceTransaction;
            CurrentPreference.PackIsAutoPrint = preference.PackIsAutoPrint;
            CurrentPreference.PackIsPromptForQty = preference.PackIsPromptForQty;
            CurrentPreference.PackIsShowQtyOnHand = preference.PackIsShowQtyOnHand;            
            CurrentPreference.PackSourceTransaction = preference.PackSourceTransaction;
            CurrentPreference.PhysicalInventoryIsAllowToSkipItems = preference.PhysicalInventoryIsAllowToSkipItems;
            CurrentPreference.PhysicalInventoryIsPromptForQty = preference.PhysicalInventoryIsPromptForQty;
            CurrentPreference.PhysicalInventoryIsShowQtyOnHand = preference.PhysicalInventoryIsShowQtyOnHand;
            CurrentPreference.PhysicalInventoryIsAutoPost = preference.PhysicalInventoryIsAutoPost;
            CurrentPreference.PickIsAllowToSkipItems = preference.PickIsAllowToSkipItems;
            CurrentPreference.PickIsPromptBinManager = preference.PickIsPromptBinManager;            
            CurrentPreference.PickIsPromptForQty = preference.PickIsPromptForQty;
            CurrentPreference.PickIsShowQtyOnHand = preference.PickIsShowQtyOnHand;            
            CurrentPreference.PickSourceTransaction = preference.PickSourceTransaction;
            CurrentPreference.PickIsAutoComplete = preference.PickIsAutoComplete;
            CurrentPreference.PrePackIsAutoPrint = preference.PrePackIsAutoPrint;
            CurrentPreference.PrePackIsEnable = preference.PrePackIsEnable;
            CurrentPreference.PreventDuplicateSerialNumber = preference.PreventDuplicateSerialNumber;
            CurrentPreference.SupplierPreventDuplicateSerialNumber = preference.SupplierPreventDuplicateSerialNumber;
            CurrentPreference.ReceiveIsPromptBinManager = preference.ReceiveIsPromptBinManager;
            CurrentPreference.ReceiveIsPromptForQty = preference.ReceiveIsPromptForQty;
            CurrentPreference.ReceiveIsShowQtyOnHand = preference.ReceiveIsShowQtyOnHand;
            CurrentPreference.SerialNumberTransactionValidationType = preference.SerialNumberTransactionValidationType;
            CurrentPreference.SupplierSerialNumberTransactionValidationType = preference.SupplierSerialNumberTransactionValidationType;
            CurrentPreference.StockIsPromptBinManager = preference.StockIsPromptBinManager;
            CurrentPreference.StockIsPromptForQty = false;//preference.StockIsPromptForQty;
            CurrentPreference.StockIsShowQtyOnHand = preference.StockIsShowQtyOnHand;
            CurrentPreference.TransferIsAutoPost = preference.TransferIsAutoPost;
            CurrentPreference.TransferIsPromptForQty = preference.TransferIsPromptForQty;
            CurrentPreference.TransferIsShowQtyOnHand = preference.TransferIsShowQtyOnHand;
            CurrentPreference.IsQuickPack = preference.IsQuickPack;
            CurrentPreference.IsBatchPick = preference.IsBatchPick;
            CurrentPreference.WebSiteCode = preference.WebSiteCode;
            CurrentPreference.UseCbeImage = preference.UseCbeImage;
            CurrentPreference.WebSiteDescription = preference.WebSiteDescription;
            CurrentPreference.WebSiteURL = preference.WebSiteURL;
            CurrentPreference.EnableAdvancedFreightRateCalculation = preference.EnableAdvancedFreightRateCalculation;
        },        

        CreatePreference: function () {
            workstationID = $("#textboxSearchWorkstations").val()
            $("#textboxSearchWorkstations").val("");

            if (workstationID != null && workstationID != "") {
                this.model.set({ WorkstationID: workstationID });
                var settingsModel = new SettingsModel();
                var self = this;

                settingsModel.url = Global.ServiceUrl + Service.POS + Method.UPDATEWAREHOUSEPREFERENCE;

                settingsModel.set({
                    Preference: self.model
                });

                settingsModel.save(null, {
                    success: function (model, response, options) {
                        if (!model.get("hasError")) {
                            var isWorkstationExist = false;
                            if (self.cartItems && self.cartItems.models.length > 0) {
                                self.cartItems.each(function (item) {
                                    if (item.get('ListItemLabel') == response.Preference.WorkstationID) {
                                        isWorkstationExist = true;
                                    }
                                });
                            };

                            if (!isWorkstationExist) {
                                var currentWorkstationID = response.Preference.WorkstationID;
                                var listMode = Enum.ListMode.Workstations;
                                CurrentPreference.WorkstationID = currentWorkstationID;
                                model.set({
                                    ListItemLabel: currentWorkstationID,
                                    ListItemLabel2: "Location: " + response.Preference.DefaultLocation,
                                    ListMode: listMode,
                                });
                                self.RenderListItem(listMode, model);
                                self.checkListiScroll = Shared.LoadiScroll(self.checkListiScroll, "CheckList");
                            }
                        }
                    }
                });
            }
        },

        DeletePreference: function () {
            var self = this;

            navigator.notification.confirm("Are you sure you want to delete this workstation?", function (button) {
                if (button == 1) {
                    if (selectedItem != null) {
                        var workstationID = selectedItem.model.get("ListItemLabel");
                        self.model.set({ WorkstationID: workstationID });
                        var settingsModel = new SettingsModel();

                        settingsModel.url = Global.ServiceUrl + Service.POS + Method.DELETEWAREHOUSEPREFERENCE;

                        settingsModel.set({
                            Preference: self.model
                        });

                        self.AnimateSettings(true);
                        settingsModel.save(null, {
                            success: function (model, response, options) {
                                if (!model.get("hasError")) {
                                    model.destroy();
                                    self.AnimateSettings(false);
                                    self.preferences.remove(model);
                                    self.RemoveFromCheckList(selectedItem);
                                }
                            },
                            error: function (model, error, response) {
                                self.AnimateSettings(false);                                
                            }
                        });
                    }
                }
            }, "Delete Workstation?", "Yes,No");
        },

        HideDescription: function (featureName) {
            switch (featureName) {
                case "AllowSkipItems":
                    $('#descriptionAllowSkipItems li:nth-child(2)').toggle();
                    break;
                case "AutoComplete":
                    $('#descriptionAutoComplete li:nth-child(2)').toggle();
                    break;
                case "AutoPrint":
                    $('#descriptionAutoPrint li:nth-child(2)').toggle();
                    break;
                case "BatchPick":
                    $('#descriptionBatchPick li:nth-child(2)').toggle();
                    break;
                case "Enable":
                    $('#descriptionEnable li:nth-child(2)').toggle();
                    break;
                case "PromptBinManager":
                    $('#descriptionPromptBinManager li:nth-child(2)').toggle();
                    break;
                case "PromptForQty":
                    $('#descriptionPromptForQty li:nth-child(2)').toggle();
                    break;
                case "QtyOnHand":
                    $('#descriptionQtyOnHand li:nth-child(2)').toggle();
                    break;
                case "QuickPack":
                    $('#descriptionQuickPack li:nth-child(2)').toggle();
                    break;
                case "SourceTransaction":
                    $('#descriptionSourceTransaction li:nth-child(2)').toggle();
                    break;
                case "UseCbeImage":
                    $('#descriptionUseCbeImage li:nth-child(2)').toggle();
                    break;
                case "WebSite":
                    $('#descriptionWebSite li:nth-child(2)').toggle();
                    break;
                case "all":
                    $('#featurePreferenceList li a ul li:nth-child(2)').hide();
                    break;
                case "AutoPost":
                    $('#descriptionAutoPost li:nth-child(2)').toggle();
                    break;
            }
            this.featurePreferenceiScroll = Shared.LoadiScroll(this.featurePreferenceiScroll, "FeaturePreference");
        },

        HighLightSelectedRow: function (row, reset) {
            $("li").removeClass("highlight");
            if (!reset) {
                $("#" + row).addClass("highlight");
            }
        },

        InitializeCartItemCollection: function () {
            if (this.cartItems) {
                this.cartItems.reset();
            }
            else {
                this.cartItems = new CartItemCollection();
            }
        },                    

        InitializeChildViews: function () {            
            this.WireEvents();
            this.InitializeSwitch();
            this.InitializeDefaultWorkstation();
            this.InitializeWarehousePreference();
            this.LoadiScroll();
        },		        

        InitializeDefaultWorkstation: function () {
            var self = this;
            this.preferences = new LocalPreferenceCollection();
            this.preferences.fetch({
                isLocalStorage: true,
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        if (self.preferences.length == 0) {
                            self.SetDefaultWorkstationID(Global.WorkstationID);
                            self.preferences.create({ DefaultWorkstation: Global.WorkstationID });
                        } else {
                            self.SetDefaultWorkstationID(self.preferences.models[0].get('DefaultWorkstation'));
                        }
                    }
                }
            });
        },        

        InitializeModel : function() {
            this.model = new SettingsModel();
            this.model.set({
                WorkstationID : CurrentPreference.WorkstationID,
                DefaultLocation: CurrentPreference.DefaultLocation,
                AdjustmentIsAutoPost: CurrentPreference.AdjustmentIsAutoPost,
                AdjustmentIsPromptForQty: CurrentPreference.AdjustmentIsPromptForQty,
                AdjustmentIsShowQtyOnHand: CurrentPreference.AdjustmentIsShowQtyOnHand,
                PackIsPromptForQty: CurrentPreference.PackIsPromptForQty,
                PackIsShowQtyOnHand: CurrentPreference.PackIsShowQtyOnHand,
                PackSourceTransaction: CurrentPreference.PackSourceTransaction,
                PhysicalInventoryIsAllowToSkipItems: CurrentPreference.PhysicalInventoryIsAllowToSkipItems,
                PhysicalInventoryIsPromptForQty: CurrentPreference.PhysicalInventoryIsPromptForQty,
                PhysicalInventoryIsShowQtyOnHand: CurrentPreference.PhysicalInventoryIsShowQtyOnHand,
                PhysicalInventoryIsAutoPost: CurrentPreference.PhysicalInventoryIsAutoPost,
                PickIsAllowToSkipItems: CurrentPreference.PickIsAllowToSkipItems,
                PickIsPromptBinManager: CurrentPreference.PickIsPromptBinManager,                
                PickIsPromptForQty: CurrentPreference.PickIsPromptForQty,
                PickIsShowQtyOnHand: CurrentPreference.PickIsShowQtyOnHand,
                PickSourceTransaction: CurrentPreference.PickSourceTransaction,
                PrePackIsAutoPrint: CurrentPreference.PrePackIsAutoPrint,
                PrePackIsEnable: CurrentPreference.PrePackIsEnable,
                PreventDuplicateSerialNumber: CurrentPreference.PreventDuplicateSerialNumber,
                SupplierPreventDuplicateSerialNumber: CurrentPreference.SupplierPreventDuplicateSerialNumber,
                ReceiveIsPromptBinManager: CurrentPreference.ReceiveIsPromptBinManager,
                ReceiveIsPromptForQty: CurrentPreference.ReceiveIsPromptForQty,
                ReceiveIsShowQtyOnHand: CurrentPreference.ReceiveIsShowQtyOnHand,
                SerialNumberTransactionValidationType: CurrentPreference.SerialNumberTransactionValidationType,
                SupplierSerialNumberTransactionValidationType: CurrentPreference.SupplierSerialNumberTransactionValidationType,
                StockIsPromptBinManager: CurrentPreference.StockIsPromptBinManager,
                StockIsPromptForQty: CurrentPreference.StockIsPromptForQty,
                StockIsShowQtyOnHand: CurrentPreference.StockIsShowQtyOnHand,
                TransferIsAutoPost: CurrentPreference.TransferIsAutoPost,
                TransferIsPromptForQty: CurrentPreference.TransferIsPromptForQty,
                TransferIsShowQtyOnHand: CurrentPreference.TransferIsShowQtyOnHand,
                IsQuickPack: CurrentPreference.IsQuickPack,
                IsBatchPick: CurrentPreference.IsBatchPick,
                WebSiteCode: CurrentPreference.WebSiteCode,
                UseCbeImage: CurrentPreference.UseCbeImage,
                WarehouseDescription: CurrentPreference.WarehouseDescription,
                WebSiteDescription: CurrentPreference.WebSiteDescription,
                WebSiteURL: CurrentPreference.WebSiteURL,
                WebSite: CurrentPreference.UseCbeImage ? CurrentPreference.WebSiteDescription : "Default Image",
                EnableAdvancedFreightRateCalculation: CurrentPreference.EnableAdvancedFreightRateCalculation
            });           

            this.$el.html(this._template(this.model.toJSON()));
        },
		
        InitializeSwitch : function() {
            $('.switch').attr("data-on", "success");
            $('.switch').attr("data-on-label", "yes");
            $('.switch').attr("data-off", "danger");
            $('.switch').attr("data-off-label", "no");
            $('.switch').bootstrapSwitch();
        },

        InitializeFeaturePreference: function () {            
            switch (this.model.get('ListMode')) {
                case Enum.ListMode.AdjustmentPreference:
                    $('#switchIsPromptForQty').bootstrapSwitch('setState', CurrentPreference.AdjustmentIsPromptForQty);
                    $('#switchIsShowQtyOnHand').bootstrapSwitch('setState', CurrentPreference.AdjustmentIsShowQtyOnHand);
                    $('#switchIsAutoPost').bootstrapSwitch('setState', CurrentPreference.AdjustmentIsAutoPost);
                    break;                
                case Enum.ListMode.PackPreference:
                    $('#switchIsAutoPrint').bootstrapSwitch('setState', CurrentPreference.PackIsAutoPrint);
                    $('#switchIsPromptForQty').bootstrapSwitch('setState', CurrentPreference.PackIsPromptForQty);
                    $('#switchIsShowQtyOnHand').bootstrapSwitch('setState', CurrentPreference.PackIsShowQtyOnHand);
                    $('#switchIsQuickPack').bootstrapSwitch('setState', CurrentPreference.IsQuickPack);
                    this.SetFeatureSourceTransaction(CurrentPreference.PackSourceTransaction);
                    $('#switchIsQuickPack').bootstrapSwitch('setActive', false);
                    $('#rowIsQuickPack').hide();
                    break;
                case Enum.ListMode.PhysicalInventoryPreference:
                    $('#switchIsAllowToSkipItems').bootstrapSwitch('setState', CurrentPreference.PhysicalInventoryIsAllowToSkipItems);
                    $('#switchIsPromptForQty').bootstrapSwitch('setState', CurrentPreference.PhysicalInventoryIsPromptForQty);
                    $('#switchIsShowQtyOnHand').bootstrapSwitch('setState', CurrentPreference.PhysicalInventoryIsShowQtyOnHand);
                    $('#switchIsAutoPost').bootstrapSwitch('setState', CurrentPreference.PhysicalInventoryIsAutoPost);
                    break;
                case Enum.ListMode.PickPreference:
                    $('#switchIsAllowToSkipItems').bootstrapSwitch('setState', CurrentPreference.PickIsAllowToSkipItems);
                    $('#switchIsPromptBinManager').bootstrapSwitch('setState', CurrentPreference.PickIsPromptBinManager);                    
                    $('#switchIsPromptForQty').bootstrapSwitch('setState', CurrentPreference.PickIsPromptForQty);
                    $('#switchIsShowQtyOnHand').bootstrapSwitch('setState', CurrentPreference.PickIsShowQtyOnHand);
                    $('#switchIsBatchPick').bootstrapSwitch('setState', CurrentPreference.IsBatchPick);
                    this.SetFeatureSourceTransaction(CurrentPreference.PickSourceTransaction);
                    $('#switchIsBatchPick').bootstrapSwitch('setActive', false);
                    $('#switchIsAutoComplete').bootstrapSwitch('setState', CurrentPreference.PickIsAutoComplete);
                    $('#rowBatchPick').hide();
                    break;
                case Enum.ListMode.PrePackPreference:
                    $('#switchIsAutoPrint').bootstrapSwitch('setState', CurrentPreference.PrePackIsAutoPrint);
                    $('#switchIsEnable').bootstrapSwitch('setState', CurrentPreference.PrePackIsEnable);
                    break;
                case Enum.ListMode.ReceivePreference:
                    $('#switchIsPromptBinManager').bootstrapSwitch('setState', CurrentPreference.ReceiveIsPromptBinManager);
                    $('#switchIsPromptForQty').bootstrapSwitch('setState', CurrentPreference.ReceiveIsPromptForQty);
                    $('#switchIsShowQtyOnHand').bootstrapSwitch('setState', CurrentPreference.ReceiveIsShowQtyOnHand);                    
                    break;
                case Enum.ListMode.StockPreference:
                    $('#switchIsPromptBinManager').bootstrapSwitch('setState', CurrentPreference.StockIsPromptBinManager);
                    $('#switchIsPromptForQty').bootstrapSwitch('setState', CurrentPreference.StockIsPromptForQty);
                    $('#switchIsShowQtyOnHand').bootstrapSwitch('setState', CurrentPreference.StockIsShowQtyOnHand);
                    break;
                case Enum.ListMode.TransferPreference:
                    $('#switchIsPromptForQty').bootstrapSwitch('setState', CurrentPreference.TransferIsPromptForQty);
                    $('#switchIsShowQtyOnHand').bootstrapSwitch('setState', CurrentPreference.TransferIsShowQtyOnHand);
                    $('#switchIsAutoPost').bootstrapSwitch('setState', CurrentPreference.TransferIsAutoPost);
                    break;
                case Enum.ListMode.ItemImagesPreference:
                    $('#switchUseCbeImage').bootstrapSwitch('setState', CurrentPreference.UseCbeImage);
                    break;
                case Enum.ListMode.LabelPreference:
                    this.SetFeatureSourceTransaction(CurrentPreference.LabelSourceTransaction);
                    break;
            }
        },

        InitializeWarehousePreference: function () {
            $('#textWorkstationID').text(CurrentPreference.WorkstationID);
            $('#textDefaultLocation').text(CurrentPreference.DefaultLocation);
        },
               
        LoadiScroll: function () {
            var contentID = '#containerSettings';

            if (this.checkListiScroll) {
                this.checkListiScroll.refresh();
                return this.checkListiScroll;
            }
            else {
                return new IScroll(contentID, { vScrollbar: true, scrollbars: true, scrollY: true });
            }
        },

        LoadLocationLookup: function () {
            var settingsModel = new SettingsModel();
            var rowsToSelect = "/20";
            settingsModel.url = Global.ServiceUrl + Service.PRODUCT + Method.LOADLOCATIONLOOKUP + rowsToSelect;
            settingsModel.set({ Criteria: null });
            self = this;
            settingsModel.save(null, {
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        self.RenderLookup(response, Enum.ListMode.DefaultLocations);
                    }
                }
            });
        },

        LoadPreferenceByWorkstation: function (isLogin) {
            var workstationID = CurrentPreference.WorkstationID;
            var settingsModel = new SettingsModel();
            settingsModel.url = Global.ServiceUrl + Service.POS + Method.GETWAREHOUSEPREFERENCEBYWORKSTATION + workstationID;
            self = this;
            settingsModel.fetch({
                success: function (model, response) {
                    if (!model.get("hasError")) {
                        self.AssignCurrentPreference(response.Preference);
                        if (isLogin) self.ShowDashBoard();
                        else self.InitializeWarehousePreference();
                    }                    
                }
            });            
        },

        LoadPreferenceLookup: function () {
            var settingsModel = new SettingsModel();
            settingsModel.url = Global.ServiceUrl + Service.POS + Method.LOADWAREHOUSEPREFERENCELOOKUP;
            settingsModel.set({ Criteria: null });
            self = this;
            settingsModel.save(null, {
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        self.RenderLookup(response, Enum.ListMode.Workstations);
                    }
                }
            });
        },		                

        LoadWebsiteLookup: function () {
            var settingsModel = new SettingsModel();
            var rowsToSelect = "/20";
            settingsModel.url = Global.ServiceUrl + Service.POS + Method.ECOMMERCESITELOOKUP + rowsToSelect;
            settingsModel.set({ Criteria: null });
            self = this;
            settingsModel.save(null, {
                success: function (model, response, options) {
                    if (!model.get("hasError")) {
                        self.RenderLookup(response, Enum.ListMode.WebSite);
                    }
                }
            });
        },

        PopulateCartItemCollection: function (items, listMode) {
            this.cartItems.reset();
            var self = this;

            _.each(items, function (current) {
                var checkListItem = new CheckListItemModel({
                    ListMode: listMode,
                    model: current
                });
                switch (listMode) {
                    case Enum.ListMode.Workstations:
                        checkListItem.set({
                            Preference: current,
                            ListItemLabel: current.WorkstationID,
                            ListItemLabel2: "Location: " + current.DefaultLocation
                        });
                        break;
                    case Enum.ListMode.DefaultLocations:
                        checkListItem.set({
                            DefaultLocation: current.WarehouseCode,
                            ListItemLabel: current.WarehouseDescription,
                            ListItemLabel2: current.WarehouseAddress                            
                        });
                        break;
                    case Enum.ListMode.WebSite:
                        checkListItem.set({
                            WebSiteCode: current.WebSiteCode,
                            WebSiteDescription: current.WebSiteDescription,
                            WebSiteURL: current.WebSiteURL,
                            ListItemLabel: current.WebSiteDescription,
                            ListItemLabel2: current.WebSiteURL
                        });
                        break;
                }
                self.cartItems.add(checkListItem);
            });
        },        	

        RemoveFromCheckList: function (selectedWorkstationID) {
            if (selectedWorkstationID != null) {
                $('#checkListRow' + selectedWorkstationID.model.get('ViewID')).parent().remove();
                selectedItem = null;
                this.checkListiScroll = Shared.LoadiScroll(self.checkListiScroll, "CheckList");
            }
        },

        RenderListItem: function (listMode, item) {
            var checkListItemView = new CheckListItemView({ model: item });
            $('#cartCheckList tbody').append(checkListItemView.render());
            checklistMode = listMode;
            this.WireCartItemEvents(checkListItemView);
            switch (listMode) {
                case Enum.ListMode.Workstations:
                    if (CurrentPreference.WorkstationID == item.get('ListItemLabel')) {
                        this.HighLightItem(checkListItemView);
                        //this.SetDefaultPreference(checkListItemView);
                    }
                    break;
                case Enum.ListMode.DefaultLocations:
                    if (CurrentPreference.DefaultLocation == item.get('DefaultLocation')) {
                        this.HighLightItem(checkListItemView);
                        //this.SetDefaultLocation(checkListItemView);
                    }
                    break;
                case Enum.ListMode.WebSite:
                    if (CurrentPreference.WebSiteCode == item.get('WebSiteCode')) {
                        this.HighLightItem(checkListItemView);
                        //this.SetDefaultLocation(checkListItemView);
                    }
                    break;
            }
        },

        RenderListItems: function (listMode) {
            var self = this;
            this.$("#cartCheckList tbody").html("");
            if (this.cartItems && this.cartItems.models.length > 0) {
                this.cartItems.each(function (item) {
                    self.RenderListItem(listMode, item);
                });
                this.checkListiScroll = Shared.LoadiScroll(this.checkListiScroll, "CheckList");
            };
        },

        RenderLookup: function(list, listMode) {
            if (list) {                                                
                $('#cartCheckList').addClass('bordered-list');
                switch (listMode) {
                    case Enum.ListMode.Workstations:
                        this.PopulateCartItemCollection(list.Preferences, listMode);
                        break;
                    case Enum.ListMode.DefaultLocations:
                        this.PopulateCartItemCollection(list.Warehouses, listMode);
                        break;
                    case Enum.ListMode.WebSite:
                        this.PopulateCartItemCollection(list.EcommerceSites, listMode);
                        break;
                }
                this.RenderListItems(listMode);

                switch (listMode) {
                    case Enum.ListMode.WebSite:
                        this.SwitchDisplay(3);
                        break;
                    default:
                        this.SwitchDisplay(2);
                        break;
                }                
            }
        },        
		
		UpdateFeaturePrefenceNavTitle: function (listMode) {
		    switch (listMode) {
		        case Enum.ListMode.Workstations:
		            $("#featurePreferenceNavTitle").text('workstations');
		            break;
		        case Enum.ListMode.DefaultLocations:
		            $("#featurePreferenceNavTitle").text('locations');
		            break;
		        case Enum.ListMode.AdjustmentPreference:
		            $("#featurePreferenceNavTitle").text('adjustment');
		            break;
		        case Enum.ListMode.LabelPreference:
		            $("#featurePreferenceNavTitle").text('ship');
		            break;
                case Enum.ListMode.PackPreference:
                    $("#featurePreferenceNavTitle").text('pack');
                    break;
		        case Enum.ListMode.PhysicalInventoryPreference:
		            $("#featurePreferenceNavTitle").text('physical inventory');
		            break;
		        case Enum.ListMode.PickPreference:
		            $("#featurePreferenceNavTitle").text('pick');
		            break;
		        case Enum.ListMode.PrePackPreference:
		            $("#featurePreferenceNavTitle").text('prepack');
		            break;
		        case Enum.ListMode.ReceivePreference:
		            $("#featurePreferenceNavTitle").text('receive');
		            break;
		        case Enum.ListMode.StockPreference:
		            $("#featurePreferenceNavTitle").text('stock');
		            break;
		        case Enum.ListMode.TransferPreference:
		            $("#featurePreferenceNavTitle").text('transfer');
		            break;
		        case Enum.ListMode.ItemImagesPreference:
		            $("#featurePreferenceNavTitle").text('item images');
		            break;
		    }
		    this.model.set({ ListMode: listMode });
		},		

		HasChanges: function (currentValue, newValue) {
		    if (currentValue != newValue) {
		        this.IsPreferenceChanged = true;
		        return true;
		    }
		    return false;
		},

		HighLightItem: function (itemView) {		    
		    if ($("." + itemView.cid).hasClass("highlight")) {
		        return false;
		    }

		    this.$('.listitem-1').addClass('listitem-1').removeClass('listitem-2');
		    this.$('.listitem-2').addClass('listitem-1').removeClass('listitem-2');
            		    
		    Shared.HighLightItem(itemView.cid, "CheckList");
		    this.$('#listItem' + itemView.model.get('ViewID')).removeClass('listitem-1').addClass('listitem-2');
		    selectedItem = itemView;

		    return true;
		},

		ReturnFromCheckList: function () {
		    if (this.PageIndex == 3) {
		        this.SetWebSite(selectedItem);
		        this.SwitchDisplay(2);
		    }
		    else {
		        switch (checklistMode) {
		            case Enum.ListMode.Workstations:
		                if (selectedItem != null) this.SetDefaultPreference(selectedItem);
		                else {
		                    navigator.notification.alert("Please select Workstation ID", null, "Workstation ID", "OK");
		                    return;
		                }
		                break;
		            case Enum.ListMode.DefaultLocations:
		                this.SetDefaultLocation(selectedItem);
		                break;
		        }
		        this.UpdatePreference();
		    }
		},

		SetDefaultLocation: function (listItemView) {		    
		    if (this.HasChanges(CurrentPreference.DefaultLocation, listItemView.model.get('DefaultLocation'))) {
		        CurrentPreference.DefaultLocation = listItemView.model.get('DefaultLocation');
		        CurrentPreference.WarehouseDescription = listItemView.model.get('ListItemLabel')
		    };
		    this.$('#textDefaultLocation').text(CurrentPreference.WarehouseDescription);
		},

		SetDefaultPreference: function (listItemView) {
		    if (this.HasChanges(CurrentPreference.WorkstationID, listItemView.model.get('Preference').WorkstationID)) {
		        this.AssignCurrentPreference(listItemView.model.get('Preference'));		     
		    }
		    this.$('#textWorkstationID').text(CurrentPreference.WorkstationID);
		},

		SetWebSite: function (listItemView) {
		    if (listItemView != null) {
		        if (this.HasChanges(CurrentPreference.WebSiteCode, listItemView.model.get('WebSiteCode'))) {
		            CurrentPreference.WebSiteCode = listItemView.model.get('WebSiteCode');
		            CurrentPreference.WebSiteDescription = listItemView.model.get('WebSiteDescription');
		            CurrentPreference.WebSiteURL = listItemView.model.get('WebSiteURL');
		        }
		        this.$('#textWebSite').text(CurrentPreference.WebSiteDescription);
		    }
		    else {
		        CurrentPreference.WebSiteCode = null
		        CurrentPreference.WebSiteDescription = null
		        CurrentPreference.WebSiteURL = null
		        this.$('#textWebSite').text("");
		    }		    
		},

		SaveDefaultWorkstationID: function () {
		    if (this.preferences.length > 0) {
		        this.preferences.models[0].save({ DefaultWorkstation: CurrentPreference.WorkstationID });
		    }
		},

		SetCurrentPreference: function (view) {
		    view.model.set({
		        Preference: {
		            WorkstationID: CurrentPreference.WorkstationID,
		            DefaultLocation: CurrentPreference.DefaultLocation,
                    AdjustmentIsAutoPost: CurrentPreference.AdjustmentIsAutoPost,
		            AdjustmentIsPromptForQty: CurrentPreference.AdjustmentIsPromptForQty,
		            AdjustmentIsShowQtyOnHand: CurrentPreference.AdjustmentIsShowQtyOnHand,
		            LabelSourceTransaction: CurrentPreference.LabelSourceTransaction,
		            PackIsAutoPrint: CurrentPreference.PackIsAutoPrint,
		            PackIsPromptForQty: CurrentPreference.PackIsPromptForQty,
		            PackIsShowQtyOnHand: CurrentPreference.PackIsShowQtyOnHand,
		            PackSourceTransaction: CurrentPreference.PackSourceTransaction,
		            PhysicalInventoryIsAllowToSkipItems: CurrentPreference.PhysicalInventoryIsAllowToSkipItems,
		            PhysicalInventoryIsPromptForQty: CurrentPreference.PhysicalInventoryIsPromptForQty,
		            PhysicalInventoryIsShowQtyOnHand: CurrentPreference.PhysicalInventoryIsShowQtyOnHand,
                    PhysicalInventoryIsAutoPost: CurrentPreference.PhysicalInventoryIsAutoPost,
		            PickIsAllowToSkipItems: CurrentPreference.PickIsAllowToSkipItems,
		            PickIsPromptBinManager: CurrentPreference.PickIsPromptBinManager,		            
		            PickIsPromptForQty: CurrentPreference.PickIsPromptForQty,
		            PickIsShowQtyOnHand: CurrentPreference.PickIsShowQtyOnHand,
		            PickSourceTransaction: CurrentPreference.PickSourceTransaction,
		            PickIsAutoComplete: CurrentPreference.PickIsAutoComplete,
		            PrePackIsAutoPrint: CurrentPreference.PrePackIsAutoPrint,
		            PrePackIsEnable: CurrentPreference.PrePackIsEnable,
                    PreventDuplicateSerialNumber: CurrentPreference.PreventDuplicateSerialNumber,
                    SupplierPreventDuplicateSerialNumber: CurrentPreference.SupplierPreventDuplicateSerialNumber,
                    ReceiveIsPromptBinManager: CurrentPreference.ReceiveIsPromptBinManager,
		            ReceiveIsPromptForQty: CurrentPreference.ReceiveIsPromptForQty,
		            ReceiveIsShowQtyOnHand: CurrentPreference.ReceiveIsShowQtyOnHand,
                    StockIsPromptBinManager: CurrentPreference.StockIsPromptBinManager,
		            StockIsPromptForQty: CurrentPreference.StockIsPromptForQty,
		            StockIsShowQtyOnHand: CurrentPreference.StockIsShowQtyOnHand,
                    SerialNumberTransactionValidationType: CurrentPreference.SerialNumberTransactionValidationType,
                    SupplierSerialNumberTransactionValidationType: CurrentPreference.SupplierSerialNumberTransactionValidationType,
                    TransferIsAutoPost: CurrentPreference.TransferIsAutoPost,
		            TransferIsPromptForQty: CurrentPreference.TransferIsPromptForQty,
		            TransferIsShowQtyOnHand: CurrentPreference.TransferIsShowQtyOnHand,
		            IsQuickPack: CurrentPreference.IsQuickPack,
		            IsBatchPick: CurrentPreference.IsBatchPick,
		            WebSiteCode: CurrentPreference.WebSiteCode,
		            UseCbeImage: CurrentPreference.UseCbeImage,
		            WarehouseDescription : CurrentPreference.WarehouseDescription,
		            WebSiteDescription: CurrentPreference.WebSiteDescription,
		            WebSiteURL: CurrentPreference.WebSiteURL,
                    PackIsShip: CurrentPreference.PackIsShip,
                    EnableAdvancedFreightRateCalculation: CurrentPreference.EnableAdvancedFreightRateCalculation
		        }
		    });
		},

		SetDefaultWorkstationID: function (defaultWorkstation) {
		    CurrentPreference.WorkstationID = defaultWorkstation;		    
		},				

		SetFeatureSourceTransaction: function(value) {
		    $('#textSourceTransaction').text(value);		  
		},

		SwitchDisplay: function (pageNumber) {		    
		    switch (pageNumber) {
		        case 1:
		            Shared.SlideX('.slider', 0);
		            break;
		        case 2:
		            Shared.SlideX('.slider', Global.ScreenWidth * -1);
		            break;
		        case 3:
		            Shared.SlideX('.slider', Global.ScreenWidth * -2);
		            break;
		    }

		    this.PageIndex = pageNumber;
		},

		ShowCheckListSection: function (mode, title) {
		    $('#checkListSection').removeClass('section-close').addClass('section-show');
		    if (mode != Enum.ListMode.ItemImagesPreference) {
		        $('#featurePreferenceSection').removeClass('section-show').addClass('section-close');
		    }

		    $('#checkListNavTitle').text(title);

            switch (mode) {
		        case Enum.ListMode.Workstations:
		            $('#checkListHeader').show();		
		            $('#workstationIDFooter').show();	
                    $('#containerTableCheckList').removeClass('iscroll-cartitem').removeClass('iscroll-lookup').addClass('iscroll-workstation');
		            break;
		        case Enum.ListMode.DefaultLocations:
		        case Enum.ListMode.ItemImagesPreference:
		            $('#checkListHeader').hide();
		            $('#workstationIDFooter').hide();
		            $('#containerTableCheckList').removeClass('iscroll-lookup').addClass('iscroll-cartitem');
		            break;		        
		    }		    
		},

		ShowDashBoard: function() {
		    window.location.hash = 'dashboard';
		},

		ShowFeaturePreferenceSection: function(template) {

		    $('#featurePreferenceSection').removeClass('section-close').addClass('section-show');
		    $('#checkListSection').removeClass('section-show').addClass('section-close');

		    this.UpdateFeaturePrefenceNavTitle(template);

		    $('#rowBatchPick').hide();
		    $('#rowIsAutoComplete').hide();		    
		    $('#rowIsPromptBinManager').hide();
		    $('#rowIsAllowToSkipItems').hide();
		    $('#rowIsAutoPrint').hide();
		    $('#rowIsEnable').hide();
		    $('#rowIsQuickPack').hide();
		    $('#rowIsShowQtyOnHand').hide();
		    $('#rowSourceTransaction').hide();
		    $('#rowUseCbeImage').hide();
		    $('#rowWebSite').hide();
		    $('#rowIsPromptForQty').show();
            $('#rowIsAutoPost').hide();
		    
		    switch (template) {
		        case Enum.ListMode.AdjustmentPreference:
		            $('#rowIsShowQtyOnHand').show();
                    $('#rowIsAutoPost').show();
                    $('#rowIsAutoPost .autoPostDesc').text('adjustment.');
		            break;
		        case Enum.ListMode.LabelPreference:
		            $('#rowIsPromptForQty').hide();
		            $('#rowSourceTransaction').show();
		            break;
		        case Enum.ListMode.PackPreference:
		            $('#rowIsAutoPrint').show();
		            $('#rowSourceTransaction').show();
		            $('#rowIsQuickPack').show();
		            $('#rowIsShowQtyOnHand').show();
		            break;
		        case Enum.ListMode.PhysicalInventoryPreference:
		            $('#rowIsShowQtyOnHand').show();
		            $('#rowIsAllowToSkipItems').show();
                    $('#rowIsAutoPost').show();
                    $('#rowIsAutoPost .autoPostDesc').text('stock take.');
		            break;
		        case Enum.ListMode.PickPreference:		            
		            $('#rowIsPromptBinManager').show();
		            $('#rowIsAllowToSkipItems').show();
		            $('#rowSourceTransaction').show();
		            $('#rowBatchPick').show();
		            $('#rowIsAutoComplete').show();
		            $('#rowIsShowQtyOnHand').show();
		            $('#textPromptBin').text("Allow change bin");
		            break;
		        case Enum.ListMode.PrePackPreference:
		            $('#rowIsAutoPrint').show();
		            $('.checkboxIsAutoPrint').prop("disabled", true);
		            $('#rowIsEnable').show();
		            $('#rowIsPromptForQty').hide();
		            break;
		        case Enum.ListMode.ReceivePreference:
                    $('#rowIsPromptBinManager').show();
                    $('#rowIsShowQtyOnHand').show();
                    $('#textPromptBin').text("Prompt for bin");
                    break;       
		        case Enum.ListMode.StockPreference:
		            $('#rowIsPromptBinManager').show();
		            $('#rowIsShowQtyOnHand').show();
		            $('#textPromptBin').text("Prompt for bin");
                    $('#rowIsPromptForQty').hide();
		            break;		        
		        case Enum.ListMode.ItemImagesPreference:
		            $('#rowIsPromptForQty').hide();
		            $('#rowUseCbeImage').show();
		            $('#rowWebSite').show();		            
		            break;
		        case Enum.ListMode.TransferPreference:
		            $('#rowIsShowQtyOnHand').show();
                    $('#rowIsAutoPost').show();
                    $('#rowIsAutoPost .autoPostDesc').text('transfer.');
		            break;
		    }
        },

		UpdateFeaturePreference: function () {
		    var newIsAllowToSkipItems = $('#switchIsAllowToSkipItems').bootstrapSwitch('status');
		    var newIsAutoPrint = $('#switchIsAutoPrint').bootstrapSwitch('status');
		    var newIsEnable = $('#switchIsEnable').bootstrapSwitch('status');
		    var newIsPromptBinManager = $('#switchIsPromptBinManager').bootstrapSwitch('status');
		    var newIsPromptForQty = $('#switchIsPromptForQty').bootstrapSwitch('status');
		    var newIsShowQtyOnHand = $('#switchIsShowQtyOnHand').bootstrapSwitch('status');
		    var newSourceTransaction = $('#textSourceTransaction').text();
		    var newUseCbeImage = $('#switchUseCbeImage').bootstrapSwitch('status');

		    switch (this.model.get('ListMode')) {
		        case Enum.ListMode.AdjustmentPreference:
                    var newIsAutoPost = $('#switchIsAutoPost').bootstrapSwitch('status');

		            if (this.HasChanges(CurrentPreference.AdjustmentIsPromptForQty, newIsPromptForQty)) {
		                CurrentPreference.AdjustmentIsPromptForQty = newIsPromptForQty;
		            }

		            if (this.HasChanges(CurrentPreference.AdjustmentIsShowQtyOnHand, newIsShowQtyOnHand)) {
		                CurrentPreference.AdjustmentIsShowQtyOnHand =  newIsShowQtyOnHand;
		            }

                    if (this.HasChanges(CurrentPreference.AdjustmentIsAutoPost, newIsAutoPost)) {
                        CurrentPreference.AdjustmentIsAutoPost = newIsAutoPost;
                    }
		            break;
		        case Enum.ListMode.LabelPreference:
		            if (this.HasChanges(CurrentPreference.LabelSourceTransaction, newSourceTransaction)) {
		                CurrentPreference.LabelSourceTransaction = newSourceTransaction;
		            }
		            break;
		        case Enum.ListMode.PackPreference:
		            var newIsQuickPack = $('#switchIsQuickPack').bootstrapSwitch('status');

		            if (this.HasChanges(CurrentPreference.PackIsAutoPrint, newIsAutoPrint)) {
		                CurrentPreference.PackIsAutoPrint = newIsAutoPrint;
		            }

		            if (this.HasChanges(CurrentPreference.PackIsPromptForQty, newIsPromptForQty)) {
		                CurrentPreference.PackIsPromptForQty = newIsPromptForQty;
		            }

		            if (this.HasChanges(CurrentPreference.PackIsShowQtyOnHand, newIsShowQtyOnHand)) {
		                CurrentPreference.PackIsShowQtyOnHand = newIsShowQtyOnHand;
		            }

		            if (this.HasChanges(CurrentPreference.PackSourceTransaction, newSourceTransaction)) {
		                CurrentPreference.PackSourceTransaction = newSourceTransaction;
		            }

		            if (this.HasChanges(CurrentPreference.IsQuickPack, newIsQuickPack)) {
		                CurrentPreference.IsQuickPack = newIsQuickPack;
		            }
		            break;
		        case Enum.ListMode.PhysicalInventoryPreference:
                    var newIsAutoPost = $('#switchIsAutoPost').bootstrapSwitch('status');
		            if (this.HasChanges(CurrentPreference.PhysicalInventoryIsAllowToSkipItems, newIsAllowToSkipItems)) {
		                CurrentPreference.PhysicalInventoryIsAllowToSkipItems = newIsAllowToSkipItems;
		            }

		            if (this.HasChanges(CurrentPreference.PhysicalInventoryIsPromptForQty, newIsPromptForQty)) {
		                CurrentPreference.PhysicalInventoryIsPromptForQty = newIsPromptForQty;
		            }
		            if (this.HasChanges(CurrentPreference.PhysicalInventoryIsShowQtyOnHand, newIsShowQtyOnHand)) {
		                CurrentPreference.PhysicalInventoryIsShowQtyOnHand = newIsShowQtyOnHand;
		            }

                    if (this.HasChanges(CurrentPreference.PhysicalInventoryIsAutoPost, newIsAutoPost)) {
                        CurrentPreference.PhysicalInventoryIsAutoPost = newIsAutoPost;
                    }
		            break;
		        case Enum.ListMode.PickPreference:
		            var newIsBatchPick = $('#switchIsBatchPick').bootstrapSwitch('status');
		            var newIsAutoComplete = $('#switchIsAutoComplete').bootstrapSwitch('status');

		            if (this.HasChanges(CurrentPreference.PickIsAllowToSkipItems, newIsAllowToSkipItems)) {
		                CurrentPreference.PickIsAllowToSkipItems = newIsAllowToSkipItems;
		            }

		            if (this.HasChanges(CurrentPreference.PickIsPromptBinManager, newIsPromptBinManager)) {
		                CurrentPreference.PickIsPromptBinManager = newIsPromptBinManager;
		            }		            

		            if (this.HasChanges(CurrentPreference.PickIsPromptForQty, newIsPromptForQty)) {
		                CurrentPreference.PickIsPromptForQty = newIsPromptForQty;
		            }

		            if(this.HasChanges(CurrentPreference.PickIsShowQtyOnHand, newIsShowQtyOnHand)) {
		                CurrentPreference.PickIsShowQtyOnHand = newIsShowQtyOnHand;
		            }

		            if(this.HasChanges(CurrentPreference.PickSourceTransaction, newSourceTransaction)) {
		                CurrentPreference.PickSourceTransaction = newSourceTransaction;
		            }

		            if(this.HasChanges(CurrentPreference.IsBatchPick, newIsBatchPick)) {
		                CurrentPreference.IsBatchPick = newIsBatchPick;
		            }

		            if (this.HasChanges(CurrentPreference.PickIsAutoComplete, newIsAutoComplete)) {
		                CurrentPreference.PickIsAutoComplete = newIsAutoComplete;
		            }
		            break;
		        case Enum.ListMode.PrePackPreference:
		            if (this.HasChanges(CurrentPreference.PrePackIsAutoPrint, newIsAutoPrint)) {
		                CurrentPreference.PrePackIsAutoPrint = newIsAutoPrint;
		            }

		            if (this.HasChanges(CurrentPreference.PrePackIsEnable, newIsEnable)) {
		                CurrentPreference.PrePackIsEnable = newIsEnable;
		            }
		            break;
		        case Enum.ListMode.ReceivePreference:
		            if (this.HasChanges(CurrentPreference.ReceiveIsPromptBinManager, newIsPromptBinManager)) {
		                CurrentPreference.ReceiveIsPromptBinManager = newIsPromptBinManager;
		            }

		            if (this.HasChanges(CurrentPreference.ReceiveIsPromptForQty, newIsPromptForQty)) {
		                CurrentPreference.ReceiveIsPromptForQty = newIsPromptForQty;
		            }

		            if (this.HasChanges(CurrentPreference.ReceiveIsShowQtyOnHand, newIsShowQtyOnHand)) {
		                CurrentPreference.ReceiveIsShowQtyOnHand = newIsShowQtyOnHand;
		            }
		            break;
		        case Enum.ListMode.StockPreference:
		            if (this.HasChanges(CurrentPreference.StockIsPromptBinManager, newIsPromptBinManager)) {
		                CurrentPreference.StockIsPromptBinManager = newIsPromptBinManager;
		            }

		            if (this.HasChanges(CurrentPreference.StockIsPromptForQty, newIsPromptForQty)) {
		                CurrentPreference.StockIsPromptForQty = newIsPromptForQty;
		            }

		            if (this.HasChanges(CurrentPreference.StockIsShowQtyOnHand, newIsShowQtyOnHand)) {
		                CurrentPreference.StockIsShowQtyOnHand = newIsShowQtyOnHand;
		            }
		            break;
		        case Enum.ListMode.TransferPreference:
                    var newIsAutoPost = $('#switchIsAutoPost').bootstrapSwitch('status');
		            if (this.HasChanges(CurrentPreference.TransferIsPromptForQty, newIsPromptForQty)) {
		                CurrentPreference.TransferIsPromptForQty = newIsPromptForQty;
		            }

		            if (this.HasChanges(CurrentPreference.TransferIsShowQtyOnHand, newIsShowQtyOnHand)) {
		                CurrentPreference.TransferIsShowQtyOnHand = newIsShowQtyOnHand;
		            }

                    if (this.HasChanges(CurrentPreference.TransferIsAutoPost, newIsAutoPost)) {
                        CurrentPreference.TransferIsAutoPost = newIsAutoPost;
                    }
		            break;
		        case Enum.ListMode.ItemImagesPreference:
		            if (this.HasChanges(CurrentPreference.UseCbeImage, newUseCbeImage)) {
		                CurrentPreference.UseCbeImage = newUseCbeImage;
		            }		            
		            this.$("#textItemImage").text((CurrentPreference.UseCbeImage ? CurrentPreference.WebSiteDescription : "Default Image"));
		            break;
		    }
		    
		},

		UpdatePreference: function () {		    
		    var self = this;
		    if (this.IsPreferenceChanged) {
		        this.IsPreferenceChanged = false;
		        this.SetCurrentPreference(this);
		        this.SaveDefaultWorkstationID();
		        this.model.url = Global.ServiceUrl + Service.POS + Method.UPDATEWAREHOUSEPREFERENCE;
		        this.AnimateSettings(true);
		        this.model.save(null, {
		            success: function (model, response, options) {
		                self.AnimateSettings(false);
		                if (!model.get("hasError")) {
		                    $("li").removeClass("highlight");
		                    self.SwitchDisplay(1);
		                    this.$('#textDefaultLocation').text(CurrentPreference.WarehouseDescription);
		                }
		            },
		            error: function (model, error, response) {
		                self.AnimateSettings(false);		                
		            }
		        });
		    } else {
		        $("li").removeClass("highlight");
		        self.SwitchDisplay(1);
		    }
		},

		WireEvents: function () {		    
		    var self = this;
		    Shared.AddRemoveHandler('#buttonCreatePreference', 'tap', function (e) { self.buttonCreatePreference_tap(e); });
		    Shared.AddRemoveHandler('#buttonMenu', 'tap', function (e) { self.buttonMenu_tap(e); });		    
		    Shared.AddRemoveHandler('#buttonBackCheckList', 'tap', function (e) { self.buttonBackCheckList_tap(e); });
		    Shared.AddRemoveHandler('#buttonBackFeaturePreference', 'tap', function (e) { self.buttonBackFeaturePreference_tap(e); });
		    Shared.AddRemoveHandler('#buttonDeleteWorkstationID', 'tap', function (e) { self.buttonDeletePreference_tap(e); });
		    Shared.AddRemoveHandler('#buttonOrder', 'tap', function (e) { self.buttonOrder_tap(e); });
		    Shared.AddRemoveHandler('#buttonInvoice', 'tap', function (e) { self.buttonInvoice_tap(e); });
		    Shared.AddRemoveHandler('#rowWorkstationId', 'tap', function (e) { self.rowWorkstationId_tap(e); });
		    Shared.AddRemoveHandler('#rowDefaultLocation', 'tap', function (e) { self.rowDefaultLocation_tap(e); });
		    Shared.AddRemoveHandler('#rowAdjustment', 'tap', function (e) { self.rowAdjustment_tap(e); });		    
		    Shared.AddRemoveHandler('#rowLabel', 'tap', function (e) { self.rowLabel_tap(e); });
		    Shared.AddRemoveHandler('#rowPack', 'tap', function (e) { self.rowPack_tap(e); });
		    Shared.AddRemoveHandler('#rowPhysicalInventory', 'tap', function (e) { self.rowPhysicalInventory_tap(e); });
		    Shared.AddRemoveHandler('#rowPick', 'tap', function (e) { self.rowPick_tap(e); });
		    Shared.AddRemoveHandler('#rowPrePack', 'tap', function (e) { self.rowPrePack_tap(e); });
		    Shared.AddRemoveHandler('#rowReceive', 'tap', function (e) { self.rowReceive_tap(e); });
		    Shared.AddRemoveHandler('#rowStock', 'tap', function (e) { self.rowStock_tap(e); });
		    Shared.AddRemoveHandler('#rowTransfer', 'tap', function (e) { self.rowTransfer_tap(e); });
		    Shared.AddRemoveHandler('#rowItemImage', 'tap', function (e) { self.rowItemImage_tap(e); });
		    Shared.AddRemoveHandler('#rowWebSite', 'tap', function (e) { self.rowWebSite_tap(e); });
            //Description
		    Shared.AddRemoveHandler('#descriptionAllowSkipItems', 'tap', function (e) { self.HideDescription("AllowSkipItems"); });
		    Shared.AddRemoveHandler('#descriptionAutoComplete', 'tap', function (e) { self.HideDescription("AutoComplete"); });
		    Shared.AddRemoveHandler('#descriptionAutoPrint', 'tap', function (e) { self.HideDescription("AutoPrint"); });
		    Shared.AddRemoveHandler('#descriptionBatchPick', 'tap', function (e) { self.HideDescription("BatchPick"); });
		    Shared.AddRemoveHandler('#descriptionEnable', 'tap', function (e) { self.HideDescription("Enable"); });
		    Shared.AddRemoveHandler('#descriptionPromptBinManager', 'tap', function (e) { self.HideDescription("PromptBinManager"); });
		    Shared.AddRemoveHandler('#descriptionPromptForQty', 'tap', function (e) { self.HideDescription("PromptForQty"); });
		    Shared.AddRemoveHandler('#descriptionQtyOnHand', 'tap', function (e) { self.HideDescription("QtyOnHand"); });
		    Shared.AddRemoveHandler('#descriptionQuickPack', 'tap', function (e) { self.HideDescription("QuickPack"); });
		    Shared.AddRemoveHandler('#descriptionSourceTransaction', 'tap', function (e) { self.HideDescription("SourceTransaction"); });
		    Shared.AddRemoveHandler('#descriptionUseCbeImage', 'tap', function (e) { self.HideDescription("UseCbeImage"); });
		    Shared.AddRemoveHandler('#descriptionWebSite', 'tap', function (e) { self.HideDescription("WebSite"); });
            Shared.AddRemoveHandler('#descriptionAutoPost', 'tap', function (e) { self.HideDescription("AutoPost"); });
		},

		WireCartItemEvents: function (listItemView) {
		    self = this;
		    Shared.AddRemoveHandler("." + listItemView.cid, "tap", function () { self.checkListItem_tap(listItemView) });
		},
		
	});
	return ConnectionView;
});