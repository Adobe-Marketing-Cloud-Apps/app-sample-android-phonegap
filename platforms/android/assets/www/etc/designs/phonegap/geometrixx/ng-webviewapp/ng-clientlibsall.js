/*************************************************************************
*
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright 2016 Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by trade secret or copyright law.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/

;(function() {

    'use strict';

    // ---- polyfills --- //
    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }

    if (!Object.assign) {
        Object.defineProperty(Object, 'assign', {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function(target) {
                if (target === undefined || target === null) {
                    throw new TypeError('Cannot convert first argument to object');
                }

                var to = Object(target);
                for (var i = 1; i < arguments.length; i++) {
                    var nextSource = arguments[i];
                    if (nextSource === undefined || nextSource === null) {
                        continue;
                    }
                    nextSource = Object(nextSource);

                    var keysArray = Object.keys(Object(nextSource));
                    for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                        var nextKey = keysArray[nextIndex];
                        var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                        if (desc !== undefined && desc.enumerable) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
                return to;
            }
        });
    }

})();

/**
 * The cq namespace.
 *
 * @namespace cq
 * @since 1.0
 */
var cq = window.cq || {};

/**
 * The cq.mobileapps namespace.
 *
 * @namespace cq.mobileapps
 * @since 1.0
 */
cq.mobileapps = cq.mobileapps || {};

/**
 * The cq.mobileapps.auth namespace provides classes that can be used to authenticate
 * againt a AEM instance.
 *
 * @namespace cq.mobileapps.auth
 * @since 1.0
 */
cq.mobileapps.auth = cq.mobileapps.auth || {};

/**
 * The cq.mobileapps.provider namespace.
 *
 * @namespace cq.mobileapps.provider
 * @since 1.0
 */
cq.mobileapps.provider = cq.mobileapps.provider || {};

/**
 * The cq.mobileapps.targeting namespace.
 *
 * @namespace cq.mobileapps.targeting
 * @since 1.0
 */
cq.mobileapps.targeting = cq.mobileapps.targeting || {};
;(function(ns) {
    'use strict';

    /**
     * The cq.mobileapps.util namespace provides utility functions.
     *
     * @namespace cq.mobileapps.util
     */
    ns.util = ns.util || (function(undefined) {

        /**
         * Iterates over the object's properties and generate a query string from the properties of the object.  The
         * query string's key and value will be encoded.
         *
         * @param {object} obj - the object literal.
         * @returns {string} a string in the format of key1=value1&key2=value2.
         *
         * @alias param
         * @memberof! cq.mobileapps.util
         */
        function _param(obj) {
            var r20 = /%20/g;

            return Object.keys(obj).map(function(k) {
                return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
            }).join("&").replace(r20, "+");
        }

        /**
         * Encode the input string into a Base64 encoded value and return it.
         * @param {string} input the string to encode
         * @returns {string} a Base64 encoded string.
         *
         * @alias base64Encode
         * @memberof! cq.mobileapps.util
         */
        function _base64Encode( input ) {
            return window.btoa(input);
        }

        /**
         * Decode the input string from a Base64 string to a non encode string.
         * @param {string} input the string to decode
         * @returns {string} a non encoded string.
         *
         * @alias base64Decode
         * @memberof! cq.mobileapps.util
         */
        function _base64Decode( input ) {
            return window.atob(input);
        }

        return {
            param: _param,
            base64Encode: _base64Encode,
            base64Decode: _base64Decode
        };

    })();

})(cq.mobileapps);
;(function(ns, undefined) {
    'use strict';

    /**
     * The cq.mobileapps.util.file namespace provides utility functions for loading JSON
     * and HTML content.
     *
     * @namespace cq.mobileapps.util.file
     */
    ns.util.file = ns.util.file || (function(undefined) {

            /** @private */
            function _getAbsolutePath(path) {
                var currentLocation = window.location.href;
                var indexOfWWW = currentLocation.indexOf('/www/');
                if (indexOfWWW !== -1) {
                    return currentLocation.substring(0, indexOfWWW + 5) + path;
                }
                return null;
            }

            /** @private */
            function _loadFile(path, callback, requestHeaders) {
                var url = _getAbsolutePath(path);
                if (url === null) {
                    callback("Unable to resolve file path: " + path);
                    return;
                }

                var request = new XMLHttpRequest();
                request.open('GET', url, true);

                // Set request headers if they have been provided
                if (requestHeaders !== null &&
                    typeof requestHeaders === "object") {
                    for (var property in requestHeaders) {
                        if (requestHeaders.hasOwnProperty(property)) {
                            request.setRequestHeader(property, requestHeaders[property]);
                        }
                    }
                }

                request.onload = function () {
                    if ((request.status >= 200 && request.status < 400) || request.status === 0) {
                        // Success
                        return callback(null, request.responseText);
                    } else {
                        // We reached our target server, but it returned an error
                        return callback('Request to url: [' + url + '] returned status: [' + request.status + '].');
                    }
                };

                request.onerror = function () {
                    // There was a connection error of some sort
                    return callback('Request to url: [' + url + '] resulted in a connection error.');
                };

                request.send();
            }

            /**
             * Load the JSON content specified by the path and call the callback with the resulting data.
             * If the data can not be parsed the value returned will be an empty object.
             *
             * @param {string} path
             * @param {cq.mobileapps.util.file~fetchJSONCallback} callback - The callback function
             *
             * @alias fetchJSON
             * @memberof! cq.mobileapps.util.file
             */
            function _fetchJSON(path, callback) {
                _loadFile(path, function (error, data) {
                    if (error) {
                        console.error("Unable to load " + path + " from the location " + _getAbsolutePath(path));
                        callback(error);
                    } else {
                        var json = {};
                        try {
                            json = JSON.parse(data);
                        } catch (e) {
                            console.warn("unable to parse the data from loading " + _getAbsolutePath(path));
                        }

                        callback(null, json);
                    }
                });
            }

            /**
             * Load the HTML content specified by the path and call the callback with the resulting data.
             *
             * @param {string} path
             * @param {cq.mobileapps.util.file~fetchHTMLCallback} callback - The callback function
             *
             * @memberof! cq.mobileapps.util.file
             * @alias fetchHTML
             */
            function _fetchHTML(path, callback) {
                _loadFile(path, function (error, data) {
                    if (error) {
                        console.error("Unable to load " + path + " from the location " + _getAbsolutePath(path));
                        callback(error);
                    } else {
                        callback(null, data);
                    }
                });
            }

            return {
                fetchJSON: _fetchJSON,
                fetchHTML: _fetchHTML
            };

            /**
             * @callback cq.mobileapps.util.file~fetchJSONCallback
             * @param {string} error - If there was a problem loading the JSON.
             * @param {object} data - the JSON data.
             */

            /**
             * @callback cq.mobileapps.util.file~fetchHTMLCallback
             * @param {string} error - If there was a problem loading the HTML.
             * @param {object} data - the HTML data.
             */
        })();

})(cq.mobileapps);

;(function(window, ns, undefined) {

    'use strict';

    /**
     * The base object for different authorization schemes to extends.  For
     * example OAuth and Basic auth should extend the Auth class.
     *
     * @param {string} server - the aem server url.  Most cases this should point to your publish AEM instance.
     * @param {string} token - a previously obtained token to associate with this Auth class.
     *
     * @class
     * @memberof! cq.mobileapps.auth
     * @since 1.0
     */
    function Auth(server, token) {
        var _token;
        var _server;

        if (server) {
            if (!/^https?:\/\//i.test(server)) {
                throw Error("Please specify the protocol for your host. [http | https]");
            }

            if (server.charAt(server.length - 1) !== '/') {
                server = server + '/';
            }
        } else {
            throw Error("Server url must not be empty");
        }

        _server = server;
        _token = token;

        this._getServer = function() {
            return _server;
        };

        this._getToken = function() {
            return _token;
        };

        this._setToken = function(token) {
            _token = token;
        };
    }

    /**
     * Return the AEM server url.
     * @returns {string} the server url.
     * @since 1.0
     */
    Auth.prototype.getServer = function() {
        return this._getServer();
    };

    /**
     * @callback cq.mobileapps.auth.Auth~getTokenCallback
     * @param {int} error - If there was a problem obtaining the token.
     * @param {string} token - The token
     */

    /**
     * Return the authorized token.
     *
     * @param {cq.mobileapps.auth.Auth~getTokenCallback} callback - The callback function
     *
     * @since 1.0
     */
    Auth.prototype.getToken = function(callback) {
        callback(null, this._getToken());
    };

    /**
     * Set the token that was generated when the user was authenticated.
     * @param {string} token - the authentication token.
     * @since 1.0
     */
    Auth.prototype.setToken = function(token) {
        this._setToken(token);
    };

    /**
     * The authorize function must be overridden by subclasses and provide authentication for the
     * user. The results of the authorization must call setToken() with the authentication token.
     * @param {cq.mobileapps.auth.Auth~authorizeCallback} callback - The callback function
     * @since 1.0
     * @abstract
     */
    Auth.prototype.authorize = function(callback) {
        throw Error("Subclasses must override authorize");
    };


    /**
     * @callback cq.mobileapps.auth.Auth~authorizeCallback
     * @param {int} error - If there was a problem authenticating with the server
     * the error param will contain the error code.
     */

    ns.Auth = Auth;

})(this, cq.mobileapps.auth);



;(function(ns, undefined) {

    'use strict';

    var AEM_AUTHORIZE_URL = 'oauth/authorize',
        AEM_TOKEN_URL     = 'oauth/token',
        authWindow;

    var LOCAL_STORAGE = {
        ACCESS_TOKEN :  'access_token',
        REFRESH_TOKEN : 'refresh_token',
        EXPIRES_AT :    'expires_at'
    };

    /**
     * Authenticate against the AEM server instance by using OAuth.
     *
     * @param {object} params
     * @param {string} params.server - the aem server url.  Most cases this should point to your publish AEM instance.
     * @param {string} params.client_id - the oAuth client id value
     * @param {string} params.client_secret - the oAuth client secret value
     * @param {string} params.redirect_uri - the url to be redirected to after authentication
     * @param {string} params.loadstop - an optional callback that is invoked when the in app window has finished loading
     * the login page.
     *
     * @class
     * @augments cq.mobileapps.auth.Auth
     * @memberof cq.mobileapps.auth
     * @since 1.0
     */
    function OAuth(params) {

        if (!params.server) {
            throw Error("Missing mandatory server parameter");
        }

        if (!params.client_id) {
            throw Error("Missing mandatory client_id parameter");
        }

        if (!params.redirect_uri) {
            throw Error("Missing mandatory redirect_uri parameter");
        }

        if (!params.client_secret) {
            throw Error("Missing mandatory client_secret parameter");
        }

        ns.Auth.call(this, params.server);

        this._clientId     = params.client_id;
        this._clientSecret = params.client_secret;
        this._redirectURI  = params.redirect_uri;
        this._loadstop     = params.loadstop;
    }

    OAuth.prototype = Object.create(ns.Auth.prototype);
    OAuth.prototype.constructor = OAuth;

    /**
     * @private
     */
    function _setToken(token) {
        /* jshint validthis: true */
        if (token === null) {
            localStorage.removeItem(LOCAL_STORAGE.ACCESS_TOKEN);
            localStorage.removeItem(LOCAL_STORAGE.REFRESH_TOKEN);
            localStorage.removeItem(LOCAL_STORAGE.EXPIRES_AT);

            this.setToken(null);
        } else {
            localStorage.setItem(LOCAL_STORAGE.ACCESS_TOKEN, token.access_token);

            // when you call to refresh a token the refresh token is not provided again
            if (token.refresh_token) {
                localStorage.setItem(LOCAL_STORAGE.REFRESH_TOKEN, token.refresh_token);
            }

            // Calculate exactly when the token will expire, then subtract one minute to give ourselves a small buffer.
            var now = new Date().getTime();
            var expiresAt = now + parseInt(token.expires_in, 10) * 1000 - 60000;
            localStorage.setItem(LOCAL_STORAGE.EXPIRES_AT, expiresAt);
            this.setToken(token.access_token);
        }
    }

    /**
     * Authenticate against the AEM OAuth server with the client id and client secrete.
     *
     * @param {cq.mobileapps.auth.Auth~authorizeCallback} callback - The callback function
     *
     * @since 1.0
     */
    OAuth.prototype.authorize = function(callback) {

        var refreshToken = localStorage.getItem(LOCAL_STORAGE.REFRESH_TOKEN);

        // if we have a refresh token then try to use it
        if (refreshToken) {
            this.getToken(function(error, token) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, token);
                }
            });
        } else {
            /* jshint validthis: true */
            var self = this;

            var urlParams = cq.mobileapps.util.param({
                client_id: this._clientId,
                scope: 'profile offline_access',
                redirect_uri: this._redirectURI,
                response_type: 'code'
            });

            // if we have a code we can now exchange the authorization code for an access token
            var authorizationExchange = function(code) {
                var params = cq.mobileapps.util.param({
                    code: code[1],
                    client_id: self._clientId,
                    client_secret: self._clientSecret,
                    redirect_uri: self._redirectURI,
                    grant_type: 'authorization_code'
                });

                var xhr = new XMLHttpRequest();
                xhr.open("POST", self.getServer() + AEM_TOKEN_URL);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");

                xhr.onreadystatechange = function () {
                    if (xhr.readyState < 4) {
                        return;
                    }

                    // response is complete check the status
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200 && xhr.status < 300) {
                            var response = xhr.responseText;
                            try {
                                var token = JSON.parse(response);
                                _setToken.call(self, token);
                                callback(null, token);
                            } catch (error) {
                                console.error(error.message);
                                callback(ERROR.AUTH_RESPONSE_ERR);
                            }
                        } else {
                            console.error(xhr.responseText);
                            callback(ERROR.GENERAL_ERR);
                        }
                    } else {
                        console.error(xhr.responseText);
                        callback(ERROR.GENERAL_ERR);
                    }
                };

                xhr.send(params);

            };

            var loadStartListener = function(e) {
                var url = e.url;
                var code  = /[\?&]code=(.+)[&]|[\?&]code=(.+)/.exec(url);
                var error = /[\?&]error=(.+)[&]|[\?&]error=(.+)/.exec(url);

                // if we have a code or error we can close the window
                if (code || error) {
                    authWindow.close();

                    if (code) {
                        authorizationExchange(code);
                    }

                    if (error) {
                        var cause = error[1];
                        if (cause && cause.indexOf('access_denied') === 0) {
                            callback(ERROR.GRANT_PERMISSION_ERR);
                        } else {
                            callback(ERROR.GENERAL_ERR);
                        }
                    }
                }
            };

            var exitWindowListener = function(e) {
                authWindow.removeEventListener();
            };

            var loadStopListener = function(e) {
                if (this._loadstop && typeof this._loadstop === 'function') {
                    this._loadstop();
                }
                authWindow.show();
            };

            var loadErrorHandler = function(e) {
                // 102 is a "Frame load interrupted" can be caused when using custom schemes as the redirect
                // 101 is unable to load the page due to a custom scheme but not having Custom-URL-scheme plugin
                //  installed in the app, both of these errors identify a redirect has occurred
                // -1004 can occur if the redirect contained a page that the app could not load like a redirect
                // however if someone were to set a invalid server url this would still fire a 1004 which isn't
                // ideal.  this code will die when we move to SchemeHandlers in the near future
                if (e.code === 102 || e.code === 101 || e.code === -1004) {
                    // ignore
                } else {
                    callback(ERROR.COMMUNICATION_ERR);
                }
            };

            var url = this.getServer() + AEM_AUTHORIZE_URL + "?" + urlParams;
            var windowParams = 'location=no,clearsessioncache=yes,clearcache=yes,hidden=yes';

            authWindow = window.open(url, '_blank', windowParams);
            authWindow.addEventListener('loadstart', loadStartListener);
            authWindow.addEventListener('exit', exitWindowListener);
            authWindow.addEventListener('loadstop', loadStopListener.bind(this));
            authWindow.addEventListener('loaderror', loadErrorHandler.bind(this));
        }
    };

    /**
     * @inheritdoc
     */
    OAuth.prototype.getToken = function(callback) {
        var self = this;

        var refreshToken = localStorage.getItem(LOCAL_STORAGE.REFRESH_TOKEN);
        var expiresTime  = localStorage.getItem(LOCAL_STORAGE.EXPIRES_AT);

        var now = new Date().getTime();

        if (now < expiresTime) {
            callback(null, localStorage.getItem(LOCAL_STORAGE.ACCESS_TOKEN));
        } else if (refreshToken) {
            var params = cq.mobileapps.util.param({
                client_id: this._clientId,
                client_secret: this._clientSecret,
                redirect_uri: this._redirectURI,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            });

            // The token is expired, but we can get a new one with a refresh token
            var xhr = new XMLHttpRequest();
            xhr.open("POST", self.getServer() + AEM_TOKEN_URL);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 && xhr.status < 300) {
                        var response = xhr.responseText;
                        try {
                            var token = JSON.parse(response);
                            _setToken.call(self, token);
                            callback(null, token);
                        } catch (error) {
                            console.error(error.message);
                            callback(ERROR.AUTH_RESPONSE_ERR);
                        }
                    } else {
                        console.error("Unable to communicate with AEM server to refresh the token");
                        callback(ERROR.COMMUNICATION_ERR);
                    }
                }
            };
            xhr.send(params);
        } else {
            callback(null, null);
        }
    };


    /**
     * The OAuth logout clear the tokens from storage forcing the user to re-authenticate.
     *
     * @param {cq.mobileapps.auth.Auth~authorizeCallback} callback - The callback function.
     *
     * @since 1.0
     */
    OAuth.prototype.logout = function(callback) {
        /* jshint validthis: true */
        _setToken.call(this, null);

        if (callback && typeof callback === 'function') {
            callback(null);
        }
    };

    /**
     * Error object that contains the error codes if there is authentication issues.
     *
     * @namespace
     */
    OAuth.ERROR_STATE = {
        /**
         * <code>COMMUNICATION_ERR</code> error can occur when there are issues connecting
         * to the OAuth server.
         */
        COMMUNICATION_ERR : 1,

        /**
         * <code>GRANT_PERMISSION_ERR</code> error can occur when the user denies access
         * to the profile information from the OAuth server.
         */
        GRANT_PERMISSION_ERR : 2,

        /**
         * <code>AUTH_RESPONSE_ERR</code> error can occur if the server's authorization response
         * can not be parsed into a valid format.
         */
        AUTH_RESPONSE_ERR : 3,

        /**
         * <code>GENERAL_ERR</code> error is a catch all error if something occurs which
         * is unknown.
         */
        GENERAL_ERR: 4
    };

    /**
     * Alias the ERROR STATE.
     * @private
     */
    var ERROR = OAuth.ERROR_STATE;

    ns.OAuth = OAuth;

})(cq.mobileapps.auth);
;(function(ns, util, undefined) {

    'use strict';

    var LOGIN_URL = 'j_security_check',
        LOGOUT_URL = 'system/sling/logout';

    /**
     * BasicAuth constructor used to configure a basic authentication connection to the specified AEM server.
     *
     *
     * @param {object} params
     * @param {string} params.server - the server to authenticate against
     * @param {string} params.username - the user's name
     * @param {string} params.password - the user's password
     * @param {string=} params.token - an existing authentication token
     * @param {string=} params.resource - the AEM resource to logout against
     *
     * @class
     * @augments cq.mobileapps.auth.Auth
     * @memberof! cq.mobileapps.auth
     * @since 1.0
     */
    function BasicAuth(params) {
        if (!params.token) {
            if (!params.username) {
                throw Error("Missing mandatory username parameter");
            }
            if (!params.password) {
                throw Error("Missing mandatory password parameter");
            }
        }
        if (!params.server) {
            throw Error("Missing mandatory server parameter");
        }

        ns.Auth.call(this, params.server, params.token);

        if (params.resource) {
            this._resource = params.resource ? '?resource=' + params.resource : '';
        }

        this._username = params.username;
        this._password = params.password;
    }

    function _setToken(token) {
        /* jshint validthis: true */
        if (token) {
            if (typeof token === "object") {
                this.setToken(util.base64Encode(token.username + ':' + token.password));
            } else {
                this.setToken(token);
            }
        } else {
            this.setToken(null);
        }
    }

    /**
     * Authorize against the AEM server.
     *
     * @param {cq.mobileapps.auth.Auth~authorizeCallback} callback - The callback function
     *
     * @instance
     * @memberof cq.mobileapps.auth.BasicAuth
     * @alias authorize
     * @since 1.0
     */
    function authorize(callback) {
        /* jshint validthis: true */
        var self = this,
            server = this.getServer(),
            data = cq.mobileapps.util.param({
                _charset_ : 'utf-8',
                j_validate: 'true',
                j_username: this._username,
                j_password: this._password
            });

        var xhr = new XMLHttpRequest();
        xhr.open("POST", server + LOGIN_URL);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");

        xhr.onreadystatechange = function () {

            if (xhr.readyState < 4) {
                // we're not ready yet
                return;
            }

            // response is complete check the status
            if (xhr.readyState === 4) {
                if (xhr.status === 200 && xhr.status < 300) {
                    _setToken.call(self, {
                        'username': self._username,
                        'password': self._password
                    });
                    callback(null);
                }
                else if (xhr.status === 403) {
                    callback(ERROR.ACCESS_DENIED);
                } else if (xhr.status === 0) {
                    // server could be shutdown or no network connection
                    callback(ERROR.COMMUNICATION_ERR);
                } else {
                    callback(ERROR.GENERAL_ERR);
                }
            }
        };

        xhr.send(data);
    }

    /**
     * call the AEM logout url and remove all tokens that have
     * been set.
     * @param {cq.mobileapps.auth.Auth~authorizeCallback} callback - The callback function
     *
     * @since 1.0
     */
    function logout(callback) {
        /* jshint validthis: true */
        var self = this;
        var url = this.getServer() + LOGOUT_URL + (this._resource || "");

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);

        xhr.onreadystatechange = function() {
            if (xhr.readyState < 4) {
                return;
            }

            // response is complete check the status
            if (xhr.readyState === 4) {
                if (xhr.status === 200 && xhr.status < 300) {
                    _setToken.call(self, null);
                    callback();
                } else {
                    callback(ERROR.LOGOUT_ERR);
                }
            }
        };

        xhr.send();
    }

    BasicAuth.prototype = Object.create(ns.Auth.prototype);
    BasicAuth.prototype.constructor = BasicAuth;

    BasicAuth.prototype.authorize = authorize;
    BasicAuth.prototype.logout = logout;

    /**
     * Error object that contains the error codes if there is authentication issues.
     *
     * @namespace
     */
    BasicAuth.ERROR = {
        /**
         * <code>COMMUNICATION_ERR</code> error can occur when there are issues connecting
         * to the server.
         */
        COMMUNICATION_ERR : 1,

        /**
         * <code>ACCESS_DENIED</code> error can occur when the username or password are invalid.
         */
        ACCESS_DENIED : 2,

        /**
         * <code>GENERAL_ERR</code> error is a catch all error if something occurs which is unknown.
         */
        GENERAL_ERR: 3,

        /**
         * <code>LOGOUT_ERR</code> error is when there was an issue attempting to logout.
         */
        LOGOUT_ERR: 4,
    };

    /**
     * Alias the ERROR STATE.
     * @private
     */
    var ERROR = BasicAuth.ERROR;

    ns.BasicAuth = BasicAuth;

})(cq.mobileapps.auth, cq.mobileapps.util);
;(function(window, ns, undefined) {
    'use strict';

    var targetLoadSuccessHandler = function(offer, callback) {
        var offerResult = ns.util.parse(offer);

        if (offerResult) {
            if (offerResult.defaultOffer === true) {
                // don't need to do anything the offer is the default offer
                if (callback && typeof callback === 'function') {
                    //console.log("default offer was issued");
                    callback(null);
                }
            } else {
                //console.log("Load custom offer from local file system: " + path);

                var self = this;
                cq.mobileapps.util.file.fetchHTML(offerResult.contentPath,
                    function (error, fragment) {
                        if (error) {
                            callback(ERROR.UNABLE_TO_LOAD_CONTENT);
                            return;
                        }

                        if (self._el) {
                            while (self._el.firstChild) {
                                self._el.removeChild(self._el.firstChild);
                            }
                        }

                        var offerWrapper = document.createElement('div');
                        offerWrapper.innerHTML = fragment;
                        self._el.appendChild(offerWrapper);

                        if (callback && typeof callback === 'function') {
                            callback();
                        }

                    }
                );
            }
        } else {
            if (callback && typeof callback === 'function') {
                callback(ERROR.OFFER_PARSE_ERROR);
            }
        }
    };

    var targetLoadFailureHandler = function(callback) {
        if (callback && typeof callback === 'function') {
            callback(ERROR.TARGET_ERROR);
        }
    };

    /**
     * Constructor to create an instance of the Target class.  A instance must be associated with a mboxId,
     * a parent element that will contain the injected offer, and optional mapping configuration that will be used
     * to remap the parameters prior to sending to the Target server.
     *
     * @param {string} mboxId - the id of the mbox
     * @param {string} el - the element in the dom which to insert the offer into.
     * @param {object=} mapping - the mapping instructions used to remap the parameters.
     *
     * @class
     * @memberof cq.mobileapps.targeting
     * @since 1.0
     */
    function Target(mboxId, el, mapping) {
        this._mboxId = mboxId;
        this._el = el;
        this._mapping = mapping;
    }

    /**
     * Send a request to the Target server and load the offer into the element that the instance
     * was configured with.  Prior to making the call to the Target service attempt to map the parameters
     * against the configured mapping if one was provided.
     *
     * @param {object} parameters - the parameters to be sent to target
     * @param {cq.mobileapps.targeting.Target~targetLoadRequest} callback
     *
     * @since 1.0
     */
    Target.prototype.targetLoadRequest = function(parameters, callback) {
        var self = this;
        if (this._mapping) {
            parameters = ns.util.map(this._mapping, parameters);
        }
        window.ADB.targetLoadRequest(
            function(offer) {
                targetLoadSuccessHandler.call(self, offer, callback);
            },
            function() {
                targetLoadFailureHandler.call(self, callback);
            },
            this._mboxId,
            null,
            parameters);
    };


    /**
     * @callback cq.mobileapps.targeting.Target~targetLoadRequest
     * @param {int} error - If there was a problem with the target request.
     */

    /**
     * Error object that contains the error codes that can occur.
     * @namespace
     */
    Target.ERROR = {
        /**
         * <code>TARGET_ERROR</code> can be caused when.
         * @constant
         */
        TARGET_ERROR : 1,

        /**
         * <code>OFFER_PARSE_ERROR</code> is thrown when
         */
        OFFER_PARSE_ERROR: 2,

        /**
         * <code>UNABLE_TO_LOAD_CONTENT</code> can be thrown when the content being requested
         * doesn't exist on the device.
         */
        UNABLE_TO_LOAD_CONTENT: 3
    };

    /**
     * Alias the ERROR STATE.
     * @private
     */
    var ERROR = Target.ERROR;

    ns.Target = Target;

})(window, cq.mobileapps.targeting);
/**
 * @namespace cq.mobileapps.targeting
 */
cq.mobileapps.targeting.util = (function(undefined) {
    'use strict';

    /**
     * Return an object that defines the content path and the mboxId associated with the offer if one exists.  If the
     * offer is the default offer, the property <code>defaultOffer</code> is set to true; otherwise it is false.
     *
     * If there was a problem parsing the response, null is returned.
     *
     * The format which are supported for parsing for offers are:
     *
     * <p>&lt;script type='text/javascript'&gt;CQ_Analytics.TestTarget.pull('{content.path}','{mbox.name}');&lt/script&gt;</p>
     *
     * and the case where the default offer is returned in the format of: <br>
     * For 6.1 SP3:
     * <p>&lt;script type='text/javascript'&gt;CQ_Analytics.TestTarget.signalDefaultOffer('{mbox.name}');&lt/script&gt;</p>
     *
     * For 6.2 <br>
     * <p>&lt;script type='text/javascript'&gt;CQ_Analytics.TestTarget.signalDefaultOffer('{mbox.name}','1.0.0');&lt/script&gt;</p>
     *
     * @param offer
     *
     * @return the offer if it contains a call back in the format of
     *
     * <pre>{{
     *  contentPath: string,
     *  mboxId: string,
     *  defaultOffer: false | true
     * }}
     * </pre>
     *
     *
     */
     function _parse(offer) {
        var regex = /pull\('([^,]*)','([^,]*)'/;
        var results = regex.exec(offer);

        if (!results || results.length !== 3) {

            // do we have a default offer?
            var defaultRegex = /signalDefaultOffer\(\'(.+)'\)/;
            var defaultResults = defaultRegex.exec(offer);

            if (defaultResults !== null) {
                return {
                    defaultOffer: true,
                    mboxId: defaultResults[1]
                };
            }

            return null;
        }

        return {
            defaultOffer: false,
            contentPath: results[1],
            mboxId: results[2]        
        };

    }

    function _map(mapping, data) {
        var result = {};
        for (var prop in data) {
            var value,
                property;

            if (mapping.hasOwnProperty(prop)) {
                var obj = mapping[prop];
                if (typeof obj === 'object' &&
                    obj.property &&
                    obj.transformer &&
                    typeof obj.transformer === 'function') {

                    property = obj.property;
                    var transFunc = obj.transformer;
                    var rawValue = data[prop];
                    try {
                        value = transFunc(rawValue);
                    } catch(e) {
                        console.error("Transformer threw an error, going to continue... " + e);
                        continue;
                    }

                } else {
                    value = data[prop];
                    property = mapping[prop];
                }

                // add the property to the result
                Object.defineProperty(result, property, {
                    value: value + "",
                    writable: false,
                    enumerable: true
                });
            }
        }

        return result;

    }

    return {
        parse: _parse,
        map: _map
    };

})();
;(function(ns, undefined) {

    "use strict";

    /**
     * Base class for all providers.
     *
     * @class
     * @memberof cq.mobileapps.provider
     * @since 1.0
     */
    function Provider() {
    }

    /**
     * Abstract method that all provider need to implement.
     *
     * @abstract
     * @param {cq.mobileapps.provider.Provider~fetchCallback} callback - The callback function
     * @since 1.0
     */
    Provider.prototype.fetch = function(callback) {
        throw Error("The provider failed to implement fetch");
    };

    ns.Provider = Provider;

    /**
     * @callback cq.mobileapps.provider.Provider~fetchCallback
     * @param {number} error - If an error occurs the value of error will be set
     * @param {object} data - the provider's data
     */

})(cq.mobileapps.provider);
;(function(ns, undefined) {

    "use strict";

    /**
     * Base class for all profile providers.
     *
     * @class
     * @memberof cq.mobileapps.provider
     * @since 1.0
     */
    function ProfileProvider(auth) {
        var _auth = auth;

        this._getAuth = function() {
            return _auth;
        };
    }

    /**
     * Classes that extend ProfileProvider must specify if they accept the type of authentication type
     * specified by the parameter auth.
     *
     * @param {cq.mobileapps.auth.Auth} auth - instance of a class that extends cq.mobileapps.auth.Auth
     *
     * @abstract
     * @since 1.0
     */
    ProfileProvider.accepts = function(auth) {
        return false;
    };

    /**
     * Return the instance of cq.mobileapps.auth.Auth that was set with the ProfileProvider.
     *
     * @since 1.0
     */
    ProfileProvider.prototype.getAuth = function() {
        return this._getAuth();
    };

    ns.ProfileProvider = ProfileProvider;

})(cq.mobileapps.provider);
;(function(ns, undefined) {

    "use strict";

    /**
     * The cq.mobileapps.provider.ProfileProviderRegistry provides instances of cq.mobileapps.profile.ProfileProvider
     * a way to register themselves to a specific authorization type.  For example an instance of cq.mobileapps.auth.OAuth
     * would have a ProfileProvider that knows how to obtain user profile information using oauth.  The same goes
     * for BasicAuth where there is an associated cq.mobileapps.profile.ProfileProvider that knows how to obtain user
     * information using Basic authentication.
     *
     * Additional ProfileProviders can be added and will be called if the provider supports the authentication type.
     *
     * @name ProfileProviderRegistry
     * @memberof cq.mobileapps.provider
     */
    ns.ProfileProviderRegistry = (function() {

        var providers = [];

        return {

            register: function(provider) {
                providers.push(provider);
            },

            getProvider: function(auth) {
                for (var i = 0; providers.length; i++) {
                    var Provider = providers[i];
                    if (Provider.accepts(auth)) {
                        return new Provider(auth);
                    }
                }
                return null;
            }

        };

    })();

})(cq.mobileapps.provider);
;(function(ns, undefined) {

    "use strict";

    var PROFILE_URL = 'libs/granite/security/currentuser.json?props=profile/*';

    /**
     * BasicAuthUserProfileProvider provides information about the current user.
     *
     * @class
     * @augments cq.mobileapps.provider.ProfileProvider
     * @memberof cq.mobileapps.provider
     * @since 1.0
     */
    function BasicAuthUserProfileProvider(auth) {
        ns.ProfileProvider.call(this, auth);
    }

    BasicAuthUserProfileProvider.prototype = Object.create(ns.ProfileProvider.prototype);
    BasicAuthUserProfileProvider.prototype.constructor = BasicAuthUserProfileProvider;

    /**
     * Retrieves the user profile information from the server.
     *
     * @override
     * @since 1.0
     */
    BasicAuthUserProfileProvider.prototype.fetch = function(callback) {
        var self = this;

        this.getAuth().getToken(function(error, token) {
            if (error) {
                console.error("Error fetching profile data due to error code " + error);
                throw Error("You must be authenticated priory to making a request");
            } else {
                var url = self.getAuth().getServer() + PROFILE_URL;

                var oReq = new XMLHttpRequest();
                oReq.open("GET", url);
                oReq.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                oReq.setRequestHeader('Authorization', 'Basic ' + token);

                oReq.addEventListener('load', function(e) {

                    if (oReq.status !== 200) {
                        if (oReq.status === 401) {
                            callback(ERROR.UNAUTHORIZED);
                        } else {
                            callback(ERROR.PROFILE_ERROR);
                        }
                        return;
                    }

                    var profile,
                        userProfile;

                    if (typeof oReq.responseText === 'string') {
                        profile = JSON.parse(oReq.responseText);
                        userProfile = profile.profile;

                        // if the profile property exists then use it otherwise return the raw result
                        if (profile.hasOwnProperty('profile')) {
                            if (profile.hasOwnProperty('home') && !userProfile.hasOwnProperty('home')) {
                                // remap the home property to match that of the oauth path property to be
                                // consistent with the variable name
                                userProfile.path = profile.home + '/profile';
                            }
                        }
                    } else {
                        console.log("Profile response was not text therefore we generated a profile error");
                        callback(ERROR.PROFILE_ERROR);
                    }

                    callback(null, userProfile);
                });

                oReq.addEventListener('error', function(e) {
                    console.log("Failed to request " + url, oReq.responseText);
                    callback(ERROR.PROFILE_ERROR);
                });

                oReq.send();
            }
        });



    };

    BasicAuthUserProfileProvider.ERROR_STATE = {
        /**
         * <code>COMMUNICATION_ERR</code> error can occur when there are issues connecting
         * to the server.
         */
        COMMUNICATION_ERR : 1,

        /**
         * <code>PROFILE_ERROR</code> general error if and error occurs attempting to
         * retrieve the profile information.
         */
        PROFILE_ERROR : 2,

        /**
         * If the user has not been authorized to view the profile
         */
        UNAUTHORIZED: 3
    };

    /**
     * Return true if the authentication type is an instance of cq.mobileapps.auth.BasicAuth.
     *
     * @param {cq.mobileapps.auth.Auth} auth - the authentication instance.
     * @returns {boolean} true if the auth is an instance of cq.mobileapps.auth.BasicAuth.
     *
     * @since 1.0
     */
    BasicAuthUserProfileProvider.accepts = function(auth) {
        return (auth instanceof cq.mobileapps.auth.BasicAuth);
    };

    /**
     * Alias the ERROR STATE.
     * @private
     */
    var ERROR = BasicAuthUserProfileProvider.ERROR_STATE;

    ns.BasicAuthUserProfileProvider = BasicAuthUserProfileProvider;

    ns.ProfileProviderRegistry.register(BasicAuthUserProfileProvider);

})(cq.mobileapps.provider);
;(function(ns, undefined) {

    "use strict";

    var PROFILE_URL = 'libs/oauth/profile';
    var SCOPE_PROFILE = 'profile';

    /**
     * OAuthUserProfileProvider provides information about the current user.
     *
     * @class
     * @augments cq.mobileapps.provider.Provider
     * @memberof cq.mobileapps.provider
     * @since 1.0
     */
    function OAuthUserProfileProvider(auth) {
        ns.ProfileProvider.call(this, auth);
    }

    OAuthUserProfileProvider.prototype = Object.create(ns.ProfileProvider.prototype);
    OAuthUserProfileProvider.prototype.constructor = OAuthUserProfileProvider;

    /**
     * Retrieves the user profile information from the oauth server.  Prior to making a call to the AEM
     * there must be a valid OAuth token.
     *
     * @param {cq.mobileapps.provider.Provider~fetchCallback} callback - The callback function
     *
     * @see {@link cq.mobileapps.auth.OAuth} for further details on OAuth authentication.
     * @since 1.0
     */
    OAuthUserProfileProvider.prototype.fetch = function(callback) {
        var self = this;

        this.getAuth().getToken(function(error, token) {
            if (error) {
                console.error("Error fetching profile data due to error code " + error);
                throw Error("You must be authenticated priory to making a request");
            } else {
                var url = self.getAuth().getServer() + PROFILE_URL;

                var oReq = new XMLHttpRequest();
                oReq.open("GET", url);
                oReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                oReq.setRequestHeader('Authorization', 'Bearer ' + token);

                oReq.addEventListener('load', function(e) {

                    if (oReq.status !== 200) {
                        if (oReq.status === 401) {
                            callback(ERROR.UNAUTHORIZED);
                        } else {
                            callback(ERROR.PROFILE_ERROR);
                        }
                        return;
                    }

                    var profile;
                    if (typeof oReq.responseText === 'string') {
                        profile = JSON.parse(oReq.responseText);
                    }
                    callback(null, profile);
                });

                oReq.addEventListener('error', function(e) {
                    console.log("Failed to request " + url, oReq.responseText);
                    callback(ERROR.PROFILE_ERROR);
                });

                var params = cq.mobileapps.util.param({
                    scope: SCOPE_PROFILE
                });

                oReq.send(params);
            }
        });
    };

    OAuthUserProfileProvider.ERROR_STATE = {
        /**
         * <code>COMMUNICATION_ERR</code> error can occur when there are issues connecting
         * to the server.
         */
        COMMUNICATION_ERR : 1,

        /**
         * <code>PROFILE_ERROR</code> general error if and error occurs attempting to
         * retrieve the profile information.
         */
        PROFILE_ERROR : 2,

        /**
         * If the user has not been authorized to view the profile
         */
        UNAUTHORIZED: 3
    };

    /**
     * Returns true if the auth object is an instance of cq.mobileapps.auth.OAuth.
     *
     * @param {cq.mobileapps.auth.Auth} auth - the authentication instance.
     * @returns {boolean} true if the auth object is an instance of cq.mobileapps.auth.OAuth, otherwise return false.
     *
     * @since 1.0
     */
    OAuthUserProfileProvider.accepts = function(auth) {
        return (auth instanceof cq.mobileapps.auth.OAuth);
    };

    /**
     * Alias the ERROR STATE.
     * @private
     */
    var ERROR = OAuthUserProfileProvider.ERROR_STATE;

    // wire the object up to the ns
    ns.OAuthUserProfileProvider = OAuthUserProfileProvider;

    // register the OAuthUserProfileProvider as a profile provider
    ns.ProfileProviderRegistry.register(OAuthUserProfileProvider);

})(cq.mobileapps.provider);
/*
 ADOBE CONFIDENTIAL
 __________________

 Copyright 2013 Adobe Systems Incorporated
 All Rights Reserved.

 NOTICE:  All information contained herein is, and remains
 the property of Adobe Systems Incorporated and its suppliers,
 if any.  The intellectual and technical concepts contained
 herein are proprietary to Adobe Systems Incorporated and its
 suppliers and are protected by trade secret or copyright law.
 Dissemination of this information or reproduction of this material
 is strictly forbidden unless prior written permission is obtained
 from Adobe Systems Incorporated.
 */

window.CQ = window.CQ || {};
CQ.mobile = CQ.mobile || {};
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2014-2016 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/
(function(angular, document, undefined) {
	'use strict';

	/**
	 * angular-phonegap-ready v0.0.1
	 * (c) 2013 Brian Ford http://briantford.com
	 * License: MIT
	 */
	angular.module( 'btford.phonegap.ready', [] )
		.factory( 'phonegapReady', ['$window', function( $window ) {
		return function( fn ) {
			var queue = [];

			var impl = function() {
				queue.push( Array.prototype.slice.call( arguments ) );
			};

			function onDeviceReady() {
				queue.forEach( function( args ) {
					fn.apply( this, args );
				} );
				impl = fn;
			}

			if( $window.cordova ) {
				document.addEventListener( 'deviceready', onDeviceReady, false );
			} else {
				onDeviceReady();
			}

			return function() {
				return impl.apply( this, arguments );
			};
		};
	}] );

	/**
	 * https://github.com/jsanchezpando/angular-phonegap
	 * License: MIT
	 */
	var deferred_ready = null;
	angular.module( 'irisnet.phonegap', [] )
		.factory( 'deviceready', ['$rootScope', '$q',
			function( $rootScope, $q ) {

				if( !deferred_ready ) {
					deferred_ready = $q.defer();
					angular.element( document ).bind( 'deviceready', function() {
						var device = navigator.device || {};
						device.desktop = typeof window.cordova === 'undefined';
						device.ios = !device.desktop && device.platform === 'iOS';
						device.android = !device.desktop && device.platform === 'Android';

						deferred_ready.resolve( device );
					} );
				}

				return function() {
					return deferred_ready.promise;
				};
			}]
		);

})(angular, document);
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2014 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/
;(function (angular, document, contentInit, undefined) {

    angular.module('cqContentSync', ['btford.phonegap.ready'])
        .factory('cqContentSync', ['$q', '$http', 'phonegapReady', 
            function($q, $http, phonegapReady) {

                function initializeApplication(additionalFiles) {
                    var spec = {
                        additionalFiles: additionalFiles
                    };
                    var contentInitializer = contentInit(spec);

                    contentInitializer.initializeApplication(function callback(error, newLocation) {
                        if (error) {
                            console.error('initializeApplication error: [' + error + '].');
                            return;
                        }

                        // Truthy newLocation indicates initilization was successful
                        if (newLocation) {
                            window.location.href = newLocation;
                        }

                        // undefined `newLocation` indicates the app has already been initialized
                    });
                }

                function isAppInitialized() {
                    return CQ.mobile.contentUtils.isAppInitialized();
                }

                return {
                    initializeApplication: phonegapReady(initializeApplication),
                    isAppInitialized: isAppInitialized
                };
            }
        ]);
}(angular, document, CQ.mobile.contentInit));
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2014 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/
;(function( angular, contentUpdate, contentUtils, undefined ) {

    "use strict";

    /**
     * Fetches and applies an AEM content sync delta update to the app.
     */
    angular.module( 'cqContentSyncUpdate', ['btford.phonegap.ready'] )
        .factory( 'cqContentSyncUpdate', ['$window', '$http', 'phonegapReady',
            function($window, $http, phonegapReady) {

                var configOptions = {};

                // Optional. Available for backwards compatibility
                function setContentSyncUpdateConfiguration( contentSyncUpdateURI ) {
                    var parser = document.createElement('a');
                    parser.href = contentSyncUpdateURI;

                    // Separate serverURI from contentSyncPath
                    configOptions.serverURI = parser.protocol + '//' + parser.host;
                    configOptions.contentSyncPath = parser.pathname;
                    // contentSyncPath includes '.zip'
                    configOptions.updateExtension = '';
                }

                // @deprecated
                function fetchAndApplyDeltaUpdate(spec, callback) {
                    spec = spec || {};

                    // Use spec if available, falling back to configOptions
                    spec.serverURI = spec.serverURI || configOptions.serverURI;
                    spec.updateExtension = spec.updateExtension || configOptions.updateExtension;
                    
                    var contentSyncPath = spec.contentSyncPath || configOptions.contentSyncPath;
                    var countryAndLocaleCode = spec.countryAndLocaleCode || 'default';

                    var localeRootPage = contentUtils.getPathToContent(window.location.href);

                    var contentUpdater = contentUpdate(spec);
                    contentUpdater.downloadContentPackage(contentSyncPath, countryAndLocaleCode, localeRootPage,
                        function(error, result) {
                            if (error && callback) {
                                return callback(error);
                            }

                            if (callback) {
                                return callback(null, result)
                            } else {
                                // For backwards compat: reload the current page in absence of a callback
                                console.log( 'No callback specified; reloading app' );
                                window.location.reload( true );
                            }
                        }
                    );
                }

                /*
                 * Exported methods
                 */
                return {
                    // Configure app updater
                    setContentSyncUpdateConfiguration: setContentSyncUpdateConfiguration,

                    // Perform content sync update
                    fetchAndApplyDeltaUpdate: phonegapReady(fetchAndApplyDeltaUpdate)
                };
            }
        ]);
}( angular, CQ.mobile.contentUpdate, CQ.mobile.contentUtils ));
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/
;(function (angular, undefined) {

    "use strict";

    /* Filters */
    angular.module('cqFilters', []).

        filter('omit', function() {
            return function(input, count) {
                if (!angular.isArray(input)) return input;

                count = parseInt(count);

                var out = [],
                    i, n;

                // if abs(limit) exceeds maximum length, trim it
                if (count > input.length)
                    count = input.length;
                else if (count < -input.length)
                    count = -input.length;

                if (count > 0) {
                    i = count;
                    n = input.length;
                } else {
                    i = 0
                    n = input.length + count;
                }

                for (; i<n; i++) {
                    out.push(input[i]);
                }

                return out;
            }
        });

}(angular));



/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/
;(function (angular, undefined) {

    "use strict";

    /* Services */
    angular.module('cqServices', ['btford.phonegap.ready'])

        /**
         * Generic utilities that can be used by any application.
         */
        .factory('cqUtils', [function() {

            return {

                /**
                 * Wrap any object in an array.  A null object will return an empty array. An object that is
                 * already an array will be returned as-is.  Any other object will become the first item in the returned
                 * array.
                 * @param obj
                 * @returns {Array}
                 */
                makeArray: function(obj) {
                    if (obj == null) {
                        return [];
                    }
                    if (angular.isArray(obj)) {
                        return obj;
                    }
                    return [obj];
                }

            };
        }])

        /**
         * Mobile device specific utilities.
         */
        .factory('cqDeviceUtils', ['$window', 'phonegapReady', function($window, phonegapReady) {

            function isConnected() {
                if ($window.navigator.network) {
                    var networkState = $window.navigator.network.connection.type;
                    return (networkState != Connection.UNKNOWN && networkState != Connection.NONE);
                } else {
                    return true;
                }
            }

            function isiOS() {
                if ($window.device) {
                    return ($window.device.platform == "iOS");
                }
            }

            function isAndroid() {
                if ($window.device) {
                    return ($window.device.platform == "Android");
                }
            }


            /**
             *  Returns a Cordova Position object in success handler.
             *  http://docs.phonegap.com/en/3.3.0/cordova_geolocation_geolocation.md.html#Position
             *
             * @param success
             * @param error
             */
            function getPosition(success, error) {

                var options = {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 10000
                };

                var fail = function(err) {
                    //try again
                    navigator.geolocation.getCurrentPosition(success, error, angular.extend(options, {enableHighAccuracy: false}));
                };

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(success, fail, options);
                    console.log("Requesting device location...");
                }
            }

            return {
                /**
                 *
                 * @returns {boolean} true if the device has any type of network connectivity
                 */
                isConnected: isConnected,

                isiOS: phonegapReady(isiOS),
                isAndroid: phonegapReady(isAndroid),

                /**
                 * Requests the current geo-location of the device.  Resulting coordinates will be returned
                 * in the success callback.
                 * @param success callback
                 * @param error callback
                 */
                getPosition: phonegapReady(getPosition)

            };
        }]);


}(angular));



/*
 ADOBE CONFIDENTIAL
 __________________

 Copyright 2013 Adobe Systems Incorporated
 All Rights Reserved.

 NOTICE:  All information contained herein is, and remains
 the property of Adobe Systems Incorporated and its suppliers,
 if any.  The intellectual and technical concepts contained
 herein are proprietary to Adobe Systems Incorporated and its
 suppliers and are protected by trade secret or copyright law.
 Dissemination of this information or reproduction of this material
 is strictly forbidden unless prior written permission is obtained
 from Adobe Systems Incorporated.
 */

window.CQ = window.CQ || {};
CQ.mobile = CQ.mobile || {};
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2014 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

/* globals LocalFileSystem */

/**
 * Utility for dealing with Content Sync updates.
 */
CQ.mobile.contentUtils = {

    // Key prefix used to store content package details in localStorage
    contentPackageDetailsKeyPrefix: 'cq.mobile.contentPackage.',

    // Key to indicate in localStorage once app has been initialized
    isAppInitializedKey: 'cq.mobile.appInitialized',

    // Key to indicate where app has been deployed
    pgeDeployPathKey: 'pge.deployPath',

    // Key to indicate a custom server URL
    pgeServerURL: 'pge.serverURL',

    // Key to indicate file transfer options
    pgeTransferOptionsKey: 'pge.transferOptions',
    
    // Key to indicate the run mode
    pgeRunModeKey: 'pge.runMode',

    /**
     * Test if the application has already been initialized.
     */
    isAppInitialized: function() {
        return (this.isAppRunningInSandbox() && this.isPackageDataStored());
    },

    isAppRunningInSandbox: function() {
        var runMode = localStorage.getItem(this.pgeRunModeKey);
        if (runMode === "pge") {
            return true;
        }
        var currentLocation = window.location.href,
            pattern = /\/(Library|files)\/files\/.*www\//;
        //test currentLocation against known cordova.file.applicationStorageDirectory
        //locations on iOS and Android (unable to access File plugin since deviceready has yet to fire)
        return pattern.test(currentLocation);
    },

    /**
     * Test if the app's package data has been stored in localStorage.
     */
    isPackageDataStored: function() {
        return (localStorage.getItem(this.isAppInitializedKey) !== null);
    },

    /**
     * Get the path to the www/ directory.
     * @param {string} currentLocation - current document location
     */
    getPathToWWWDir: function(currentLocation) {
        // check for a deployPath from PGE
        var deployPath = this.getDeployPath(),
            indexOfWWW = currentLocation.indexOf(deployPath + '/www/');
        if (indexOfWWW !== -1) {
            return currentLocation.substring(0, indexOfWWW + (deployPath.length + 5));
        }
        return null;
    },

    /**
     * Get the subset of the path following the www/ directory.
     * @param {string} currentLocation - current document location
     */
    getPathToContent: function(currentLocation) {
        var pathToContent = null,
            deployPath = this.getDeployPath(),
            indexOfWWW = currentLocation.indexOf(deployPath + '/www/');
        if (indexOfWWW !== -1) {
            pathToContent = currentLocation.substring(indexOfWWW + deployPath.length + 5);
        }
        return pathToContent;
    },

    getDeployPath: function() {
        var deployPath = localStorage.getItem(this.pgeDeployPathKey);
        if (deployPath !== null && deployPath.length > 0) {
            return deployPath;
        }
        return "";
    },

    getServerURL: function() {
        var serverURL = localStorage.getItem(this.pgeServerURL);
        if (serverURL !== null && serverURL.length > 0) {
            return serverURL;
        }
        return undefined;
    },

    /**
     * Request filesystem access.
     * @param {function} callback - called with two parameters: (error, result)
     */
    requestFileSystemRoot: function(callback) {

        var requestFileSystemSuccess = function(fileSystem) {
            return callback(null, fileSystem.root);
        };

        // Failed to access the filesystem
        var requestFileSystemError = function(error) {
            var errorMessage = this.getFileRelatedErrorMessage(error);
            return callback(errorMessage);
        };

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
            requestFileSystemSuccess, requestFileSystemError);
    },

    /**
     * Format a string message from a FileError.
     * @param {FileError} fileError - object containing error details
     */
    getFileRelatedErrorMessage: function(fileError) {
        // Handle error messages passed as strings
        if (!fileError || typeof fileError === 'string' || fileError instanceof String) {
            return 'File error. Message: [' + fileError + ']';
        }

        // Otherwise, extract file related error properties
        var errorCode = fileError.code || 'NO_CODE';
        var errorSource = fileError.source || 'NO_SOURCE';
        var errorTarget = fileError.target || 'NO_TARGET';
        var errorHttpStatus = fileError.http_status || 'NO_HTTP_STATUS';

        return 'File error. Code: [' + errorCode + '] source: [' + errorSource +
               '] target: [' + errorTarget + '] http_status: [' + errorHttpStatus + ']';
    },

    /**
     * Fetch JSON async via an XMLHttpRequest. Inspired by:
     * http://youmightnotneedjquery.com/#json
     * @param {string} url - URL to fetch JSON from
     * @param {function} callback - called with two parameters: (error, result)
     * @param {object} requestHeaders - optional object that contains HTTP
     *      request headers to be sent with the request
     */
    getJSON: function(url, callback, requestHeaders) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);

        // Set request headers if they have been provided
        if (requestHeaders !== null &&
            typeof requestHeaders === "object") {
            for (var property in requestHeaders) {
                if (requestHeaders.hasOwnProperty(property)) {
                    request.setRequestHeader(property, requestHeaders[property]);
                }
            }
        }

        request.onload = function() {
            if ((request.status >= 200 && request.status < 400) || request.status === 0){
                // Success
                var data;
                try {
                    data = JSON.parse(request.responseText);
                } catch (e) {
                    // error during json parsing
                    return callback('Parsing response from url: [' + url + '] failed: ' + e);
                }
                return callback(null, data);
            } else {
                // We reached our target server, but it returned an error
                return callback('Request to url: [' + url + '] returned status: [' + request.status + '].');
            }
        };

        request.onerror = function() {
            // There was a connection error of some sort
            return callback('Request to url: [' + url + '] resulted in a connection error.');
        };

        request.send();
    },

    /**
     * Get the filesystem path of a resource.
     * @param {string} url - URL of the resource
     * @param {function} callback - called with two parameters: (error, result)
     */
    getLocalFilesystemPath: function(url, callback) {
        callback(null, url);
    },

    /**
     * Store the details - such as timestamp - of a specific content package.
     * Will only overwrite the existing data if the contentPackageDetails.timestamp
     * value is > than the existing stored timestamp.
     * @param {string} name - content package name
     * @param {object} contentPackageDetails - details to store
     * @param {boolean} overwrite - if true, existing contentPackageDetails for
     *        `name` will be overwritten
     */
    storeContentPackageDetails: function(name, contentPackageDetails, overwrite) {
        var key = this.contentPackageDetailsKeyPrefix + name;

        // Do not overwrite existing data, unless the timestamp has increased or
        // the overwrite parameter is true
        var existingContentPackageDetails = this.getContentPackageDetailsByName(name);
        if (overwrite === true ||
                existingContentPackageDetails === null ||
                (contentPackageDetails.timestamp > existingContentPackageDetails.timestamp)) {
            // There is either no existing details String at this key, or
            // the existing timestamp is less than the new one
            localStorage.setItem(key, JSON.stringify(contentPackageDetails));
        }
    },

    /**
     * Returns the stored details of a specific content package.
     * @param {string} name - content package name
     */
    getContentPackageDetailsByName: function(name) {
        var key = this.contentPackageDetailsKeyPrefix + name;
        var details = localStorage.getItem(key);
        return JSON.parse(details);
    },

    /**
     * Removes the stored package information
     * @param {string} name - content package name
     */
    removeContentPackageDetails: function(name) {
        localStorage.removeItem(this.contentPackageDetailsKeyPrefix + name);
    },

    /**
     * Reads the specified request headers with the ones defined in the local storage. If a header is
     * present in both locations, the one in the local storage takes precedence.
     * @param {object} [specRequestHeaders] Optional object of request headers
     * @returns {object} The merged request headers
     */
    mergeRequestHeaders: function( specRequestHeaders ) {
        // copy the headers so we don't mess with the user's object
        var ret = {};
        if (typeof specRequestHeaders === 'object') {
            for (var name in specRequestHeaders) {
                if (specRequestHeaders.hasOwnProperty(name)) {
                    ret[name] = specRequestHeaders[name];
                }
            }
        }

        // If both are defined, use PGE headers over those supplied via the config spec
        var pgeHeadersString = localStorage.getItem(this.pgeTransferOptionsKey);
        var pgeHeaders = (pgeHeadersString !== null ? JSON.parse(pgeHeadersString) : {});

        for (var propertyName in pgeHeaders) {
            if (pgeHeaders.hasOwnProperty(propertyName)) {
                ret[propertyName] = pgeHeaders[propertyName];
            }
        }

        return ret;
    }
};
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2014-2015 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

/* globals ContentSync */

/**
 * Functional constructor for CQ.mobile.contentInit. Assumes `deviceready` 
 * event has already fired.
 *
 * @constructor
 *
 * @param {object} spec Initialization options
 * @param {string} [spec.manifestFileName='pge-package.json']
 *          Name of the package manifest JSON.
 *          The manifest contains a list of files to include in initialization
 *
 * @param {string} [spec.contentPackagesFileName='pge-content-packages.json']
 *          Name of the content packages JSON.
 *          Resource containing a list of content sync packages included in the payload.
 *
 * @param {string} [spec.id='default']
 *          Unique identifier to reference the cached content
 *
 * @param {string} [spec.idPrefix]
 *         Prefix to prepend to the {@code spec.id} before invoking the content sync plugin.
 */
CQ.mobile.contentInit = function(spec) {

    'use strict';

    spec = spec || {};

    // JSON resource containing a list of files to include in initialization
    // process
    var manifestFileName = spec.manifestFileName || 'pge-package.json';

    // JSON resource containing a list of content sync packages included in 
    // the payload
    var contentPackagesFileName = spec.contentPackagesFileName || 'pge-content-packages.json';

    // Location of the current resource 
    var currentLocation = window.location.href;

    // Suffix to identify the default content package timestamp by  
    var defaultContentPackageTimestampSuffix = 'default';

    // Last modified timestamp as read from pge-package.json
    var lastModifiedTimestamp;

    // Unique identifier to reference the cached content
    var id = spec.id || 'default';
    var idPrefix = spec.idPrefix || '';

    /**
     * Perform app initialization. Once complete, the app will be ready to
     * receive updates over-the-air via Content Sync.
     * @param {function} callback - called with two parameters: (error, result)
     */
    var initializeApplication = function(callback) {

        console.log('[contentInit] determine if initial app copy needs to occur');
        console.log('[contentInit] current location: [' + currentLocation + ']');

        var readManifestFile = function(callback) {
            var manifestFilePath = CQ.mobile.contentUtils.getPathToWWWDir(currentLocation) + manifestFileName;
            console.log('[contentInit] manifest being read from: [' + manifestFilePath + ']');
            // Read from the manifest
            getDataFromManifest(manifestFilePath, callback);
        };

        var contentCopyCallback = function(error, pathToAppEntryPoint) {
            if (error) {
                return callback(error);
            }

            // Content copy has completed! Record the last modified timestamp
            // Kept around for backwards compatibility
            recordLastModifiedTimestamp(CQ.mobile.contentUtils.contentPackageDetailsKeyPrefix + defaultContentPackageTimestampSuffix,
                lastModifiedTimestamp);

            // Record the individual content package timestamps, if available
            recordContentPackageTimestamps(lastModifiedTimestamp, function(error) {
                    if (error) {
                        return callback(error);
                    }
                    callback(null, pathToAppEntryPoint);
                }
            );
        };

        // Check if app is running in LocalFileSystem.PERSISTENT directory
        var manifestDigestCallback;
        if (CQ.mobile.contentUtils.isAppRunningInSandbox()) {
            console.log('[contentInit] app is running in sandbox: no content copy necessary.');
            var wwwDirPath = CQ.mobile.contentUtils.getPathToWWWDir(currentLocation);

            if (CQ.mobile.contentUtils.isPackageDataStored() === false) {
                manifestDigestCallback = function(error, manifestData) {
                    if (error) {
                        //still allow app to complete initialization - callbacks to server just won't work
                        recordAppInitializedFlag(true);
                        return callback(null, wwwDirPath);
                    }

                    // Store the overall lastModifiedTimestamp for later
                    lastModifiedTimestamp = manifestData.lastModified;
                    console.log('[contentInit] lastModifiedTimestamp is [' + lastModifiedTimestamp + '].');

                    return contentCopyCallback(null, wwwDirPath);
                };

                console.log('[contentInit] package data is missing. recording content package data from manifest.');
                //record timestamps from manifest
                readManifestFile(manifestDigestCallback);
            }
            else {
                return callback(null, wwwDirPath);
            }
        }
        else {
            manifestDigestCallback = function(error, manifestData) {
                if (error) {
                    return contentCopyCallback(error);
                }

                // Store the overall lastModifiedTimestamp for later
                lastModifiedTimestamp = manifestData.lastModified;

                // Begin app ContentSync initialization
                var sync = ContentSync.sync({
                    type: 'local',
                    id: idPrefix + id + '/www',
                    copyRootApp: true,
                    manifest: manifestFileName
                });

                sync.on('complete', function(data) {
                    return contentCopyCallback(null, data.localPath);
                });

                sync.on('error', function(e) {
                    return contentCopyCallback(e);
                });
            };

            readManifestFile(manifestDigestCallback);
        }
    };


    var getDataFromManifest = function(manifestFilePath, callback) {
        // read files from manifest
        CQ.mobile.contentUtils.getJSON(manifestFilePath, function(error, data) {
            if (error) {
                return callback(error);
            }

            return callback(null, data);
        });
    };

    var recordLastModifiedTimestamp = function(key, timestamp) {
        // Add 5 seconds to the timestamp to ensure the value is > the recorded contentsync time
        var incrementedTimestamp = parseInt(timestamp);
        console.log('[contentInit] recording last modified timestamp: [' + incrementedTimestamp + ']');
        localStorage.setItem(key, incrementedTimestamp);
    };

    var recordAppInitializedFlag = function(value) {
        localStorage.setItem(CQ.mobile.contentUtils.isAppInitializedKey, value);
    };

    var recordContentPackageTimestamps = function(defaultTimestamp, callback) {
        // Read from the file identified by `contentPackagesFileName`
        var manifestFilePath = CQ.mobile.contentUtils.getPathToWWWDir(currentLocation) + contentPackagesFileName;
        getDataFromManifest(manifestFilePath, function(error, data) {
            if (error) {
                console.log('[contentInit] unable to read the content packages manifest: [' + contentPackagesFileName + '].');
                return callback(error);
            }
            var serverURL = CQ.mobile.contentUtils.getServerURL() || data.serverURL;
            if (data && data.content) {
                for (var i = 0; i < data.content.length; i++) {
                    var manifestEntry = data.content[i];
                    // Set the timestamp & serverURL to that of the uber package
                    manifestEntry.timestamp = defaultTimestamp;
                    manifestEntry.serverURL = serverURL;
                    // Record the content package details for each manifest entry
                    CQ.mobile.contentUtils.storeContentPackageDetails(manifestEntry.name, manifestEntry);
                }
            }

            // Set flag indicating the app is initialized
            recordAppInitializedFlag(true);
            callback();
        });
    };

    // Exported functions
    var that = {
        initializeApplication: initializeApplication
    };

    return that;
};

/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2014-2016 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

/* globals ContentSync */

/**
 * Functional constructor for CQ.mobile.contentUpdate. Assumes `deviceReady`
 * event has already fired.
 *
 * @param {object} spec Initialization options
 *
 * @param {string} [spec.id='default']
 *          Suffix to identify the default content package timestamp by
 *
 * @param {string} [spec.idPrefix]
 *         Prefix to prepend to the {@code spec.id} before invoking the content sync plugin.
 *
 * @param {string} [spec.isUpdateAvailableSuffix='.pge-updates.json']
 *          Selector and extension for querying if an update is available
 *
 * @param {string} [spec.updateExtension='.pge-updates.zip']
 *          Selector and extension for requesting an update payload
 *
 * @param {string} [spec.contentSyncModifiedSinceParam='?ifModifiedSince=']
 *          Query parameter for requesting content sync updates
 *
 * @param {string} [spec.contentSyncReturnRedirectPathParam='&returnRedirectZipPath=true']
 *          Query parameter for including `zipPath` in content sync update queries
 *
 * @param {string} [spec.manifestFilePath='/www/pge-package-update.json']
 *          JSON resource containing the package timestamp
 *
 * @param {object} [spec.requestHeaders]
 *          HTTP headers to include in each request
 *
 * @param {boolean} [spec.trustAllHosts=false]
 *          If set to true, it accepts all security certificates.
 *          This is useful because Android rejects self-signed security certificates.
 *          Not recommended for production use.
 *
 * @param {string} [spec.localStorageAppIdKey='pge.appId']
 *          Pull app ID from localStorage, if available
 *
 * @param {string} [spec.serverURL]
 *          URL of the server to use for checking for content package updates. If not defined, the
 *          'serverURL' defined in the local storage is used.
 *
 * @constructor
 */
CQ.mobile.contentUpdate = function(spec) {

    'use strict';

    spec = spec || {};

    // Selector and extension for querying if an update is available
    var isUpdateAvailableSuffix = spec.isUpdateAvailableSuffix || '.pge-updates.json';

    // Extension for requesting an update payload
    // '' (empty string) is acceptable, so our check must be more specific
    var updateExtension = spec.updateExtension;
    if (typeof updateExtension === 'undefined' || updateExtension === null) {
        updateExtension = '.pge-updates.zip';
    }

    // Query parameter for requesting content sync updates
    var contentSyncModifiedSinceParam = spec.contentSyncModifiedSinceParam || '?ifModifiedSince=';

    // Query parameter for including `zipPath` in content sync update queries
    var contentSyncReturnRedirectPathParam = spec.contentSyncReturnRedirectPathParam || '&returnRedirectZipPath=true';

    // JSON resource containing the package timestamp and package updates
    var manifestFilePath = spec.manifestFilePath || '/www/pge-package-update.json';

    // HTTP headers to include in each request
    var requestHeaders = CQ.mobile.contentUtils.mergeRequestHeaders( spec.requestHeaders );

    // Optional parameter, defaults to false. If set to true, it accepts all
    // security certificates. This is useful because Android rejects self-signed
    // security certificates. Not recommended for production use.
    var trustAllHosts = spec.trustAllHosts || false;

    // Pull app ID from localStorage, if available
    var localStorageAppIdKey = spec.localStorageAppIdKey || 'pge.appId';

    // Unique identifier to reference the cached content
    var id = localStorage.getItem(localStorageAppIdKey) || spec.id || 'default';
    var idPrefix = spec.idPrefix || '';

    // List of deleted error files, for reporting
    var deletedErrorFileList = [];

    // Starting path for deleting files
    var localUrl;

    // List of files to compare to files to be deleted
    var packageFiles = [];

    /**
     * Update the content package identified by `name`.
     * @param {string} name - the name of the content package to update
     * @param {function} callback - called with two parameters: (error, result).
     *      Returns a path to content if successful, and an error otherwise.
     */
    var updateContentPackageByName = function(name, callback) {
        var contentPackageDetails = CQ.mobile.contentUtils.getContentPackageDetailsByName(name);

        if (!contentPackageDetails) {
            return callback('[contentUpdate] no contentPackageDetails set for name: [' + name + ']. Aborting.');
        }

        isContentPackageUpdateAvailable(name, function(error, isUpdateAvailable, zipPath) {
            if (error) {
                return callback(error);
            }

            if (isUpdateAvailable === false) {
                return callback('[contentUpdate] no update available: aborting.');
            }

            // Prepare URI to request update payload
            var updateServerURI = getServerURL(contentPackageDetails);
            var contentSyncUpdateURI = updateServerURI + contentPackageDetails.updatePath + updateExtension +
                contentSyncModifiedSinceParam + getContentPackageTimestamp(name);

            // Use exact path to zip if available
            if (zipPath) {
                contentSyncUpdateURI = updateServerURI + zipPath;
                console.log('[contentUpdate] using exact path to zip: [' + contentSyncUpdateURI + '].');
            }

            // Update app content using the ContentSync plugin
            var sync = ContentSync.sync({
                src: contentSyncUpdateURI,
                id: idPrefix + id,
                type: 'merge',
                headers: requestHeaders,
                trustHost: trustAllHosts
            });

            sync.on('complete', function(data) {
                var syncOperationComplete = function(error) {
                    if (error) {
                        return callback(error);
                    }

                    if (callback) {
                        var localContentPath = CQ.mobile.contentUtils.getPathToContent(window.location.href);
                        return callback(null, data.localPath + localContentPath);
                    }
                    else {
                        // For backwards compat: reload the current page in absence of a callback
                        console.log('[contentUpdate] no callback specified; reloading app' );
                        window.location.reload( true );
                    }
                };

                /**
                 * handler for overall success in deleting files
                 */
                var removeDeletedContentSuccess = function() {
                    console.log("[contentUpdate] Completed removal of unused files.");

                    updateLastUpdatedTimestamp(data.localPath, name, syncOperationComplete);
                };

                /**
                 * handler for overall success in deleting files
                 */
                var removeDeletedContentError = function() {

                    console.error("[contentUpdate] failed to remove the following unused files:");

                    for (var i = 0; i < deletedErrorFileList.length; i++) {
                        console.error("[contentUpdate] - " + deletedErrorFileList[i]);
                    }

                    updateLastUpdatedTimestamp(data.localPath, name, syncOperationComplete);
                };

                localUrl = 'file://' + data.localPath;
                initializePackageFiles(removeDeletedContentSuccess, removeDeletedContentError);
            });

            sync.on('error', function(e) {
                return callback(e);
            });
        });
    };

    /**
     * Determine if a content package update is available.
     * @param {string} name - the name of the content package to update
     * @param {function} callback - called with (null, true, zipPath) if a
     *      content package update is available, or if this content package
     *      has not yet been synced to this device. zipPath contains the exact
     *      path to the delta zip payload.
     */
    var isContentPackageUpdateAvailable = function(name, callback) {

        var contentPackageDetails = CQ.mobile.contentUtils.getContentPackageDetailsByName(name);

        if (contentPackageDetails) {
            // Check if the content package is already installed
            isContentPackageAlreadyInstalled(contentPackageDetails, function(isInstalled) {
                if (isInstalled === false) {
                    // Because this package is not installed, the next query should use a timestamp of 0.
                    // Update the timestamp to 0
                    contentPackageDetails.timestamp = 0;
                    CQ.mobile.contentUtils.storeContentPackageDetails(name, contentPackageDetails, true);
                }

                // Configure server endpoint from manifest details
                var updateServerURI = getServerURL(contentPackageDetails);

                var ck = '&' + (new Date().getTime());
                var updatePath = contentPackageDetails.updatePath;

                var contentSyncUpdateQueryURI = updateServerURI + updatePath + isUpdateAvailableSuffix +
                    contentSyncModifiedSinceParam + getContentPackageTimestamp(name) + ck +
                    contentSyncReturnRedirectPathParam;

                console.log('[contentUpdate] querying for update with URI: [' + contentSyncUpdateQueryURI + '].');

                CQ.mobile.contentUtils.getJSON(contentSyncUpdateQueryURI, function(error, data) {
                    if (error) {
                        return callback(error);
                    }

                    if (data.updates === true && data.zipPath) {
                        console.log('[contentUpdate] update is available for [' + name + '] at the following location: [' + data.zipPath + '].');
                        return callback(null, true, data.zipPath);
                    }
                    else if (data.updates === true) {
                        console.log('[contentUpdate] update is available for [' + name + '].');
                        return callback(null, true);
                    }
                    else {
                        console.log('[contentUpdate] NO update is available for [' + name + '].');
                        return callback(null, false);
                    }
                },
                requestHeaders);
            });
        }
        else {
            var errorMessage = 'No contentPackageDetails set for name: [' + name + ']. Aborting.';
            console.error('[contentUpdate] ' + errorMessage);
            return callback(errorMessage);
        }
    };

    /*
     * Private helpers
     */
    var updateLastUpdatedTimestamp = function(path, contentPackageName, callback) {
        var cacheKiller = '?ck=' + (new Date().getTime());

        // Fetch updated timestamp from filesystem
        CQ.mobile.contentUtils.getJSON(path + manifestFilePath + cacheKiller, function(error, data) {
            if (error) {
                return callback(error);
            }

            var newTimestamp = parseInt(data.lastModified);

            console.log('[contentUpdate] recording timestamp: [' + newTimestamp + '] under the content package manifest named [' + contentPackageName + ']');

            // Update stored timestamp for this content package
            var contentPackageDetails = CQ.mobile.contentUtils.getContentPackageDetailsByName(contentPackageName);
            contentPackageDetails.timestamp = newTimestamp;
            CQ.mobile.contentUtils.storeContentPackageDetails(contentPackageName, contentPackageDetails);

            return callback();
        });
    };

    var getContentPackageTimestamp = function(contentPackageName) {
        var packageDetails = CQ.mobile.contentUtils.getContentPackageDetailsByName(contentPackageName);
        var timestamp = packageDetails.timestamp;
        // If timestamp has not yet been set, return 0
        return timestamp || 0;
    };

    /**
     * Returns the server URL of the package details.
     * The URL can be overridden by the spec.serverURL property.
     * @param {object} packageDetails The package details from the local storage
     * @returns {string}
     */
    var getServerURL = function(packageDetails) {
        // check if spec wants to override the url
        var url = spec.serverURL || packageDetails.serverURL;

        // remove trailing slash
        if (url.charAt(url.length-1) === '/') {
            url = url.substring(0, url.length - 1);
        }

        return url;
    };

    /**
     * Populate the packageFiles array with a list of filename from the pge-package-update.json file,
     * first prepending them with '/www/' to facilitate matching with the pge_deletions file.
     */
    var initializePackageFiles = function(successCallback, failureCallback) {
        if (packageFiles && (Array === packageFiles.constructor) && (packageFiles.length > 0)) {
            removeDeletedContent(successCallback, failureCallback);
        } else {
            window.resolveLocalFileSystemURL(localUrl + manifestFilePath, function (fileEntry) {
                CQ.mobile.contentUtils.getJSON(fileEntry.toURL(), function (error, jsonData) {
                    if (jsonData && jsonData.files) {
                        packageFiles = jsonData.files;
                        // For each packageFile file, prepend it with '/www/'
                        packageFiles.forEach(function(item, index) {
                            packageFiles[index] = '/www/' + item;
                        });
                    }
                    removeDeletedContent(successCallback, failureCallback);
                }, function (error) {
                    console.error('[contentUpdate] Error reading the ' + manifestFilePath + ' file.  Error Code: ' + error.code);
                    removeDeletedContent(successCallback, failureCallback);
                });
            }, function (error) {
                console.error('[contentUpdate] Error resolving the ' + manifestFilePath + ' file.  Error Code: ' + error.code);
                removeDeletedContent(successCallback, failureCallback);
            });

        }
    };

    /**
     * Read and handle the files in the deletion directory.
     * There could be zero, one, or several such files.  Each one contains in json a list of files to delete.
     */
    var removeDeletedContent = function(successCallback, failureCallback) {
        console.log('[contentUpdate] Looking for files to remove, in ' + localUrl + '/www/pge-deletions');

        window.resolveLocalFileSystemURL(localUrl + '/www/pge-deletions', function(dirEntry) {
            // Empty error file list in case it's not empty.
            deletedErrorFileList = [];
            var directoryReader = dirEntry.createReader();

            console.log('[contentUpdate] Reading pge_deletions files.');
            directoryReader.readEntries(function(entries){
                readDeletionFiles(entries, successCallback, failureCallback);
            },
                function (error) {
                console.error('[contentUpdate] Error reading deletion directory.  Error Code: ' + error.code);
            });
        }, function(error) {
            console.log('[contentUpdate] No pge-deletions folder in ' + localUrl + '/www.  Error Code: ' + error.code);
            return successCallback();
        });
    };


    /**
     * Given a list of deletion files (FileEntries), recursively read the content of each file, and act on it.
     */
    var readDeletionFiles = function(entries, successCallback, failureCallback) {

        if (entries.length === 0) {
            if (deletedErrorFileList.length === 0) {
                return successCallback();
            } else {
                return failureCallback();
            }
        }

        var deletionFile = entries.pop();
        if (deletionFile.isFile && deletionFile.name.match(/pge_deletions_.*\.json/)) {

            console.log('[contentUpdate] Reading pge_deletions file: ' + deletionFile.name);
            CQ.mobile.contentUtils.getJSON(deletionFile.toURL(), function (error, jsonData) {
                if (jsonData && jsonData.files) {
                    removeFiles(jsonData.files, deletionFile, entries, successCallback, failureCallback);
                }
            }, null);
        } else {
            readDeletionFiles(entries, successCallback, failureCallback);
        }
    };

    /**
     * Given a list of files to delete, delete one and then recursively delete the rest
     * (each file is a string).  When done, remove the deletion file.
     */
    var removeFiles = function(files, deletionFileEntry, entries, successCallback, failureCallback) {
        var deleteFile = function(files) {
            if (files.length === 0) {
                console.log("[contentUpdate] " + deletionFileEntry.name + ": content files processed for removal.");

                // Once finished, remove the deletion file
                deletionFileEntry.remove(function() {
                    console.log('[contentUpdate] Removed ' + deletionFileEntry.name);
                    readDeletionFiles(entries, successCallback, failureCallback);
                }, function(error) {
                    console.error('[contentUpdate] Could not remove deletion file: ' + deletionFileEntry.name + '.  Error Code: ' + error.code);
                    readDeletionFiles(entries, successCallback, failureCallback);
                });
            } else {

                var file = files.pop();
                window.resolveLocalFileSystemURL(localUrl + file, function (fileEntry) {
                    if (packageFiles.indexOf(file) < 0) {
                        fileEntry.remove(function () {
                            console.log('[contentUpdate] Successfully removed ' + localUrl + file);
                            deleteFile(files);
                        }, function (error) {
                            console.error('[contentUpdate] Could not remove ' + localUrl + file + '.  Error Code: ' + error.code);
                            deletedErrorFileList.push(file);
                            deleteFile(files);
                        });
                    } else {
                        console.log('[contentUpdate] Did not remove ' + localUrl + file +
                            ' because it is included in the latest update');
                        deleteFile(files);
                    }
                }, function (error) {
                    console.error('[contentUpdate] Could not find ' + localUrl + file + '.  Error Code: ' + error.code);
                    deleteFile(files);
                });
            }
        };

        // start recursion
        deleteFile(files);
    };

    /**
     * Check if the given content package is already installed.
     * @param {object} packageDetails The package details from local storage
     * @returns {boolean}
     */
    var isContentPackageAlreadyInstalled = function(packageDetails, callback) {
        var relativePathToHtmlContent = packageDetails.path.substring(1) + '.html';

        console.log('[contentUpdate] looking for existing content for package: [' +
        packageDetails.name + '] at path: [' + relativePathToHtmlContent + '].');

        var absolutePathToHtmlContent = CQ.mobile.contentUtils.getPathToWWWDir(window.location.href) +
            relativePathToHtmlContent;

        window.resolveLocalFileSystemURL(absolutePathToHtmlContent,
            function success() {
                console.log('[contentUpdate] package [' + packageDetails.name + '] ' +
                'root detected: package is already installed.');
                callback(true);
            },
            function fail() {
                console.log('[contentUpdate] package [' + packageDetails.name + '] ' +
                'is NOT already installed.');
                callback(false);
            }
        );
    };



    // Exported functions
    var that = {
        updateContentPackageByName: updateContentPackageByName,
        isContentPackageUpdateAvailable: isContentPackageUpdateAvailable
    };

    return that;
};

/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/
;(function (angular,undefined) {

    "use strict";

    /**
     * @doc module
     * @name cqMaps
     *
     * @description
     * Module for embedding Google Maps into CQ mobile apps.
     *
     */
    angular.module("cqMaps", []).

        factory('cqMapDefaults', function() {
            return {
                'precision': 3,
                'mapOptions': {
                    zoom : 8,
                    disableDefaultUI: true,
                    mapTypeControl: false,
                    panControl: false,
                    zoomControl: true,
                    scrollwheel: true
                }
            };
        })

}(angular));
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/
;(function (angular,undefined) {

    "use strict";

    angular.module("cqMaps").

    /**
     * Google Maps API Utilities
     */
    factory('cqMapUtils', ['$parse', function($parse) {

        function floatEqual (f1, f2) {
            return (Math.abs(f1 - f2) < 0.000001);
        }

        /**
         * @ngdoc function
         * @name #latLngEqual
         * @methodOf cqMaps.service:caMapUtils
         *
         * @param {google.maps.LatLng} l1 first
         * @param {google.maps.LatLng} l2 second
         * @return {boolean} true if l1 and l2 are 'very close'. If either are null
         * or not google.maps.LatLng objects returns false.
         */
        function latLngEqual(l1, l2) {
            if (!(l1 instanceof google.maps.LatLng &&
                l2 instanceof google.maps.LatLng)) {
                return false;
            }
            return floatEqual(l1.lat(), l2.lat()) && floatEqual(l1.lng(), l2.lng());
        }

        /**
         * @ngdoc function
         * @name #boundsEqual
         * @methodOf cqMaps.service:caMapUtils
         *
         * @param {google.maps.LatLngBounds} b1 first
         * @param {google.maps.LatLngBounds} b2 second
         * @return {boolean} true if b1 and b2 are 'very close'. If either are null
         * or not google.maps.LatLngBounds objects returns false.
         */
        function boundsEqual(b1, b2) {
            if (!(b1 instanceof google.maps.LatLngBounds &&
                b2 instanceof google.maps.LatLngBounds)) {
                return false;
            }
            var sw1 = b1.getSouthWest();
            var sw2 = b2.getSouthWest();
            var ne1 = b1.getNorthEast();
            var ne2 = b2.getNorthEast();

            return latLngEqual(sw1, sw2) && latLngEqual(ne1, ne2);
        }

        /**
         * @ngdoc function
         * @name #hasNaN
         * @methodOf cqMaps.service:caMapUtils
         *
         * @param {google.maps.LatLng} latLng the LatLng
         * @return {boolean} true if either lat or lng of latLng is null or isNaN
         */
        function hasNaN(latLng) {
            if (!(latLng instanceof google.maps.LatLng))
                throw 'latLng must be a google.maps.LatLng';

            // google.maps.LatLng converts NaN to null, so check for both
            var isNull = (latLng.lat() == null || latLng.lng() == null);
            var isNotaN =  isNaN(latLng.lat()) || isNaN(latLng.lng());
            return isNull || isNotaN;
        }

        /**
         * @ngdoc function
         * @name #objToLatLng
         * @methodOf cqMaps.service:cqMapUtils
         *
         * @param {Object,String,google.maps.LatLng} obj of the form { lat: 40, lng: -120 } or { latitude: 40, longitude: -120 } or
         *                      comma separated string "40,-120"
         * @return {google.maps.LatLng} returns null if problems with obj (null, NaN, etc.)
         */
        function objToLatLng(obj) {
            var lat,lng;
            if (obj instanceof  google.maps.LatLng) {
                return obj;
            }
            if (angular.isObject(obj)) {
                lat = obj.lat || obj.latitude || null;
                lng = obj.lng || obj.longitude || null;
            } else if (angular.isString(obj)) {
                obj = obj.split(",");
                if (angular.isArray(obj) && obj.length == 2) {
                    lat = parseFloat(obj[0]) || null;
                    lng = parseFloat(obj[1]) || null;
                }
            }

            var ok = !(lat == null || lng == null) && !(isNaN(lat) || isNaN(lng));
            if (ok) {
                return new google.maps.LatLng(lat, lng);
            }
            return null;
        }

        /**
         * @ngdoc function
         * @name #latLngToObj
         * @methodOf cqMaps.service:cqMapUtils
         *
         * @param {google.maps.LatLng}
         * @return {Object} returns null if problems with obj (null, NaN, etc.)
         */
        function latLngToObj(obj) {
            if (obj instanceof  google.maps.LatLng) {
                return {lat:obj.lat(),lng:obj.lng()};
            }
            return null;
        }

        /**
         * @ngdoc function
         * @name #getAddressName
         * @methodOf cqMaps.service:cqMapUtils
         *
         * @param {Object}
         * @return {String} the value of the address component name
         */
        function getAddressComponentName(list, type) {
            if (angular.isArray(list)) {
                for (var i=0; i < list.length; i++) {
                    var value = list[i];
                    if (value.types && value.types.indexOf(type) >= 0) {
                        return value.long_name;
                    }
                }
            }
            return null;
        }

        /**
         * @param {Object} attrs directive attributes
         * @return {Object} mapping from event names to handler fns
         */
        function getEventHandlers(attrs, type) {
            var handlers = {};
            type = type || "";
            if (type.length > 0) {
                type = type.charAt(0).toUpperCase() + type.substring(1);
            }
            // retrieve cq-on-... handlers
            angular.forEach(attrs, function(value, key) {
                if (key.lastIndexOf('cqOn'+type, 0) === 0) {
                    var event = angular.lowercase(
                        key.substring(4+type.length)
                            .replace(/(?!^)([A-Z])/g, '_$&')
                    );
                    var fn = $parse(value);
                    handlers[event] = fn;
                }
            });

            return handlers;
        }

        return {
            latLngEqual: latLngEqual,
            boundsEqual: boundsEqual,
            hasNaN: hasNaN,
            toLatLng: objToLatLng,
            fromLatLng: latLngToObj,
            getAddressName: getAddressComponentName,
            getEventHandlers: getEventHandlers
        };
    }]);

}(angular));
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/
;(function (angular,undefined) {

    "use strict";

    angular.module("cqMaps").

    /**
     * Directive controller which is owned by the [cqMaps]{@link module:cqMaps} module
     * and shared among all map directives.
     */
    controller('cqMapController',
        ['$scope', '$element', '$timeout', 'cqMapUtils', 'cqMapDefaults',
            function ($scope, $element, $timeout, cqMapUtils, cqMapDefaults) {

                /*
                 * Construct a new controller for the map directive.
                 * @param {angular.Scope} $scope
                 * @param {angular.element} $element
                 * @constructor
                 */
                var constructor = function($scope, $element) {

                    this._markers = {};

                    Object.defineProperties(this, {
                        'precision': {
                            value: cqMapDefaults.precision,
                            writeable: false
                        },
                        'center': {
                            get: function() {
                                return this._map.getCenter();
                            },
                            set: function(center) {
                                if (cqMapUtils.hasNaN(center))
                                    throw 'center contains null or NaN';
                                var changed = !cqMapUtils.latLngEqual(this.center, center);
                                if (changed) {
                                    this._map.panTo(center);
                                }
                            }
                        },
                        'zoom': {
                            get: function() {
                                return this._map.getZoom();
                            },
                            set: function(zoom) {
                                if (!(zoom != null && !isNaN(zoom)))
                                    throw 'zoom was null or NaN';
                                var changed = this.zoom !== zoom;
                                if (changed) {
                                    this._map.setZoom(zoom);
                                }
                            }
                        },
                        'bounds': {
                            get: function() {
                                return this._map.getBounds();
                            },
                            set: function(bounds) {
                                var numbers = !cqMapUtils.hasNaN(bounds.getSouthWest()) &&
                                    !cqMapUtils.hasNaN(bounds.getNorthEast());
                                if (!numbers)
                                    throw 'bounds contains null or NaN';

                                var changed = !(cqMapUtils.boundsEqual(this.bounds, bounds));
                                if (changed) {
                                    this._map.fitBounds(bounds);
                                }
                            }
                        }

                    });

                    $scope.$on('$destroy', angular.bind(this, this._destroy));

                };

                // Retrieve google.maps.MapOptions
                this._getConfig = function(options) {
                    var config = {};
                    angular.extend(config, {
                            zoomControlOptions: {
                                style: google.maps.ZoomControlStyle.SMALL,
                                position: google.maps.ControlPosition.TOP_RIGHT
                            },
                            mapTypeId: google.maps.MapTypeId.ROADMAP
                        },
                        cqMapDefaults.mapOptions,
                        $scope.mapOptions(),
                        options);
                    return config;
                };

                // Create the map
                this.createMap = function(element, options) {
                    options = this._getConfig(options);
                    if (!this._map) {
                        google.maps.visualRefresh = true;
                        this._map = new google.maps.Map(element[0], options);
                    } else {
                        this._map.setOptions(options);
                    }
                };

                this._destroy = function() {

                };

                /**
                 * Alias for google.maps.event.trigger(map, event)
                 * @param {string} event an event defined on google.maps.Map
                 * @ignore
                 */
                this.trigger = function(event) {
                    google.maps.event.trigger(this._map, event);
                };

                /**
                 * Adds a new marker to the map.
                 * @param {number} scope id
                 * @param {number} location
                 */
                this.addMarker = function(scopeId, location, options) {
                    if (!this._map) return;

                    var markerLatLng = cqMapUtils.toLatLng(location.coordinates || location);
                    var marker = new google.maps.Marker(angular.extend({}, {
                        position: markerLatLng
                    }, options));
                    marker.setMap(this._map);

                    var position = marker.getPosition();
                    if (position) {
                        var hash = position.toUrlValue(this.precision);
                        if (this._markers[scopeId] == null) {
                            this._markers[scopeId] = {};
                        }
                        this._markers[scopeId][hash] = {marker:marker, location:location};
                    }

                    return marker;
                };

                /**
                 * Retrieve marker from map.
                 * @param {number} scope id
                 * @param {number} location
                 * @return {google.maps.Marker} the marker at given location, or null if
                 *   no such marker exists
                 * @ignore
                 */
                this.getMarker = function (scopeId, location) {
                    if (location == null)
                        throw 'location was null';

                    var latLng = new google.maps.LatLng(location.coordinates.lat,location.coordinates.lng);
                    var hash = latLng.toUrlValue(this.precision);
                    if (this._markers[scopeId] != null && hash in this._markers[scopeId]) {
                        return this._markers[scopeId][hash].marker;
                    } else {
                        return null;
                    }
                };

                /**
                 * Clear all markers from map
                 * @param {number} scope id
                 * @ignore
                 */
                this.clearMarkers = function (scopeId) {
                    if (this._markers[scopeId] != null) {
                        angular.forEach(this._markers[scopeId], function(object, i) {
                            if (object) {
                                object.marker.setMap(null);
                            }
                        });
                        this._markers[scopeId] = null;
                        delete this._markers[scopeId];
                    }
                };

                /**
                 * Reposition map to fit within bounds defined by provided positions.
                 * @param {array} list of positions to use
                 * @return {google.maps.LatLngBounds} the resulting bounds
                 */
                this.reposition = function(positions) {
                    if (!angular.isArray(positions))
                        throw 'positions is not an array';

                    if (positions.length > 0) {
                        var zoom = this.zoom;
                        var bounds = new google.maps.LatLngBounds();
                        angular.forEach(positions, function(object, i) {
                            bounds.extend(cqMapUtils.toLatLng(object));
                        });
                        this.bounds = bounds;
                        if (positions.length == 1) {
                            this.zoom = zoom;
                        }
                        return bounds;
                    }

                    return null;
                };

                /**
                 * Get current map.
                 * @returns {object}
                 * @ignore
                 */
                this.getMap = function() {
                    return this._map;
                };

                /** Instantiate controller */
                angular.bind(this, constructor)($scope, $element);

            }
        ]);


}(angular));
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/
;(function (angular,undefined) {

    "use strict";

    angular.module("cqMaps").

    /**
     * @ngdoc directive
     * @name caMaps.directive:cqMap
     * @element ANY
     *
     * @description
     * A directive for embedding google maps into an app.
     *
     */
    directive('cqMap', ['$window', '$timeout', 'cqUtils', 'cqMapUtils', function($window, $timeout, cqUtils, cqMapUtils) {

            var counter = 0,
                prefix = '__cq_gmap_';

            function link(scope, element, attrs, controller) {

                var markerHandlers = cqMapUtils.getEventHandlers(attrs, "marker"); // map events -> handlers

                if ($window.google && $window.google.maps) {
                    initMap();
                } else {
                    injectGoogleAPI(attrs.key);
                }

                function initMap() {

                    scope.$emit('cqMapReady');

                    var mapOptions = {};

                    //zoom as attribute
                    if(attrs.zoom && parseInt(attrs.zoom)) {
                        mapOptions.zoom = parseInt(attrs.zoom);
                    }
                    //maptype as attribute
                    if(attrs.maptype){
                        switch(attrs.maptype.toLowerCase()){
                            case 'hybrid':
                                mapOptions.mapTypeId = google.maps.MapTypeId.HYBRID;
                                break;
                            case 'satellite':
                                mapOptions.mapTypeId = google.maps.MapTypeId.SATELLITE;
                                break;
                            case 'terrain':
                                mapOptions.mapTypeId = google.maps.MapTypeId.TERRAIN;
                                break;
                            case 'roadmap':
                            default:
                                mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
                                break;
                        }
                    }

                    //Create initial map
                    controller.createMap(element, mapOptions);

                    //
                    // Watches
                    //
                    if (attrs.hasOwnProperty("center")) {
                        updateCenter(scope.center);
                        scope.$watch('center', function (newValue) {
                            updateCenter(newValue);
                        }, true);
                    }

                    if (attrs.hasOwnProperty("markers")) {
                        updateMarkers(scope.markers);
                        scope.$watch("markers", function(newMarkers) {
                            updateMarkers(newMarkers);
                        }, true);
                    }

                    if (attrs.hasOwnProperty("refresh")) {
                        if (scope.refresh) {
                            resizeMap();
                        }
                        scope.$watch("refresh", function(value) {
                            if (value) {
                                resizeMap();
                            }
                        }, true);
                    }
                }

                function updateCenter(latLng) {
                    latLng = cqMapUtils.toLatLng(latLng);
                    controller.clearMarkers(scope.$id+"-center");
                    if (latLng) {
                        controller.center = latLng;
                        /*
                        controller.addMarker(scope.$id+"-center", latLng, {
                            icon: {
                                url: '/img/measle_blue.png'
                            }
                        });
                        */
                    }
                }

                function updateMarkers(markers) {
                    controller.clearMarkers(scope.$id);
                    if (markers) {
                        if (!angular.isArray(markers)) {
                            markers = [markers];
                        }
                        //Add new markers to map
                        angular.forEach(markers, function(object, i) {
                            var marker = controller.addMarker(scope.$id, object);
                            // set up marker event handlers
                            angular.forEach(markerHandlers, function(handler, event) {
                                google.maps.event.addListener(marker, event, function() {
                                    $timeout(function() {
                                        handler(scope.$parent, {
                                            object: object,
                                            marker: marker
                                        });
                                    });
                                });
                            });
                        });
                    }
                    controller.reposition(getPositions());
                }

                function resizeMap() {
                    //Trigger a resize event and reposition map based on
                    //current set of positions and markers in scope
                    controller.trigger('resize');
                    controller.reposition(getPositions());
                }

                function getPositions() {
                    var allPositions = cqUtils.makeArray(scope.positions);
                    if (scope.markers && scope.markers.length > 0) {
                        allPositions.push(scope.markers[0].coordinates);
                    }
                    return allPositions;
                }

                function injectGoogleAPI(key) {
                    //Asynchronously load google api scripts
                    var cbId = prefix + ++counter;
                    $window[cbId] = initMap;

                    var gmap_script = document.createElement('script');
                    gmap_script.src = ('https:' == document.location.protocol ? 'https' : 'http') +
                        '://maps.googleapis.com/maps/api/js?key=' + key + '&' + 'callback=' + cbId;
                    gmap_script.type = 'text/javascript';
                    gmap_script.async = 'true';
                    var doc_script = document.getElementsByTagName('script')[0];
                    doc_script.parentNode.insertBefore(gmap_script, doc_script);
                }
            }

            return {
                restrict: 'E',
                replace: true,
                scope: {
                    center: '=',
                    markers: '=',
                    positions: '=',
                    refresh: '=',
                    mapOptions: '&'
                },
                template: '<div></div>',
                controller: 'cqMapController',
                link: link
            };
        }]);

}(angular));
/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2013 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/
;(function (angular,undefined) {

    "use strict";

    angular.module("cqMaps").

    /**
     * @ngdoc directive
     * @name cqMaps.directive:cqInfoWindow
     * @element ANY
     *
     * @description
     * A directive for creating a google.maps.InfoWindow.
     *
     */
    directive('cqInfoWindow',
        ['$parse', '$compile', '$timeout', function ($parse, $compile, $timeout) {

                function link(scope, element, attrs) {
                    var opts = angular.extend({}, scope.$eval(attrs.cqInfoWindowOptions));
                    opts.content = element[0];
                    var model = $parse(attrs.cqInfoWindow);
                    var infoWindow = model(scope);

                    /**
                     * The info window's contents don't need to be on the dom anymore,
                     * google maps has them stored. So we just replace the infowindow
                     * element with an empty div. (we don't just straight remove it from
                     * the dom because straight removing things from the dom can mess up
                     * angular)
                     */
                    element.replaceWith('<div></div>');

                    scope.$on('cqMapReady', function(event, arg) {
                        if (!infoWindow) {
                            infoWindow = new google.maps.InfoWindow(opts);
                            model.assign(scope, infoWindow);
                        }
                        //Decorate infoWindow.open to $compile contents before opening
                        var _open = infoWindow.open;
                        infoWindow.open = function open(map, anchor) {
                            $compile(element.contents())(scope);
                            _open.call(infoWindow, map, anchor);
                        };
                    });

                }

                return {
                    restrict: 'A',
                    priority: 100,
                    scope: false,
                    link: link
                };

            }]);

}(angular));
;(function (angular, document, undefined) {

    angular.module('phonegapLocation', ["cqServices", "cqMaps"])

        .controller('LocationCtrl', ['$scope', '$timeout', 'cqDeviceUtils', function($scope, $timeout, cqDeviceUtils) {

            $scope.showMap = false;
            $scope.origin = null;
            $scope.locations = [];

            //get current position
            cqDeviceUtils.getPosition(function(position) {
                $scope.origin = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                $scope.locations.push({
                    "coordinates": {
                        "lat": position.coords.latitude,
                        "lng": position.coords.longitude
                    }
                });
                //reverse geocode
                var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({'latLng': latlng}, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[1]) {
                            $scope.locations[0].label = results[1].formatted_address;
                        } else {
                            $scope.locations[0].label = "No location found";
                        }
                        $scope.$apply();
                    } else {
                        $scope.error = 'Geocoder failed due to: ' + status;
                    }
                });
            }, function(error){
                if (error.POSITION_UNAVAILABLE == error.code || error.PERMISSION_DENIED == error.code) {
                    console.log("Please enable location services and try again.");
                } else {
                    console.log('Location error code: ' + error.code + '\n'+ 'message: ' + error.message);
                }
                $scope.error = "Location unavailable";
            });

        }])

}(angular, document));

;(function (angular, undefined) {

    "use strict";

    /**
     * Module to handle general navigation in the app
     */
    angular.module('cqAppNavigation', ['cqContentSyncUpdate'])

        .controller('AppNavigationController', ['$scope', '$window', '$location', '$timeout', 'cqContentSyncUpdate',

            function ($scope, $window, $location, $timeout, cqContentSyncUpdate) {

                $scope.transition = '';

                // Start a timeout
                var timer = $timeout(function() {
                    $scope.initApp();
                }, 100);

                /**
                 * Trigger an app update
                 */
                $scope.updateApp = function( ) {
                    // don't start updating again if we're already updating.
                    if($scope.updating) return;

                    // Prevent this event from propagating
                    $scope.updating = true;

                    if( window.ADB ) {
                        ADB.trackAction( 'updateApp', {} );
                        ADB.trackTimedActionStart( 'updateAppTimed', {} );
                    }

                    try {
                        cqContentSyncUpdate.fetchAndApplyDeltaUpdate().then(
                            function( result ) {
                                $scope.updating = false;
                            },
                            function( rejection ) {
                                // todo: display error
                                console.error( rejection );
                                $scope.updating = false;
                            }
                        );
                    } catch( err ) {
                        console.log( 'Update Failed: ' + err );
                        if( window.ADB ) {
                            ADB.trackAction( 'updateAppFailed', {} );
                        }
                    }

                    if( window.ADB ) {
                        ADB.trackTimedActionEnd( 'updateAppTimed' );
                    }
                };

                /**
                 * Initialize app on first load
                 */
                $scope.initApp = function() {
                    $timeout.cancel(timer);
                    $scope.updateApp();
                }

            }
        ]);

})(angular);

;(function (angular, undefined) {

    "use strict";

    angular.module('geometrixx-banner', []);


}(angular));


;(function (angular,  undefined) {

    "use strict";

    angular.module('geometrixx-banner')

        .directive('geometrixxNavigation',
            [function (lowes, lowesConstants) {

                return {
                    compile: function($element, attr) {
                        var action = attr["geometrixxNavigation"] || "navigate",
                            value = attr["geometrixxNavigationValue"];
                        return function(scope, element, attr) {
                            element.on('click', function(event) {
                                scope.$apply(function() {
                                    console.log("HybridBridge Plugin CALLED " + HybridBridge);
                                    HybridBridge[action](value, function(){
                                        console.log("Hybrid Bridge Success")
                                    },function(e){
                                        console.log("Hybrid Bridge Error" + e)
                                    });
                                });
                            });
                        };
                    }
                };

            }]);

})(angular);
/*
 ADOBE CONFIDENTIAL
 __________________

  Copyright 2013 Adobe Systems Incorporated
  All Rights Reserved.

 NOTICE:  All information contained herein is, and remains
 the property of Adobe Systems Incorporated and its suppliers,
 if any.  The intellectual and technical concepts contained
 herein are proprietary to Adobe Systems Incorporated and its
 suppliers and are protected by trade secret or copyright law.
 Dissemination of this information or reproduction of this material
 is strictly forbidden unless prior written permission is obtained
 from Adobe Systems Incorporated.
 */
;(function(document, undefined) {


})(document);
