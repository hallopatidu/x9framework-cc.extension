
const X9Command = require('X9Cmd');

var X9NetworkCommand = cc.Class({

    /**
     * 
     * @param {*} url 
     * @param {*} data 
     */
    request(url, data, token) {
        // if(this.serviceURL && (this.serviceURL.length > 4)){
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = ()=>{
                // this._httpStatus = xhr.status;
                if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status < 400)) {
                    var response = xhr.responseText;
                    resolve(response);
                }else{
                    reject();
                }
                // this._httpStatus = -1;
            };
            xhr.onerror = ()=>{
                reject();
                // this._httpStatus = -1;
            } ;
            xhr.open("POST", url, true);
            // xhr.open("GET", url, true);
            xhr.setRequestHeader("Content-type", "application/json");
            if(token){
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
            // Nếu muốn bổ sung Header thì kế thừa class này và viết lại.
            xhr.send(JSON.stringify(data));
            // this._httpStatus = 0;
        });
        // }
        //        
        // return new Promise((resolve) => {resolve(data)});        
    },

})