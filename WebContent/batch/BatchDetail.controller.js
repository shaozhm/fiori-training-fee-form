sap.ui.define([
	"sharedlib/controller/BaseController", 
    'sap/m/MessageBox',
	'sap/m/MessageToast',
	"sap/ui/core/routing/History",
	"sap/ui/Device",
	'sap/m/Toolbar',
	'sap/m/SearchField',
	'sap/m/Button',
	'sap/m/Text',
	'sap/m/Input',
	'sap/ui/core/Icon',
	'sap/m/ColumnListItem',
	"sap/ui/model/json/JSONModel",
	"sap/ui/unified/FileUploaderParameter",
	"sap/m/Column",
], function (Controller, MessageBox, MessageToast, History, Device, Toolbar, SearchField, Button, Text, Input,Icon, ColumnListItem, JSONModel, FileUploaderParameter, Column) {
	"use strict";

	return Controller.extend("com.sap.sdrive.ui.masterdata.batch.BatchDetail", {

		onInit: function () {
			this.handleUploadChange = this.handleUploadChange.bind(this);
			var oModel = new JSONModel({
				"tableData": [],
                "process":false,
                "forceStop":false,
				"processText":""
			});
			this.getView().setModel(oModel);
			this.getOwnerComponent().getRouter().getRoute("batchDetail").attachPatternMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function (oEvent) {
			var that = this;
			that._category = oEvent.getParameter("arguments").category;
			if(that._category === "9"){
				that.byId("locationLink").setVisible(true);
			}else{
				that.byId("locationLink").setVisible(false);
			}
			var settings = this.getOwnerComponent().getModel("settings").getData();
			var batchCategory = settings.batchCategory;
			var oData = this.getView().getModel().getData();
			oData.categoryInfo = batchCategory[this._category];
			this.categoryInfo = batchCategory[this._category];
			this.getView().getModel().setData(oData);
			this.clearTableData();
		},
		getI18NText: function (key) {
            var oResourceBundle = this.getModel("i18n").getResourceBundle();
            return oResourceBundle.getText(key);
        },
        setProcess:function(flag){
            var data = this.getView().getModel().getData();
            data.process = flag;
            data.processText = this.getI18NText("MESSAGE_NOW_PROCESS");
            this.getView().getModel().setData(data);
        },
        getProcess:function(){
            var data = this.getView().getModel().getData();
            return data.process;
        },
        setForceStop:function(flag){
            var data = this.getView().getModel().getData();
            data.forceStop = flag;
            this.getView().getModel().setData(data);
        },
        getForceStop:function(){
            var data = this.getView().getModel().getData();
            return data.forceStop;
        },
        setProcessText:function(processText){
            var data = this.getView().getModel().getData();
            data.processText = processText;
            this.getView().getModel().setData(data);
        },

		handleUploadComplete: function (oEvent) {
			var sResponse = oEvent.getParameter("response");
			if (sResponse) {
				var sMsg = "";
				var m = /^\[(\d\d\d)\]:(.*)$/.exec(sResponse);
				if (m[1] == "200") {
					sMsg = "Return Code: " + m[1] + "\n" + m[2] + "(Upload Success)";
					oEvent.getSource().setValue("");
				} else {
					sMsg = "Return Code: " + m[1] + "\n" + m[2] + "(Upload Error)";
				}
				MessageToast.show(sMsg);
			}
		},
		handleUploadChange: function (oEvent) {
			var that = this;
			var parameter = oEvent.getParameters();
			var file = parameter.files[0];
			var reader = new FileReader();
			var rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer
			reader.onload = function (e) {
				var data = e.target.result;
				if (!rABS) {
					data = new Uint8Array(data);
				}
				var workbook = XLSX.read(data, {
					type: rABS ? 'binary' : 'array'
				});
				var fileUploader = that.byId("fileUploader");
				fileUploader.clear();
				var Sheets = workbook.Sheets;
				var sheet;
				for (var i in Sheets) {
					sheet = Sheets[i];
				}
				var sheetData = XLSX.utils.sheet_to_json(sheet);
				sheetData.shift();
				var x = that.getView().getModel().getData().tableData;
				that.sheetData = sheetData;
				that.setTableData(x.concat(sheetData));

			};
			if (rABS) {
				reader.readAsBinaryString(file);
			} else {
				reader.readAsArrayBuffer(file);
			}
		},
		handleUploadPress: function (oEvent) {

		},
		handleDownloadPress: function () {
			var workbook = XLSX.utils.book_new();

			var categoryInfo = this.categoryInfo;
			var columnId = [];
			var columnName = [];
			for (var i in categoryInfo.column) {
				columnId.push(categoryInfo.column[i].id);
				columnName.push(categoryInfo.column[i].text);
			}
			var ws_data = [columnId, columnName];

            var data = this.getView().getModel().getData();
            var tableData = data.tableData;
            for(var i in tableData){
            	var row = [];
            	for(var j in columnId){
                    row.push(tableData[i][columnId[j]]);
				}
                ws_data.push(row);
			}


            var ws = XLSX.utils.aoa_to_sheet(ws_data);

			/* Add the worksheet to the workbook */
			XLSX.utils.book_append_sheet(workbook, ws, categoryInfo.name);

			XLSX.writeFile(workbook, categoryInfo.name + '.xlsx');
		},

		addNewItemPress : function(oEvent){
			this._saved = false;
			var that = this;
		    var batchDisplayTable = this.byId("batchDisplayTable");
		    var data = this.getView().getModel().getData();
        	var length =data.tableData.length;
        	var raw ={"_INDEX":length+1,"_STATUS":"","_STATUS_ICON":"pending","_STATUS_COLOR":"#b9b9b9"};
        	data.tableData.push(raw);

        	var itemObj = new ColumnListItem();
			itemObj.destroyCells();
			var categoryInfo = this.categoryInfo;
			var displayColumn = [
				{id:"_INDEX",text:this.getI18NText("LINE_NO"),hAlign:"Center"},
				{id:"_STATUS",text:this.getI18NText("PROCESS_STATUS"),hAlign:"Center"},
				{id:"_DELETE",text:this.getI18NText("DELETE"),hAlign:"Center"}
				];
			for(var i in categoryInfo.column){
				displayColumn.push(categoryInfo.column[i]);
			}
			for (var i in displayColumn) {
				if(displayColumn[i].id==="_STATUS"){
					itemObj.addCell(new Icon({
						src: "{= 'sap-icon://' + ${_STATUS_ICON} }",
						color: "{_STATUS_COLOR}",
						press: function(oEvent){
							var rowData = oEvent.getSource().getBindingContext().getProperty();
							switch (rowData._STATUS) {
								case "error":
									MessageBox.error(rowData._ERROR_MESSAGE, {styleClass: "sapUiSizeCompact"});
									break;
								default:
									MessageBox.success(that.getI18NText("MESSAGE_NO_WRONG_MESSAGE"), {styleClass: "sapUiSizeCompact"});
									break;
							}
						}
					}));
				}else if(displayColumn[i].id==="_DELETE"){
					itemObj.addCell(new Icon({
						src: "{= 'sap-icon://delete'}",
						press: function(oEvent){
							var deleteIndex = oEvent.oSource.oParent.mAggregations.cells[0].getProperty('value');
							that.deleteOnleTableLine(deleteIndex);
						}
					}));
				}else{
					itemObj.addCell(new Input({
					type:"Text",
					width:"100%",
						value: "{path:'" + displayColumn[i].id + "'}"
					}));
				}
			}
			batchDisplayTable.bindItems({path: "/tableData",template: itemObj});
			var oldText = that.byId("batchTitle").getText();
			var newText = oldText.substr(0,oldText.indexOf('(')+1)+(length+1)+")";
			that.byId("batchTitle").setText(newText);
			that.byId("batchTitle").setTooltip(newText);
		},
		clearTableData: function () {
			this.setTableData([]);
			var oldText = this.byId("batchTitle").getText();
			var newText = oldText.substr(0,oldText.indexOf('(')+1)+"0)";
			this.byId("batchTitle").setText(newText);
			this.byId("batchTitle").setTooltip(newText);
		},
		deleteOnleTableLine: function(lineNo) {
			var that = this;
		    var batchDisplayTable = this.byId("batchDisplayTable");
			var tableData = this.getView().getModel().getData().tableData;
			tableData.splice(lineNo-1,1);
			var i = 0;
			for(var j of tableData){
				j["_INDEX"] = i+1;
				i++;
			}
			var oldText = this.byId("batchTitle").getText();
			var newText = oldText.substr(0, oldText.indexOf('(') + 1) + (tableData.length) + ")";
			this.byId("batchTitle").setText(newText);
			this.byId("batchTitle").setTooltip(newText);

			this.setTableData(tableData);
			// if (this._saved) {
			// 	this.display_invalid_inputs();
			// }
		},
		refreshStatus:function(){
            var data = this.getView().getModel().getData();

            for(var i = 0; i<data.tableData.length;i++){
                switch (data.tableData[i]['_STATUS']) {
                    case "finish":
                        data.tableData[i]['_STATUS_ICON'] = 'accept';
                        data.tableData[i]['_STATUS_COLOR'] = '#4CAF50';
                        break;
                    case "process":
                        data.tableData[i]['_STATUS_ICON'] = 'navigation-right-arrow';
                        data.tableData[i]['_STATUS_COLOR'] = '#ffc107';
                        break;
                    case "error":
                        data.tableData[i]['_STATUS_ICON'] = 'message-error';
                        data.tableData[i]['_STATUS_COLOR'] = '#f44336';
                        break;
                    default:
                        data.tableData[i]['_STATUS_ICON'] = 'pending';
                        data.tableData[i]['_STATUS_COLOR'] = '#b9b9b9';
                        break;
                }
            }

            this.getView().getModel().setData(data);
		},
		setStatus:function(index,status,errorMessage){
            var data = this.getView().getModel().getData();
            data.tableData[index-1]['_STATUS'] = status;
            data.tableData[index-1]['_ERROR_MESSAGE'] = errorMessage;
            switch (status) {
                    case "finish":
                        data.tableData[index-1]['_STATUS_ICON'] = 'accept';
                        data.tableData[index-1]['_STATUS_COLOR'] = '#4CAF50';
                        break;
                    case "process":
                        data.tableData[index-1]['_STATUS_ICON'] = 'navigation-right-arrow';
                        data.tableData[index-1]['_STATUS_COLOR'] = '#ffc107';
                        break;
                    case "error":
                        data.tableData[index-1]['_STATUS_ICON'] = 'message-error';
                        data.tableData[index-1]['_STATUS_COLOR'] = '#f44336';
                        break;
                    default:
                        data.tableData[index-1]['_STATUS_ICON'] = 'pending';
                        data.tableData[index-1]['_STATUS_COLOR'] = '#b9b9b9';
                        break;
                }
            //this.getView().getModel().setData(data);
            //this.refreshStatus();
		},
		setTableData: function (sheetData) {
			var that = this;
			var batchDisplayTable = that.byId("batchDisplayTable");
			batchDisplayTable.destroyColumns();
			var data = that.getView().getModel().getData();
			data.tableData = sheetData;

			//补足字段
			for(var i = 0; i<data.tableData.length;i++){
                data.tableData[i]['_INDEX'] = i+1;
				data.tableData[i]['_STATUS'] = "";
				data.tableData[i]['_DELETE'] = "";
	            data.tableData[i]['_STATUS_ICON'] = 'pending';
                data.tableData[i]['_STATUS_COLOR'] = '#b9b9b9';
                // if(i===1){data.tableData[i]['_STATUS'] = "finish";}
                // if(i===2){data.tableData[i]['_STATUS'] = "process";}
                // if(i===3){data.tableData[i]['_STATUS'] = "error";}
                // switch (data.tableData[i]['_STATUS']) {
                //     case "finish":
                //         data.tableData[i]['_STATUS_ICON'] = 'accept';
                //         data.tableData[i]['_STATUS_COLOR'] = '#4CAF50';
                //     	break;
                //     case "process":
                //     	data.tableData[i]['_STATUS_ICON'] = 'navigation-right-arrow';
                //         data.tableData[i]['_STATUS_COLOR'] = '#ffc107';
                //     	break;
                //     case "error":
                //     	data.tableData[i]['_STATUS_ICON'] = 'message-error';
                //         data.tableData[i]['_STATUS_COLOR'] = '#f44336';
                //     break;
                //     default:
                //     	data.tableData[i]['_STATUS_ICON'] = 'pending';
                //         data.tableData[i]['_STATUS_COLOR'] = '#b9b9b9';
                //     break;
                // }
			}

            that.getView().getModel().setData(data);

			//that.refreshStatus();

			var itemObj = new ColumnListItem();
			itemObj.destroyCells();
			var categoryInfo = that.categoryInfo;
            var displayColumn = [
            	{id:"_INDEX",text:this.getI18NText("LINE_NO"),hAlign:"Center"},
				{id:"_STATUS",text:this.getI18NText("PROCESS_STATUS"),hAlign:"Center"},
				{id:"_DELETE",text:this.getI18NText("DELETE"),hAlign:"Center"}
                ];
			for(var i in categoryInfo.column){
                displayColumn.push(categoryInfo.column[i]);
			}
			for (var i in displayColumn) {
                batchDisplayTable.addColumn(new Column({
                    header: new Text({
                        text: displayColumn[i].text
                    }),
                    hAlign: displayColumn[i].hAlign
                }));
				if(displayColumn[i].id==="_STATUS"){
                    itemObj.addCell(new Icon({
                        src: "{= 'sap-icon://' + ${_STATUS_ICON} }",
                        color: "{_STATUS_COLOR}",
                        press: function(oEvent){
                        	var rowData = oEvent.getSource().getBindingContext().getProperty();
                        	switch (rowData._STATUS) {
                                case "error":
                                    MessageBox.error(rowData._ERROR_MESSAGE, {styleClass: "sapUiSizeCompact"});
                                    break;
                                default:
                                    MessageBox.success(that.getI18NText("MESSAGE_NO_WRONG_MESSAGE"), {styleClass: "sapUiSizeCompact"});
                                    break;
                            }
						}
                    }));
				}else if(displayColumn[i].id==="_DELETE"){
					itemObj.addCell(new Icon({
						src: "{= 'sap-icon://delete'}",
						press: function(oEvent){
							var deleteIndex = oEvent.oSource.oParent.mAggregations.cells[0].getProperty('value');
							that.deleteOnleTableLine(deleteIndex);
						}
					}));
				}else{
					itemObj.addCell(new Input({
						type:"Text",
						width:"100%",
							value: "{path:'" + displayColumn[i].id + "'}"
					}));
				}
			}
			batchDisplayTable.bindItems({
				path: "/tableData",
				template: itemObj
			});
		},
		forceStop:function(){
            this.setForceStop(true);
		},
		save: function () {
			this._saved = true;
			var that = this;
			var oData = this.getView().getModel().getData();
			var categoryInfo = oData.categoryInfo;
			var tableData = oData.tableData;
			// trim for each atrribute typeof string avoid user misinput
			var batchDisplayTable = this.byId("batchDisplayTable");

			if(tableData.length > 0){
				//var categoryInfo = that.categoryInfo;
				this.setProcess(true);
				var counter = 0;
				//var is_valid = true;
				var error_inputs = [];
				var correct_inputs = [];
				// if (tableData.length > 30) {
				// 	for (var obj of tableData) {
				// 		var is_valid_tmp = true;
				// 		for (var i in categoryInfo.column) {
				// 			if (!(categoryInfo.column[i].id in obj) || obj[categoryInfo.column[i].id].length === 0) {
                //     			is_valid_tmp = false;
                //     			break;
				// 			} else if (categoryInfo.column[i].id === "CREATED_ON" || categoryInfo.column[i].id === "BIRTH_DATE" 
				// 				|| categoryInfo.column[i].id === "GET_LICENSE_DATE" || categoryInfo.column[i].id === "LICENSE_VALID_FROM"
				// 				|| categoryInfo.column[i].id === "LICENSE_VALID_TO" || categoryInfo.column[i].id === "OP_CERT_VALID_FROM"
				// 				|| categoryInfo.column[i].id === "OP_CERT_VALID_TO" || categoryInfo.column[i].id === "PURCHASE_DATE"
				// 				|| categoryInfo.column[i].id === "DATE_TIME") {

				// 				var time_valid = /[1-2][0-9][0-9][0-9]((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3])([0-5][0-9]){2})?/;
				// 				if (!time_valid.test(obj[categoryInfo.column[i].id])) {
                //     				is_valid_tmp = false;
                //     				break;
				// 				}
				// 			}
				// 		}
				// 		if (is_valid_tmp) {
				// 			correct_inputs.push(obj);
				// 		} else {
				// 			//is_valid = false;
				// 			error_inputs.push(obj);
				// 		}
				// 	}
				// 	that.setTableData(error_inputs.concat(correct_inputs));
				// 	tableData = oData.tableData;
				// }

				// if (!that.display_invalid_inputs()) {
				// 	sap.m.MessageToast.show(that.getI18NText("MESSAGE_SAVE_FAILED"));
				// 	this.setProcess(false);
				// 	return;
				// }

				for(var obj of tableData){
					for(var key in obj){
						//console.log(key);
						if( (typeof obj[key] === "string") &&  obj[key].length > 0){
							obj[key] = obj[key].trim();
						}
					}
				}
				
				var startTime = new Date().getTime();
				$.ajax({
					type: "GET",
					async: false,
					url: "/xsjs/csrf.xsjs",
					contentType: "application/json",
					headers: {
						'x-csrf-token': 'Fetch',
						'Accept': "application/json"
					},
					success: function (data, textStatus, request) {
						var xsrf_token = request.getResponseHeader('x-csrf-token');
						var saveData = function (tableData) {
							if(that.getForceStop()){
								that.setForceStop(false);
								that.setProcess(false);
								return;
							}
							var limit = 100;
							var currentArray = [];
							var nextArray = [];
							if (tableData.length > limit) {
								currentArray = tableData.slice(0, limit);
								nextArray = tableData.slice(limit, tableData.length);
							} else {
								currentArray = tableData;
								nextArray = [];
							}
	
							for(var i in currentArray){
								 that.setStatus(currentArray[i]._INDEX,"process");
							}
							that.setProcessText(that.getI18NText("MESSAGE_PROCESS_REMAINING")+(currentArray.length+nextArray.length)+that.getI18NText("MESSAGE_RECORDS_NUM"));	
							$.ajax({
								url: "/xsjs/masterdata/batchImport.xsjs",
								method: 'POST',
								data: JSON.stringify({
									type: categoryInfo.id,
									data: currentArray
								}),
								contentType: "application/json",
								headers: {
									'x-csrf-token': xsrf_token,
									'Accept': "application/json"
								},
								success: function (result) {
	
									var message = "";
	
									if(result.SUCCESS===true){
	
	
										for(var i in result.DATA.response){
											 if(result.DATA.response[i].ERROR ){
												that.setStatus(result.DATA.response[i]._INDEX,"error",result.DATA.response[i].ERROR);
											  }else{
											  that.setStatus(result.DATA.response[i]._INDEX,"finish");
											  }
										}
	
	
	
										if(result.DATA && result.DATA.insert){
											message=message+that.getI18NText("MESSAGE_INSERT")+result.DATA.insert+that.getI18NText("MESSAGE_RECORDS_NUM")+";";	
										}if(result.DATA && result.DATA.update){
											message+=message+that.getI18NText("MESSAGE_UPDATE")+result.DATA.update+that.getI18NText("MESSAGE_RECORDS_NUM")+";";	
										}
	
	
										if (nextArray.length === 0) {
										// sap.ui.core.BusyIndicator.hide();
											message = message+that.getI18NText("MESSAGE_SAVE_COMPLETED");
											sap.m.MessageToast.show(message);
											that.setProcess(false);
										} else {
											message=message+that.getI18NText("MESSAGE_REMAINING")+nextArray.length+that.getI18NText("MESSAGE_RECORDS_NUM")+";";	
											sap.m.MessageToast.show(message);
											saveData(nextArray);
										}
	
										that.getOwnerComponent().getModel("DrivingSafety").refresh();
	
									}
									else{
	
										message = message+that.getI18NText("MESSAGE_SAVE_FAILED")+";";
	
										for(var i in currentArray){
											that.setStatus(currentArray[i]._INDEX,"error",that.getI18NText("MESSAGE_DATA_EXCEPTION"));
										}
	
										if(result.ERROR_MESSAGE){
											message = message+ result.ERROR_MESSAGE+";";
	
											if(result.ERROR_MESSAGE.startsWith("invalid DATE, TIME or TIMESTAMP value")){
													message = message+ that.getI18NText("MESSAGE_DATE_FORMAT_ERROR")+ "\n";
											}
										}
	
	
	
	
										sap.m.MessageToast.show(message);
										that.setProcess(false);
	
									}
	
								},
								error: function (error) {
									// sap.ui.core.BusyIndicator.hide();
									for(var i in currentArray){
										that.setStatus(currentArray[i]._INDEX,"error",that.getI18NText("MESSAGE_NETWORK_ERROR"));
									}
									sap.m.MessageToast.show(that.getI18NText("MESSAGE_SAVE_FAILED"));
									that.setProcess(false);
								}
							});
						};
						saveData(tableData);
					},
					error: function (error) {
						// sap.ui.core.BusyIndicator.hide();
						sap.m.MessageToast.show(that.getI18NText("MESSAGE_SAVE_FAILED"));
						that.setProcess(false);
					}
				});
			} else {
				sap.m.MessageToast.show(that.getI18NText("MESSAGE_UPLOAD_BEFORE_SAVE"));
			}
		},
		examine_growing_elements : function() {
			if (!this._saved) {
				return;
			}
			var oData = this.getView().getModel().getData();
			var categoryInfo_length = oData.categoryInfo.column.length;
			var invalid_input_found = false;
			var batchDisplayTable = this.byId("batchDisplayTable");
			var threshold = batchDisplayTable.getGrowingThreshold();

			if (batchDisplayTable.mAggregations.items.length > threshold) {
				for (var i = 3; i < categoryInfo_length + 3; i++) {
					if(batchDisplayTable.mAggregations.items[threshold - 1].mAggregations.cells[i].getValueState() === "Error") {
						invalid_input_found = true;
						break;
					}
				}

				if (!invalid_input_found) {
					return;
				}

			// 	this.display_invalid_inputs();
			// } else {
			// 	this.display_invalid_inputs();
			}

		},
		display_invalid_inputs : function(){
			var that = this;
			var oData = this.getView().getModel().getData();
			var categoryInfo = oData.categoryInfo;
			var tableData = oData.tableData;
			var batchDisplayTable = this.byId("batchDisplayTable");
			var counter = 0;
			var is_valid = true;

			for (var obj of tableData) {
				var counter_j = 0;
				for (var i in categoryInfo.column) {
					if (!(categoryInfo.column[i].id in obj) || obj[categoryInfo.column[i].id].length === 0) {
						is_valid = false;
						if (batchDisplayTable.mAggregations.items[counter] === undefined) {
							continue;
						}
                    	batchDisplayTable.mAggregations.items[counter].getCells()[counter_j + 3].setValueStateText(that.getI18NText("MESSAGE_INPUT_VALUE_NOT_EMTPTY"));
                    	batchDisplayTable.mAggregations.items[counter].getCells()[counter_j + 3].setValueState(sap.ui.core.ValueState.Error);
					} else if (categoryInfo.column[i].id === "CREATED_ON" || categoryInfo.column[i].id === "BIRTH_DATE" 
						|| categoryInfo.column[i].id === "GET_LICENSE_DATE" || categoryInfo.column[i].id === "LICENSE_VALID_FROM"
						|| categoryInfo.column[i].id === "LICENSE_VALID_TO" || categoryInfo.column[i].id === "OP_CERT_VALID_FROM"
						|| categoryInfo.column[i].id === "OP_CERT_VALID_TO" || categoryInfo.column[i].id === "PURCHASE_DATE"
						|| categoryInfo.column[i].id === "DATE_TIME") {

						var time_valid = /[1-2][0-9][0-9][0-9]((0[1-9])|(1[0-2]))((0[1-9])|([1-2][0-9])|(3[0-1]))(([0-1][0-9])|(2[0-3])([0-5][0-9]){2})?/;
						if (!time_valid.test(obj[categoryInfo.column[i].id])) {
							is_valid = false;
							batchDisplayTable.mAggregations.items[counter].getCells()[counter_j + 3].setValueStateText(that.getI18NText("MESSAGE_DATE_FORMAT_ERROR"));
                    		batchDisplayTable.mAggregations.items[counter].getCells()[counter_j + 3].setValueState(sap.ui.core.ValueState.Error);
						}
					}
					counter_j++;
				}
				counter++;
			}
			return is_valid;
		} 
	
	});

}, /* bExport= */ true);