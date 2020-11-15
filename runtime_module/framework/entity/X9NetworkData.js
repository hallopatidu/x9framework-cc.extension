var X9NetworkData = cc.Class({
    statics:{
        TOKEN_KEY: '__token__',
    },

    /**
     * Lấy character id từ URL
     */
    // getCharacterIDFromURL() {
    //     let id, token;
    //     if (cc.sys.isBrowser) {
    //         let searchParams = new URLSearchParams(location.search);
    //         token = searchParams.get("i");
    //         if(token){
    //             let base64Url = token.split('.')[1];
    //             let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    //             let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    //                 return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    //             }).join(''));
    //             // Verify
    //             // if(KJUR){
    //             //     var isValid = KJUR.jws.JWS.verify(jsonPayload, "x9.guru.1M$$$", ["HS256"]);
    //             //     cc.log('>>>> Charid ::  ' + id + ' valid: ' + isValid);
    //             // }
    //             // Save token
    //             let buf = new ArrayBuffer(jsonPayload.length*2); // 2 bytes for each char
    //             let bufView = new Uint16Array(buf);
    //             for (var i=0, strLen=jsonPayload.length; i < strLen; i++) {
    //                 bufView[i] = str.charCodeAt(i);
    //             }
    //             this._jwtToken = buf;
    //             // 
    //             let payloadObj = JSON.parse(jsonPayload);
    //             id = payloadObj.charId;
    //             //
    //             cc.log('parse token:: ' + String.fromCharCode.apply(null, new Uint16Array(this._jwtToken)))
    //             //
                
    //         }else if(CC_DEBUG){
    //             id = searchParams.get("id");
    //         }
    //         //
    //         id = parseInt(id);
    //         if (id == NaN) return null;
    //     }
    //     return id;
    // },

    getURLParams(key){
        return new URLSearchParams(location.search).get(key);
    },

    /**
     * 
     * @param {*} tokenKey 
     */
    setToken(tokenKey){
        let classPrototype = this.constructor.prototype;
        classPrototype.__$request = classPrototype.__$request ? classPrototype.__$request : classPrototype.request;
        classPrototype.request = function(url, data, token){
            let requestToken = token ? token : tokenKey;
            return this.__$request(url, data, requestToken);
        }
    },
    

    /**
     * 
     * @param {*} url 
     * @param {*} data 
     */
    request(url, data, token) {        
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = ()=>{
                // this._httpStatus = xhr.status;
                if (xhr.readyState == 4) {
                    if(xhr.status >= 200 && xhr.status < 400){
                        let response = xhr.responseText;
                        resolve(response);
                    }else{
                        reject(url);
                    }
                }
            };
            xhr.onerror = ()=>{
                reject(url);
            } ;
            
            xhr.open( (data ? 'POST' : 'GET'), url, true );
            xhr.setRequestHeader("Content-type", "application/json");
            if(token){
                CC_DEBUG && cc.log(this.uuid + ' Request with Token:: ' + token);
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
            data ? xhr.send(JSON.stringify(data)) : xhr.send();
            
        });
    },

    

})