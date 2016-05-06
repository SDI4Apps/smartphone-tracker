angular.module('starter', ['ionic', 'starter.controllers'])

        .run(['$ionicPlatform', '$rootScope',
            function ($ionicPlatform, $rootScope) {

                // Create local alias
                var File = s4a.mobile.File;

                $ionicPlatform.ready(function () {
                    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                    // for form inputs)
                    if (window.cordova && window.cordova.plugins.Keyboard) {
                        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                        cordova.plugins.Keyboard.disableScroll(true);
                    }

                    if (window.StatusBar) {
                        StatusBar.styleDefault();
                    }

                    $rootScope.isConfigured = false;

                    $rootScope.settings = {
                        sensLogUrl: null,
                        username: null,
                        password: null,
                        unitId: null
                    };

                    $rootScope.logOutput = '';

                    /**
                     * Set whether tracker app is configured
                     * 
                     * @param {Boolean} isConfigured
                     */
                    $rootScope.setConfigured = function (isConfigured) {
                        $rootScope.$safeApply(function () {
                            $rootScope.isConfigured = isConfigured;
                        });
                    };

                    /**
                     * Set the settings after loading them from a file
                     * 
                     * @param {Object} settings
                     */
                    $rootScope.setSettings = function (settings) {
                        $rootScope.$safeApply(function () {
                            $rootScope.settings = settings;
                        });
                    };

                    $rootScope.$safeApply = function (fn) {
                        var phase = this.$root.$$phase;
                        if (phase == '$apply' || phase == '$digest') {
                            if (fn && (typeof (fn) === 'function')) {
                                fn();
                            }
                        } else {
                            this.$apply(fn);
                        }
                    };

                    $rootScope.hideLog = function () {
                        $rootScope.$safeApply(function () {
                            $rootScope.logOutput = '';
                        });
                    };

                    /**
                     * Create console object
                     */
                    $rootScope.console = {
                        /**
                         * Log message
                         * 
                         * @param {String} msg
                         */
                        log: function (msg, timeout) {
                            console.log(msg);
                            if (isNaN(timeout)) {
                                timeout = 3000;
                            }
                            $rootScope.$safeApply(function () {
                                $rootScope.logOutput = msg;
                                jQuery('#logOutput').fadeIn(250, function () {
                                    setTimeout(function () {
                                        jQuery('#logOutput').fadeOut(500, function () {
                                            $rootScope.logOutput = '';
                                        });
                                    }, timeout);
                                });
                            });
                        },
                        clear: function () {
                            $rootScope.$safeApply(function () {
                                $rootScope.logOutput = '';
                            });
                        }
                    };
                    $rootScope.$on('$routeChangeStart', function (event) {

                        if (!$rootScope.isConfigured) {
                            event.preventDefault();
                            $location.path('/app/settings');
                        }

                    });

                    /**
                     * On load load stored settings
                     * 
                     */
                    File.readFile('SensLog.settings').then(function (fileResponse) {
                        if (fileResponse.isSuccess()) {
                            $rootScope.setSettings(fileResponse.data);
                            $rootScope.setConfigured(true);
                        } else {
                            $rootScope.setConfigured(false);
                        }
                    });

                });
            }])

        .config(function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                    .state('app', {
                        url: '/app',
                        abstract: true,
                        templateUrl: 'templates/app.html',
                        controller: 'appCtrl'
                    })
                    .state('app.track', {
                        url: '/track',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/track.html',
                                controller: 'trackCtrl'
                            }
                        }
                    })
                    .state('app.settings', {
                        url: '/settings',
                        views: {
                            'menuContent': {
                                templateUrl: 'templates/settings.html',
                                controller: 'settingsCtrl'
                            }
                        }
                    });

            // if none of the above states are matched, use this as the fallback
            $urlRouterProvider.otherwise('/app/track');
        });
