define([
    'toastr',
    'collection/cart',
    'view/base/progress',
    'view/common/enum',
    'view/common/global',    
    'view/common/preference',    
], function (Toastr,
    CartCollection,
    ProgressView,
    Enum, Global, CurrentPreference) {
    var Shared = {
            AddRemoveHandler: function (id, event, func) {
                $(id).hammer().off(event,func);
                $(id).hammer().on(event, func);
            },
            
            BeepError: function () {
                var snd = new Audio("beepError.wav");
                snd.play();
            },

		    BeepSuccess: function () {
		        var snd = new Audio("beepSuccess.wav");
		        snd.play();
		    },

		    ConvertNullToEmptyString: function (string) {
		        if (string == null) {
		            string = "";
		        }
		        return string;
		    },

		    CompareVersion: function (version1, version2, comparer, checkRevision) {
		        var major1 = version1.Major;
		        var minor1 = version1.Minor;
		        // var build1 = version1.Build;
		        // var revision1 = version1.Revision;

		        var major2 = version2.Major;
		        var minor2 = version2.Minor;
		        // var build2 = version2.Build;
		        // var revision2 = version2.Revision;

		        switch (comparer) {
		            case Enum.CompareVersion.Equal:
		                if (major1 == major2 && minor1 == minor2) {
		                    if (checkRevision) {
		                        return (revision1 == revision2);
		                    }
		                    return true;
		                }
		                break;
		            case Enum.CompareVersion.GreaterThanOrEqual:
		                return (Shared.CompareVersion(version1, version2, Enum.CompareVersion.GreaterThan, checkRevision)
                                    || Shared.CompareVersion(version1, version2, Enum.CompareVersion.Equal, checkRevision))
		                break;
		            case Enum.CompareVersion.LessThanOrEqual:
		                return (Shared.CompareVersion(version1, version2, Enum.CompareVersion.LessThan, checkRevision)
                                    || Shared.CompareVersion(version1, version2, Enum.CompareVersion.Equal, checkRevision))
		                break;
		            case Enum.CompareVersion.GreaterThan:
		                if ((major1 > major2)
		                || (major1 >= major2 && minor1 > minor2)) {
		                    return true;
		                }
                        else {
		                  return (major1 >= major2 && minor1 >= minor2);
		                }
		                break;
		            case Enum.CompareVersion.LessThan:
		                if ((major1 < major2)
		                || (major1 <= major2 && minor1 < minor2)) {
		                    return true;
		                }
                        else {
		                     return (major1 <= major2 && minor1 <= minor2);
		                }
		                //if (major1 <= major2 && minor1 <= minor2 && build1 < build2)) {
		                //    if (checkRevision) {
		                //        return (major1 <= major2 && minor1 <= minor2 && build1 <= build2 && revision1 < revision2);
		                //    }
		                //    return true;
		                //}
		                break;
		            case Enum.CompareVersion.NotEqual:
		                return (!Shared.CompareVersion(version1, version2, Enum.CompareVersion.Equal, checkRevision));
		                break;
		        }

		        return false;
		    },

		    ChangeItemQuantity: function (item, qty, lookupMode, type) {
		        var maxQty = 0; 
		        var qtyScanned = 0; 
		        var allowMoreThanMax = false;

		        if (item) {
		            switch (lookupMode) {
		                case Enum.LookupMode.Receive:
		                    maxQty = item.get('QuantityToScan');
		                    qtyScanned = item.get('QuantityScanned');
		                    allowMoreThanMax = true;
		                    break;
		                case Enum.LookupMode.Stock:
		                    if (Global.StockMode == "StockFromGRN") {
		                        maxQty = item.get('QuantityReceived');
		                    }
		                    qtyScanned = item.get('QuantityScanned');
		                    break;
		                case Enum.LookupMode.StockTakeMiscPhys:
		                    qtyScanned = item.get('Quantity');
		                    break;
		                case Enum.LookupMode.StockTakeItemCount:
		                case Enum.LookupMode.Adjustment:
		                    qtyScanned = item.get('CurrentQuantity');
		                    break;
		                case Enum.LookupMode.Transfer:
		                    qtyScanned = item.get('QuantityScanned');
		                    break;
		            }
		        }

		        if (!(maxQty == 0) && !allowMoreThanMax) { if (qty > maxQty) qty = maxQty; }
		        var newQty = qtyScanned + qty;		        
		        if (!(maxQty == 0) && allowMoreThanMax && (newQty > maxQty)) { maxQty = newQty; }	        

		        switch (type)
		        {
		            case "add":
		                if (!(maxQty == 0)) {
		                    if (newQty > maxQty) {
		                        var qtyLeft = maxQty - qtyScanned;

		                        item.set({
		                            Quantity: maxQty,
		                            QuantityScanned: maxQty,
		                        });
		                        return qtyLeft;
		                    }
		                    else {
		                        item.set({
		                            Quantity: newQty,
		                            QuantityScanned: newQty,
		                        });
		                        return qty;
		                    }
		                }
		                else {
		                    if (lookupMode == Enum.LookupMode.StockTakeMiscPhys ||
                                lookupMode == Enum.LookupMode.StockTakeItemCount ||
                                lookupMode == Enum.LookupMode.Adjustment) {

		                        if (newQty == 0) newQty = 1;

		                        item.set({
		                            CurrentQuantity: newQty,
		                            Quantity: newQty,
		                        })
		                        return newQty;
		                    }
		                    else {
		                        item.set({
		                            Quantity: newQty,
		                            QuantityScanned: newQty,
		                        });
		                        return qty;
		                    }
		                }
		                break;
                    case "replace":
                        if (!(maxQty == 0)) {
                            if (qty > maxQty) {
                                item.set({
                                    Quantity: maxQty,
                                    QuantityScanned: maxQty,
                                });
                                return maxQty;
                            }
                            else {
                                item.set({
                                    Quantity: qty,
                                    QuantityScanned: qty
                                });
                                qty -= qtyScanned;
                                return qty;
                            }
                        }
                        else {
                            item.set({
                                Quantity: qty,
                                QuantityScanned: qty
                            });
                            if (lookupMode == Enum.LookupMode.StockTakeMiscPhys ||
                                lookupMode == Enum.LookupMode.Adjustment) {
                                item.set({
                                    CurrentQuantity: qty,
                                    Quantity: qty,
                                })
                            }
                            else {
                                qty -= qtyScanned;
                            }
                            return qty;
                        }
		        }
		    },

		    Focus: function (controlName) {
		        setTimeout(function () { $(controlName).focus(); }, 800);
		    },
		    
		    FormatDate : function(theDate, format){				
				return moment(theDate).format(format);
		    },

		    FindItem: function (cartCollection, criteria, unitMeasureCodeCriteria, lineNumCriteria) {
		        criteria = criteria.toLowerCase();

		        return cartCollection.find(function (cartItem) {
		            var unitMeasureCode = cartItem.get("UnitMeasureCode");
		            var upcCode = cartItem.get("UPCCode"); 		            
		            var lineNum = cartItem.get("LineNum");
		            if (upcCode) {
		                upcCode = upcCode.toLowerCase();
		                if (upcCode == criteria && unitMeasureCode == unitMeasureCodeCriteria) {
		                	//checks if not undefined or null
		                	if (lineNumCriteria != null) {
		                		if (lineNum == lineNumCriteria) return true;
		                	} else {
		                		return true;
		                	}
		                }
		            }		            
		            
		            var itemCode = cartItem.get("ItemCode");
		            if (itemCode) {
		                itemCode = itemCode.toLowerCase();
		                if (itemCode == criteria && unitMeasureCode == unitMeasureCodeCriteria) {
		                	if (lineNumCriteria != null) {
		                		if (lineNum == lineNumCriteria) return true;
		                	} else {
		                		return true;
		                	}
		                }
		            }

		            var itemName = cartItem.get("ItemName");
		            if (itemName) {
		                itemName = itemName.toLowerCase();
		                if (itemName == criteria && unitMeasureCode == unitMeasureCodeCriteria) {
		                	if (lineNumCriteria != null) {
		                		if (lineNum == lineNumCriteria) return true;
		                	} else {
		                		return true;
		                	}
		                }
		            }
		        });
		    },

		    FindItems: function (collection, criteria) {
		        if (collection && collection.length > 0) {
		            newCollection = new CartCollection();

		            collection.each(function (item) {

		                if (criteria != undefined && criteria != null) criteria = criteria.toLowerCase();

		                var upcCode = item.get("UPCCode");
		                if (upcCode) {
		                    upcCode = upcCode.toLowerCase();
		                    if (upcCode == criteria) newCollection.add(item);
		                }

		                var itemCode = item.get("ItemCode");
		                if (itemCode) {
		                    itemCode = itemCode.toLowerCase();
		                    if (itemCode == criteria) newCollection.add(item);
		                }

		                var itemName = item.get("ItemName");
		                if (itemName && criteria) {
		                    criteria = criteria.toLowerCase();
		                    itemName = itemName.toLowerCase();
		                    if (itemName == criteria) newCollection.add(item);
		                }

		                if (Global.IsPrePackMode) {
		                    var trackNo = item.get("TrackingNumber");
		                    if (trackNo) {
		                        trackNo = trackNo.toLowerCase();
		                        if (trackNo == criteria) newCollection.add(item);
		                    }
		                }
		            });

		            return newCollection;
		        }
		        return null;
		    },

		    GetVersionAttributes: function (_version) {
		        var _versionAttr = { Major: 0, Minor: 0, Build: 0, Interim: 0 };
		        if (!_version) return _versionAttr;
		        _version = _version + "."
		        var _dot = 0;
		        var _val = "0";
		        var _numbers = "0123456789";
		        var _curr = "";
		        for (var i = 0; i < _version.length ; i++) {
		            _curr = _version.substr(i, 1);
		            if (_curr == ".") {
		                _dot = _dot + 1;
		                if (_dot == 1) _versionAttr.Major = parseFloat(_val); //MAJOR
		                if (_dot == 2) _versionAttr.Minor = parseFloat(_val); //MINOR
		                if (_dot == 3) _versionAttr.Build = parseFloat(_val); //BUILD
		                if (_dot == 4) _versionAttr.Interim = parseFloat(_val); //INTERIM
		                _val = "0";
		            } else {
		                if (_numbers.indexOf(_curr) > -1) {
		                    _val = _val + _curr;
		                }
		            }
		        }
		        return _versionAttr;
		    },

		    GetImageUrl: function (type, fileName) {
		        switch (type) {
		            case Enum.ImageType.Label:
		                return Global.ServiceUrl + "Images/Labels/" + fileName;
		            case Enum.ImageType.ReceiveLabel:
		                return Global.ServiceUrl + "Images/Receive/" + fileName;
		            case Enum.ImageType.CartItem:
		                if (CurrentPreference.UseCbeImage) return CurrentPreference.WebSiteURL + "/images/product/icon/" + fileName;
		                else return Global.ServiceUrl + "Images/Items/Icon/" + fileName;
		                break;
		            case Enum.ImageType.Card:
		                if (CurrentPreference.UseCbeImage) return CurrentPreference.WebSiteURL + "/images/product/medium/" + fileName;
		                else return Global.ServiceUrl + "Images/Items/Medium/" + fileName;		                
		        }
		    },

		    HighLightItem: function (cid, template) {
		        switch (template) {
		            case "CheckList":
		                $("td").removeClass("highlight");
		                $("i").removeClass("icon-ok");
		                $("." + cid).addClass("highlight");
		                $("#icon" + cid).addClass("icon-ok icon-2x");
		                break;
		            default:
		                $("td").removeClass("highlight");
		                $("." + cid).addClass("highlight");
		                break;
		        }
		    },		    

		    LoadPinchiScroll: function (myScroll, featureID) {
		        if (myScroll) {
		            myScroll.refresh();
		            return myScroll;
		        }
		        else {
		            return new IScroll(featureID, {		                
		                zoom: true,
		                scrollX: true,
		                scrollY: true,
		                mouseWheel: true,
		                wheelAction: 'zoom'
		            });
		        }
		    },

		    LoadiScroll: function (myScroll, featureID) {
		        var contentID = '#containerTable' + featureID;

		        if (myScroll) {
		            myScroll.refresh();
		            return myScroll;
		        }
		        else {
		            return new IScroll(contentID, { scrollY: true, scrollbars: true, });
		        }
		    },

		    LoadHorizontaliScroll: function (controlBody, myScroll) {
		        if (myScroll) {		            
		            myScroll.refresh();
		            return myScroll;
		        }
		        else {
		            return new IScroll(controlBody, {
		                snap: true,		                
		                scrollbars: false,
		                bounce: false,
		                bounceLock: true,
		                scrollY: false,
		                scrollX: true });
		        }
		    },

		    LoadImage: function (containerID, imgSrc, imgAlt, onLoadCallBack) {
		        var imgContainer = document.getElementById(containerID);
		        if (imgContainer) {
		            var img = document.createElement("img");
		            img.addEventListener("load", onLoadCallBack, false);
		            imgContainer.innerHTML = "";
		            imgContainer.appendChild(img);
		            img.setAttribute("src", imgSrc);
		            img.setAttribute("alt", imgAlt);
		        }
		    },

		    NotifyError: function (title, message) {
		        Toastr.options = {
		            "closeButton": true,
		            "debug": false,
		            "positionClass": "toast-top-full-width",
		            "onclick": null,
		            "showDuration": "300",
		            "hideDuration": "1000",
		            "timeOut": "3000",
		            "extendedTimeOut": "1000",
		            "showEasing": "swing",
		            "hideEasing": "linear",
		            "showMethod": "fadeIn",
		            "hideMethod": "fadeOut"
		        }

		        Toastr.error(title,message);
		    },

			 NotifyErrorWithDuration: function (message, duration) {
		        Toastr.options = {
		            "closeButton": true,
		            "debug": false,
		            "positionClass": "toast-top-full-width",
		            "onclick": null,
		            "showDuration": duration,
		            "hideDuration": "2000",
		            "timeOut": "3000",
		            "extendedTimeOut": "1000",
		            "showEasing": "swing",
		            "hideEasing": "linear",
		            "showMethod": "fadeIn",
		            "hideMethod": "fadeOut"
		        }

		        Toastr.error(message);
		    },


		    RemoveBinFromItem: function (itemModel, binCodeDeleted, binCollection, isDeleteAll) {
		        switch (Global.ApplicationType) {
		            case "Stock":
		            case "Receive":
		                if (itemModel && itemModel.length > 0) {
		                    newCollection = new CartCollection();

		                    if (isDeleteAll) {
		                        itemModel.each(function (item) {
		                            item.set({
		                                BinLocationCode: 0,
		                                BinLocationName: "No Bin"
		                            });
		                        });
		                    }
		                    else {
		                        itemModel.each(function (item) {
		                            var binCode = item.get("BinLocationCode");
		                            if (binCode) {
		                                if (binCode == binCodeDeleted) {
		                                    if (binCollection && binCollection.length > 1) {
		                                        item.set({
		                                            BinLocationCode: binCollection.models[0].get('BinLocationCode'),
		                                            BinLocationName: binCollection.models[0].get('BinLocationName')
		                                        });
		                                    }
		                                    else {
		                                        item.set({
		                                            BinLocationCode: 0,
		                                            BinLocationName: "No Bin"
		                                        });
		                                    }
		                                }
		                            }
		                        });
		                    }
		                }
		                break;
		            case "Pick":
		                if (itemModel) {
		                    var binCode = itemModel.get("BinLocationCode");
		                    if (!isDeleteAll) {
		                        if (binCode == binCodeDeleted) {
		                            if (binCollection && binCollection.length > 1) {
		                                itemModel.set({
		                                    BinLocationCode: binCollection.models[1].get('BinLocationCode'),
		                                    BinLocationName: binCollection.models[1].get('BinLocationName')
		                                });
		                            }
		                            else {
		                                itemModel.set({
		                                    BinLocationCode: 0,
		                                    BinLocationName: "No Bin"
		                                });
		                            }
		                        }
		                    }
		                    else {
		                        itemModel.set({
		                            BinLocationCode: 0,
		                            BinLocationName: "No Bin"
		                        });
		                    }
		                }
		                break;
		        }

		    },

		    RemoveCheckedItems: function (collection, mode) {
		        var TapeItemID = "";

		        switch (mode) {
		            case "BinManager":
		                TapeItemID = "BinItemID";
		                break;
		            case "Box":
		                TapeItemID = "BoxID";
		                break;
		            default:
		                TapeItemID = "TapeItemID";
		                break;
		        }

		        collection.each(function (item) {
		            item.set({ IsChecked: false });
		            $('#itemRow' + item.get(TapeItemID)).removeClass('icon-remove icon-1h');
		            $('#itemRow' + item.get(TapeItemID)).text(item.get('RowNumber'));
		            $('.' + item.get(TapeItemID) + '-itemcol-1').removeClass("background-danger");
		            $('#slideFooter').removeClass("slideInUpFooter").addClass("slideOutDownFooter");
		        });
		    },
		    
		    ShowProgress: function (progressControl, isAnimate, container, isFullScreen) {
		        if (isAnimate) {
		            if (progressControl == null) {
		                progressControl = new ProgressView();
		                $("#" + container).append(progressControl.render());
		            }

		            progressControl.ShowProgres(isFullScreen);
		        }
		        else {
		            if (progressControl != null) progressControl.HideProgress();
		        }

		        return progressControl;
		    },

		    ShowRemoveFooter: function (collection, mode) {
		        var hasCheckedItem = false;
		        var slider = "";
		        var button = "";

		        switch (mode) {
		            case "BinManager":
		                slider = "#binSlideFooter";
		                break;
		            case "slideFooterBox":
		            	slider = "#slideFooterBox";
		            	button = "#buttonCancelRemoveItemsBox"
		            	break;
		            default:
		            	slider = "#slideFooter"
		                button = "#buttonCancelRemoveItems"
		                break;
		        }

		        collection.each(function (item) {
		            if (item.get("IsChecked")) hasCheckedItem = true;
		        });

		        if (hasCheckedItem) $(slider).removeClass("slideOutDownFooter").addClass("slideInUpFooter");
		        else $(slider).removeClass("slideInUpFooter").addClass("slideOutDownFooter");
		        //arrow button doesnt show sometimes
		        $(button).css("display","none").height();
		        $(button).css("display","inline-block");
		        $(button).css("float","left");
		    },

		    SlideX: function (id, position) {
		        $(id).css("transform", "translateX(" + position + "px)");
		    },

		    ToggleItemCheck: function (itemModel, mode) {
		        var TapeItemID = "";

		        switch(mode) {
		            case "BinManager":
		                TapeItemID = "BinItemID";
		                break;
		            case "Box":
		                TapeItemID = "BoxID";
		                break;
		            default:
		                TapeItemID = "TapeItemID";
		                break;
		        }
		        
		        var isChecked = $('#itemRow' + itemModel.get(TapeItemID)).hasClass('icon-remove icon-1h');

		        if (isChecked) {
		            $('#itemRow' + itemModel.get(TapeItemID)).removeClass('icon-remove icon-1h');
		            $('#itemRow' + itemModel.get(TapeItemID)).text(itemModel.get('RowNumber'));
		            $('.' + itemModel.get(TapeItemID) + '-itemcol-1').removeClass("background-danger");
		            itemModel.set({ IsChecked: false });
		        } else {
		            $('#itemRow' + itemModel.get(TapeItemID)).addClass('icon-remove icon-1h');
		            $('#itemRow' + itemModel.get(TapeItemID)).text('');
		            $('.' + itemModel.get(TapeItemID) + '-itemcol-1').addClass("background-danger");
		            itemModel.set({ IsChecked: true });
		        }
		    },
            
		    FlipY: function (id, degree) {
		        $(id).css("-webkit-transform", "rotateY(" + degree + "deg)");
		    },
            
		    ValidateVersion: function (serverVersionString, patchVersionString, minPatchVersion14String) {
		        if (serverVersionString == null || serverVersionString == "") {
		            navigator.notification.alert("Can not determine server version. Please check if you are connecting to a valid server.", null, "Unable to login", "OK");		            
		        }

		        var serverVersion = this.ConvertToVersion(serverVersionString);
		      
		        //Check for minimum version
		        if (Shared.CompareVersion(serverVersion, Global.Versions.MinimumVersion, Enum.CompareVersion.GreaterThanOrEqual, false)) {
                    //Check for compatible version
		            if (Shared.CompareVersion(Global.Versions.Version, serverVersion, Enum.CompareVersion.GreaterThanOrEqual, false)) {
		                //Check for v14
                        if (serverVersionString == Global.Version14) {
		                    //Check for the right patch version
		                    var patchVersion = this.ConvertToVersion(patchVersionString);
		                    var minPatchVersion14 = this.ConvertToVersion(minPatchVersion14String);
		                    if (minPatchVersion14String && Shared.CompareVersion(patchVersion, minPatchVersion14, Enum.CompareVersion.GreaterThanOrEqual, false)) {

		                        this.SetCurrentVersion(serverVersion);
		                        return true;
		                    }
		                    else {
		                        navigator.notification.alert("Although Connected Warehouse supports v14, a patch is required before you can use this app. Please contact support for more details.", null, "Patch is required.");
		                        return false;
		                    }
		                }
                        else {
                            this.SetCurrentVersion(serverVersion);
		                    return true;
		                }
		            }
		            else {
		                navigator.notification.alert("You are connecting to an incompatible server. Please check if you are connecting to the right server.", null, "Unable to login", "OK");		                
		            }
		        }
		        else {
		            navigator.notification.alert("Server version '" + serverVersionString + "' is not supported", null, "Unable to login", "OK");		            
		        }

		        return false;
		    },

		    ConvertToVersion: function(versionString) {		        
		        var version = { Major: 0, Minor: 0, Build: 0, Revision: 0 }

		        if (versionString) {
		            versionString = versionString.split(".");
		            if (versionString.length > 0) version.Major = parseInt(versionString[0]);
		            if (versionString.length > 1) version.Minor = parseInt(versionString[1]);
		            if (versionString.length > 2) version.Build = parseInt(versionString[2])
		            if (versionString.length > 3) version.Revision = parseInt(versionString[3]);
		        }               

		        return version;
		    },

		    SetCurrentVersion: function (serverVersion) {
		        Global.Versions.CurrentVersion.Major = serverVersion.Major;
		        Global.Versions.CurrentVersion.Minor = serverVersion.Minor;
		        Global.Versions.CurrentVersion.Build = serverVersion.Build;
		        Global.Versions.CurrentVersion.Revision = serverVersion.Revision;
		    },

		    EnableChildControls: function (containerID) {
		        this.SetChildControlState(containerID, true);
		    },

		    DisableChildControls: function (containerID) {
		        this.SetChildControlState(containerID, false);
		    },

		    SetChildControlState: function (containerID, isEnabled) {
		        $(containerID).find("input, textarea, button, select").attr("disabled", !isEnabled);
		    },

		    SetVisibilityToVisible: function(elementID) {
		        $(elementID).css("visibility", "visible"); 
		    },

		    SetVisibilityToHidden: function(elementID) {
		        $(elementID).css("visibility", "hidden");
		    }
		}
				
		return Shared;	
	}
);