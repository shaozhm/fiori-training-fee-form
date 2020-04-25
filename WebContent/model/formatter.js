sap.ui.define([], function () {
    "use strict";

    return {
        formatCarState: function(val){
            if(val>99){
                return 'Error';
            } else if(val>50){
                return 'Warning'
            } else{
                return 'Success'
            }
        },
        formatDriveStatus: function(val){
            if(val == 'warning'){
                return 'Warning'
            } else if(val == 'default'){
                return 'Success'
            } else if(val == 'alert'){
                return 'Error'
            }
        }
    };

});