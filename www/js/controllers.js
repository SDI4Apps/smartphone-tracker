angular.module('starter.controllers', [])

        .controller('appCtrl', ['$scope', '$rootScope', '$ionicPlatform', function ($scope, $rootScope, $ionicPlatform) {

                var File = s4a.mobile.File;

                $scope.exitApp = function () {
                    navigator.app.exitApp();
                };

            }])
        .controller('settingsCtrl', function ($scope, $rootScope, $ionicModal, $timeout) {

            // Create alias for s4a mobile file system functions
            var File = s4a.mobile.File;
            var FileResponse = s4a.mobile.FileResponse;

            $scope.saveSettings = function () {
                File.writeFile('SensLog.settings', $rootScope.settings)
                        .then(function (fileResponse) {
                            if (fileResponse.isSuccess()) {
                                $rootScope.console.log('Success', 3000);
                            } else {
                                $rootScope.console.log('Error', 3000);
                            }
                        });
            };

            $scope.loadSettings = function () {
                File.readFile('SensLog.settings')
                        .then(function (fileResponse) {
                            $rootScope.console.log(fileResponse.data);
                        });
            };
        })
        .controller('trackCtrl', function ($scope, $parse) {

            // Short-hand alias for SensLog from s4a.js
            var SensLog = s4a.data.SensLog;
            // Handle to stop clock
            var _clockInterval = null;
            // Handle to stop collecting observations
            var _observationInterval = null;
            // Handle to stop watching geolocation
            var _geolocationWatchId = null;
            // Variable to hold whether tracking is ongoing
            $scope.isTracking = false;
            // Variable to hold elapsed seconds since start
            $scope.elapsed = 0;
            // Variable to hold number of observations collected during tracking session
            $scope.observations = 0;
            // Measurement container for human sensor values
            $scope.humanSensor = {
                temperature: 7.5,
                precipitation: 0
            };
            // Measurement container for gps sensor
            $scope.gpsSensor = {
                lon: 6.118,
                lat: 49.582,
                speed: 2
            };
            // Array to hold track log entries
            $scope.trackLog = [];
            /**
             * Modify the value of a form input field
             * 
             * @param {String} pModel
             * @param {Number} pStep
             * @param {Number} pDefault
             */
            $scope.chgInp = function (pModel, pStep, pDefault) {
                var mGetter = $parse(pModel);
                var mSetter = mGetter.assign;
                var mVal = mGetter($scope);
                if (mVal === undefined || mVal === '' || mVal === null) {
                    mSetter($scope, pDefault);
                } else {
                    mSetter($scope, +mGetter($scope) + pStep);
                }
            };
            /**
             * Collect observation and add to track log
             * 
             */
            var getObservation = function () {

                if ($scope.trackLog.length >= 10) {
                    $scope.trackLog.shift();
                }

                var d = new Date();
                $scope.trackLog.push({
                    time: d,
                    lon: $scope.gpsSensor.lon,
                    lat: $scope.gpsSensor.lat,
                    speed: $scope.gpsSensor.speed,
                    temperature: $scope.humanSensor.temperature,
                    precipitation: $scope.humanSensor.precipitation
                });
                // Insert position
                SensLog.insertPosition($scope.gpsSensor.lat, $scope.gpsSensor.lon, 3, d);
                // Insert speed
                SensLog.insertObservation($scope.gpsSensor.speed, 3, 23, d);
                // Insert temperature
                SensLog.insertObservation($scope.humanSensor.temperature, 3, 21, d);
                // Insert precipitation
                SensLog.insertObservation($scope.humanSensor.precipitation, 3, 22, d);
                // Increment observations
                $scope.observations++;
                if (!$scope.$$phase) {
                    $scope.$digest();
                }

            };
            /**
             * Generate a random number between low and high
             * 
             * @param {Number} low
             * @param {Number} high
             * @param {Boolean} [round=false]
             * @returns {Number}
             */
            var rnd2 = function (low, high, round) {

                if (round === undefined) {
                    round = false;
                }

                var range = high - low;
                var rand = (Math.random() * range);
                if (round === true) {
                    return Math.round(low + rand);
                } else {
                    return (low + rand);
                }
            };
            /**
             * Start tracking
             * 
             * @param {type} observationFrequency
             */
            $scope.start = function (observationFrequency) {

                if (observationFrequency === undefined) {
                    observationFrequency = 10;
                }

                $scope.isTracking = true;
                $scope.elapsed = 0;
                $scope.observations = 0;
                // Set clock to update every second
                _clockInterval = setInterval(function () {
                    $scope.elapsed++;
                    if (!$scope.$$phase) {
                        $scope.$digest();
                    }
                }, 1000);
                // Set to collect observations as per obs freq
                _observationInterval = setInterval(function () {
                    getObservation();
                }, observationFrequency * 1000);
                // Set to watch positions as per obs freq
                if (navigator.geolocation !== undefined) {
                    _geolocationWatchId = navigator.geolocation.watchPosition(function (position) {
                        $scope.gpsSensor.lon = 0 + position.coords.longitude;
                        $scope.gpsSensor.lat = 0 + position.coords.latitude;
                        $scope.gpsSensor.speed = 0 + position.coords.speed;
                    }, function (error) {
                        $scope.gpsSensor.lon += rnd2(-0.005, 0.005);
                        $scope.gpsSensor.lat += rnd2(-0.005, 0.010);
                        $scope.gpsSensor.speed = 2;
                    }, {
                        enableHighAccuracy: true,
                        timeout: (observationFrequency * 1000),
                        maximumAge: 10000
                    });
                }




            };
            /**
             * Stop tracking
             * 
             */
            $scope.stop = function () {
                $scope.isTracking = false;
                $scope.trackLog.length = 0;
                $scope.observations = 0;
                clearInterval(_clockInterval);
                clearInterval(_observationInterval);
                if (navigator.geolocation !== undefined && _geolocationWatchId !== null) {
                    navigator.geolocation.clearWatch(_geolocationWatchId);
                }
            };
        });
