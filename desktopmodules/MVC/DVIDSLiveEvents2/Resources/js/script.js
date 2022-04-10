
(function (window, videojs, moment, $) {
    //https://github.com/kaimallea/isMobile
    !function (a) { var b = /iPhone/i, c = /iPod/i, d = /iPad/i, e = /(?=.*\bAndroid\b)(?=.*\bMobile\b)/i, f = /Android/i, g = /(?=.*\bAndroid\b)(?=.*\bSD4930UR\b)/i, h = /(?=.*\bAndroid\b)(?=.*\b(?:KFOT|KFTT|KFJWI|KFJWA|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|KFARWI|KFASWI|KFSAWI|KFSAWA)\b)/i, i = /Windows Phone/i, j = /(?=.*\bWindows\b)(?=.*\bARM\b)/i, k = /BlackBerry/i, l = /BB10/i, m = /Opera Mini/i, n = /(CriOS|Chrome)(?=.*\bMobile\b)/i, o = /(?=.*\bFirefox\b)(?=.*\bMobile\b)/i, p = new RegExp("(?:Nexus 7|BNTV250|Kindle Fire|Silk|GT-P1000)", "i"), q = function (a, b) { return a.test(b) }, r = function (a) { var r = a || navigator.userAgent, s = r.split("[FBAN"); if ("undefined" != typeof s[1] && (r = s[0]), s = r.split("Twitter"), "undefined" != typeof s[1] && (r = s[0]), this.apple = { phone: q(b, r), ipod: q(c, r), tablet: !q(b, r) && q(d, r), device: q(b, r) || q(c, r) || q(d, r) }, this.amazon = { phone: q(g, r), tablet: !q(g, r) && q(h, r), device: q(g, r) || q(h, r) }, this.android = { phone: q(g, r) || q(e, r), tablet: !q(g, r) && !q(e, r) && (q(h, r) || q(f, r)), device: q(g, r) || q(h, r) || q(e, r) || q(f, r) }, this.windows = { phone: q(i, r), tablet: q(j, r), device: q(i, r) || q(j, r) }, this.other = { blackberry: q(k, r), blackberry10: q(l, r), opera: q(m, r), firefox: q(o, r), chrome: q(n, r), device: q(k, r) || q(l, r) || q(m, r) || q(o, r) || q(n, r) }, this.seven_inch = q(p, r), this.any = this.apple.device || this.android.device || this.windows.device || this.other.device || this.seven_inch, this.phone = this.apple.phone || this.android.phone || this.windows.phone, this.tablet = this.apple.tablet || this.android.tablet || this.windows.tablet, "undefined" == typeof window) return this }, s = function () { var a = new r; return a.Class = r, a }; "undefined" != typeof module && module.exports && "undefined" == typeof window ? module.exports = r : "undefined" != typeof module && module.exports && "undefined" != typeof window ? module.exports = s() : "function" == typeof define && define.amd ? define("isMobile", [], a.isMobile = s()) : a.isMobile = s() }(this);

    // NOTE: module modes
    // Supported Modes: Player, LiveBar
    const DEBUG = false;

    var player, vConfig, hasFlash = false,
        isIE11 = /Trident.*rv[ :]*11\./.test(navigator.userAgent),
        //mute for all safari
        isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        //mute for small screens
        isMuted = isSafari || isMobile.any,
        pollVideoListInterval = 15000,
        rewindButton = videojs.getComponent('Button');

    if (isIE11) {
        try {
            //we don't want flash to attempt to run, we removed the swf
            hasFlash = false;// Boolean(new ActiveXObject('ShockwaveFlash.ShockwaveFlash'));
        } catch (exception) {
            hasFlash = ('undefined' != typeof navigator.mimeTypes['application/x-shockwave-flash']);
        }
    }

    videojs.registerComponent('rewindButton', videojs.extend(rewindButton, {
        constructor: function () {
            rewindButton.apply(this, arguments);
            this.controlText("Rewind");
            //this.addClass('fa').addClass('fa-step-backward');
        },
        handleClick: function () {
            this.player_.currentTime(0);
        }
    }));

    Vue.component('dvids-title', {
        props: ['configuration'],
        template: '<h1 v-if="configuration.dleDNNSettings.showModuleTitle">{{ configuration.dleDNNSettings.moduleTitle }}</h1>'
    });
    Vue.component('dvids-messaging', {
        props: ['configuration', 'playerData'],
        template: '<div v-if="playerData.state == \'showMessaging\'" class="slate-wrap generic-slate-bg">' +
            '<a :href="playerData.messaging.url">' +
            '<div class="slate fade-in" :style="\'background-image:url(\' + configuration.dleDNNSettings.selectedNoEvent+ \');\'" alt="DVIDS Messaging Background" >' +
            '<div v-bind:class="messagingContentWrap" v-cloak>' +
            '<img v-if="!isErrorMessage || !configuration.dleDNNSettings.selectedSealForErrors" class="seal" :src="configuration.dleDNNSettings.selectedSeal" alt="" />' +
            '<img v-else class="seal" :src="configuration.dleDNNSettings.selectedSealForErrors" alt="" />' +
            '<div class="messaging-content">' +
            '<h2>{{ playerData.messaging.title }}</h2>' +
            '<div v-if="playerData.messaging.detail" class="details">' +
            '<p>{{ playerData.messaging.detail }}</p> <br />' +
            '</div>' +
            '<div v-if="playerData.messaging.errors && playerData.messaging.errors.length > 0">' +
            '<ul class="error-list">' +
            '<li v-for="e in playerData.messaging.errors">{{ e }}</li>' +
            '</ul>' +
            '<h3>Please try refreshing your browser.</h3>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</a>' +
            '</div>',
        computed: {
            messagingContentWrap: function () {
                const templateClass = this.templateClass;
                let classes = {
                    'messaging-content-wrap': true,
                    "video-error-message": this.isErrorMessage,
                }
                classes[templateClass] = true;
                return classes;
            },
            isErrorMessage: function () {
                const isError = this.playerData.messaging.errors && this.playerData.messaging.errors.length > 0;
                return isError;
            },
            templateClass: function () {
                return "template-" + this.configuration.dleDNNSettings.templateStyle;
            }
        },
        //mounted: function () {
        //    console.log("@ca64: conf", JSON.stringify(this.configuration.dleDNNSettings.selectedSealForErrors, null, 2));
        //}
    });
    Vue.component('dvids-loading', {
        props: ['configuration', 'playerData'],
        template: '<div v-if="playerData.state == \'showLoading\'" class="slate-wrap">' +
            '<div class="not-initialized slate fade-in" style="\'background-image:url(DesktopModules/MVC/DVIDSLiveEvents2/Resources/img/liveEvent_v4.jpg);\'" ></div></a>' +
            '</div>'

    });
    Vue.component('dvids-snippet', {
        props: ['configuration', 'playerData', 'currentSnippet'],
        mounted: function () {
            var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');

            //console.log('Entered mounted: player state changed to show countdown.');

            if (this.currentSnippet.embed && moment(new Date(this.currentSnippet.begin)).isBefore(adjustedNow)) {

                this.playerData.state = 'showSnippet';
            }
            else if (this.currentSnippet.embed) {
                this.playerData.state = 'showCountDown';
            }

        },
        template: '<div v-if="playerData.state == \'showSnippet\'" class="slate-wrap">' +
            '<div class="snippet slate" ><span v-html="currentSnippet.embed" ></span></div>' +
            '</div>'
    });
    Vue.component('dvids-countdown', {
        props: ['configuration', 'currentVideo', 'currentSnippet', 'playerData'],
        data: function () {
            return {
                countDownString: '',
                countDownTick: null
            }
        },
        methods: {
            itemSelect: function (item) {
                this.$emit('item_select', item);
            },
            getTimeFormat: function (d) { return moment(new Date(d)).format('h:mm a'); },
            getDateFormat: function (d) {
                var dateToUse = new Date(d);
                var monthNum = dateToUse.getMonth();
                var formatToUse = 'dddd, MMM. D, YYYY ';
                if (monthNum > 1 && monthNum < 7) {
                    formatToUse = 'dddd, MMMM D, YYYY';
                }
                else if (monthNum == 8) {
                    formatToUse = 'dddd, [Sept]. D, YYYY';
                }
                return moment(new Date(d)).format(formatToUse);
            }, //Tuesday, Feb 22, 2017
            tickCountDown: function () {
                var _this = this;
                this.countDownTick = setTimeout(function () {
                    if (_this.currentVideo.begin) {
                        _this.countDownString = _this.getCountDownString(_this.currentVideo.begin);
                    }
                    else {
                        _this.countDownString = _this.getCountDownString(_this.currentSnippet.begin);
                    }
                    _this.tickCountDown();
                }, 200);
            },
            //Format - 2 hrs : 35 min : 58 sec
            //Input - currentVideo.begin || currentSnippet.begin
            getCountDownString: function (d) {
                //this.playerData.secondsServerTimeOffset

                var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');  //adjust users local date with server offset
                if (moment(new Date(d)).isAfter(moment(adjustedNow))) {
                    var s = moment.duration(moment(new Date(d)).diff(moment(adjustedNow))).seconds();
                    var m = moment.duration(moment(new Date(d)).diff(moment(adjustedNow))).minutes();
                    var h = moment.duration(moment(new Date(d)).diff(moment(adjustedNow))).hours();

                    h = h ? h + ' hrs : ' : '';
                    m = m || h ? m + ' min : ' : '';

                    if (h == '' && m == '' && s) {
                        s = s + ' seconds';
                    }
                    else if (s || m || h) {
                        s = s + ' sec';
                    }
                    else {
                        s = '';
                    }

                    return '<span class="count-down-time">' + h + m + s + '</span>';
                } else {
                    var _this = this;
                    clearTimeout(this.countDownTick);
                    setTimeout(function () {
                        if (_this.currentVideo.begin) {
                            _this.itemSelect(_this.currentVideo);
                        }
                        else {
                            _this.currentSnippet.type = 'snippets';
                            _this.itemSelect(_this.currentSnippet);
                        }
                    }, 2000);

                    return '<span class="standby">Please stand by, event will begin momentarily.</span>';
                }
            }
        },
        watch: {
            currentVideo: {
                handler: function () {
                    debug.log(this.currentVideo);
                    debug.log(this.currentVideo);

                    debug.log('saw new video from video player');

                }
            },
            'playerData.state': {
                handler: function (newValue, oldValue) {
                    var _this = this;
                    if (newValue == 'showCountDown' && _this.countDownTick === null) {
                        _this.tickCountDown();
                    } else if (newValue != 'showCountDown' && _this.countDownTick !== null) {
                        //console.log('clear timeout');
                        clearTimeout(_this.countDownTick);
                        _this.countDownTick = null;
                    }
                },
                deep: true
            }
        },
        template: '<div class="slate-wrap" v-if="playerData.state == \'showCountDown\'" >' +
            '<div class="slate count-down bg fade-in" :style="\'background-image:url(\' + configuration.dleDNNSettings.selectedBackground + \');\'" alt="" >' +
            '<div class="content-wrap">' +
            '<img class="seal" :src="configuration.dleDNNSettings.selectedSeal" alt="" />' +
            '<div class="content">' +
            '<h2>{{configuration.dleDNNSettings.countdownTitle}}</h2>' +
            '<div v-if="currentVideo.begin" class="time">{{ getTimeFormat(currentVideo.begin) }}</div>' +
            '<div v-if="currentSnippet.begin" class="time">{{ getTimeFormat(currentSnippet.begin) }}</div>' +
            '<div class="details">' +
            '<span v-if="currentVideo.begin" class="date">{{ getDateFormat(currentVideo.begin) }} <span class="small-only"> - {{ getTimeFormat(currentVideo.begin) }}</span></span>' +
            '<span v-if="currentSnippet.begin" class="date">{{ getDateFormat(currentSnippet.begin) }} <span class="small-only"> - {{ getTimeFormat(currentSnippet.begin) }}</span></span>' +
            '<h3  v-if="currentVideo.begin">{{ currentVideo.title }}</h3>' +
            '<h3  v-if="currentSnippet.begin">{{ currentSnippet.title }}</h3>' +
            '<div v-if="countDownTick" v-html="countDownString" class="fade-in count-down"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<img class="video-bug" v-if="configuration.dleDNNSettings.toggleError && configuration.dleDNNSettings.selectedVideoBug" :src="configuration.dleDNNSettings.selectedVideoBug" :data-position="configuration.dleDNNSettings.videoBugPosition" alt="" />' +
            '</div>' +
            '</div>'
    });
    Vue.component('dvids-current-video-title', {
        props: ['configuration', 'currentVideo', 'currentSnippet', 'playerData'],
        template: '<h3 class="dvids-current-video-title" v-if="configuration.dleDNNSettings.showEventTitle && (playerData.state == \'showVideo\' || playerData.state == \'showSnippet\')">{{ currentVideo.title || currentSnippet.title }}</h3>'
    });
    Vue.component('dvids-current-video-description', {
        props: ['configuration', 'currentVideo', 'currentSnippet', 'playerData'],
        template: '<div class="dvids-video-description" v-if="configuration.dleDNNSettings.showEventDesc && (playerData.state == \'showVideo\' || playerData.state == \'showSnippet\')">{{ currentVideo.description || currentSnippet.description }}</div>'
    });
    Vue.component('dvids-countdown-video-title', {
        props: ['configuration', 'currentVideo', 'playerData'],
        template: '<h3 class="dvids-current-video-title" v-if="configuration.dleDNNSettings.showCountdownTitle  && playerData.state == \'showCountDown\'">{{ currentVideo.title || currentSnippet.title }}</h3>'
    });
    Vue.component('dvids-countdown-video-description', {
        props: ['configuration', 'currentVideo', 'playerData'],
        template: '<div class="dvids-video-description" v-if="configuration.dleDNNSettings.showCountdownDesc && playerData.state == \'showCountDown\'">{{ currentVideo.description || currentSnippet.description }}</div>'
    });
    Vue.component('dvids-vod-video-title', {
        props: ['configuration', 'currentSnippet', 'currentVideo', 'playerData'],
        template: '<h3 class="dvids-current-video-title" v-if="playerData.state == \'showRedirect\'" >{{ currentVideo.title || currentSnippet.title }}</h3>'
    });
    Vue.component('dvids-vod-video-description', {
        props: ['configuration', 'currentSnippet', 'currentVideo', 'playerData'],
        template: '<div class="dvids-video-description" v-if="playerData.state == \'showRedirect\'" >{{ currentVideo.description || currentSnippet.description }}</div>'
    });
    Vue.component('dvids-disclaimer', {
        props: ['configuration', 'currentVideo', 'playerData'],
        template: '<div class="dvids-video-disclaimer" v-if="configuration.dleDNNSettings.templateDisclaimer" ><span v-html="configuration.dleDNNSettings.templateDisclaimer" ></span></div>'
    });
    Vue.component('dvids-video', {
        props: ['playerId', 'playerData', 'currentVideo', 'configuration', 'videoList', 'selectFirstItem'],
        // 'itemSelect',
        data: function () {
            return {
                maxErrorCountDown: 10,
            }
        },
        methods: {
            itemSelect: function (item) {
                this.$emit('item_select', item);
            },
            implementloadanalytics: function (id) {
                var analyticsParams = {
                    domain: window.location.hostname,
                    type_id: parseInt(id),
                    original_referrer: window.location.href,
                    type: 'webcast'
                };
                if (DEBUG) console.debug('analyticsParams', analyticsParams);

                DVIDSVideoAnalytics.track('loaded', analyticsParams);
                if (DEBUG) console.debug('DVIDSVideoAnalytics LOAD EVENT');
            },
            implementplayanalytics: function (id) {
                var analyticsParams = {
                    domain: window.location.hostname,
                    type_id: parseInt(id),
                    original_referrer: window.location.href,
                    type: 'webcast'
                };

                DVIDSVideoAnalytics.track('play', analyticsParams);
                if (DEBUG) console.debug('DVIDSVideoAnalytics PLAY EVENT');
            },
            implementendanalytics: function (id) {
                var analyticsParams = {
                    domain: window.location.hostname,
                    type_id: parseInt(id),
                    original_referrer: window.location.href,
                    type: 'webcast'
                };

                DVIDSVideoAnalytics.track('ended', analyticsParams);
                if (DEBUG) console.debug('DVIDSVideoAnalytics ENDED EVENT');
            }
        },
        mounted: function () {
            var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');
            if (this.currentVideo.hls_url && moment(new Date(this.currentVideo.begin)).isBefore(adjustedNow)) {
                var _this = this;
                this.playerData.state = 'showVideo';

                player = videojs(this.playerId, this.playerData.config);
                //console.log(this.playerData.config);
                //TODO: Need to do a VOD tab for mobile. VOD seekbar does not work in mobile devices
                // may need to rewite the plugin which is way out of date
                //if (!this.playerData.isMobile) {
                player.dvrseekbar(); //Add DVR capabilities
                player.getChild('controlBar').addChild('rewindButton', {}, 0);
                //}

                try {
                    //move the bug inside the videojs markup to it shows up behind controls
                    var video = document.getElementById(this.playerId);
                    var bug = video.parentNode.querySelector('.video-bug');
                    if (bug && video) {
                        //pop it in right after the video element
                        video.getElementsByTagName("video")[0] ?
                            video.insertBefore(bug, video.getElementsByTagName("video")[0].nextElementSibling) :
                            video.getElementsByTagName("object")[0] ?
                                video.insertBefore(bug, video.getElementsByTagName("object")[0].nextElementSibling) : 0;
                    }
                } catch (err) { }

                player.on('loadstart', function () {
                    _this.currentVideo.isLoaded = true;
                    _this.maxErrorCountDown = 10;
                    _this.implementloadanalytics(_this.currentVideo.id);
                });
                player.on('ended', function (e) {
                    _this.selectFirstItem();
                    _this.maxErrorCountDown = 10;
                });
                player.on('contentended', function () {
                    _this.implementendanalytics(_this.currentVideo.id);
                })
                player.on('error', function (e) {
                    var error = (this.error());
                    _this.currentVideo.isLoaded = false;

                    // video playback failed - show a message saying why
                    switch (error.code) {
                        case 1:
                            //case MEDIA_ERR_ABORTED:
                            _this.playerData.messaging = {
                                title: 'The following error was detected:',
                                detail: '',
                                url: window.location.href.split('#')[0],
                                errors: [error.message]
                            };
                            _this.playerData.state = 'showMessaging';
                            break;
                        case 2:
                            //case MEDIA_ERR_NETWORK:
                            _this.playerData.messaging = {
                                title: '',
                                url: window.location.href.split('#')[0],
                                errors: [error.message]
                            };
                            _this.playerData.state = 'showMessaging';
                            break;
                        case 3:
                            //case MEDIA_ERR_DECODE:
                            _this.playerData.messaging = {
                                title: 'The following error was detected:',
                                detail: '',
                                url: window.location.href.split('#')[0],
                                errors: [error.message]
                            };
                            _this.playerData.state = 'showMessaging';
                            break;
                        case 4:
                            //case MEDIA_ERR_SRC_NOT_SUPPORTED:
                            debug.warn(error.message);
                            _this.playerData.messaging = {
                                title: 'Adobe Flash Player',
                                detail: 'If you are experiencing video playback problems, please make sure that you have installed the latest version of Adobe Flash, or try viewing in a different browser.',
                                url: _this.playerData.flashUrl,
                                errors: []
                            };
                            _this.playerData.state = 'showMessaging';
                            break;
                        case 'custom':
                            //case custom error :
                            _this.playerData.messaging = {
                                title: 'The following error was detected:',
                                detail: '',
                                url: window.location.href.split('#')[0],
                                errors: [error.message]
                            };
                            _this.playerData.state = 'showMessaging';
                            break;
                        default:
                            _this.playerData.messaging = {
                                title: 'We are experiencing technical difficulties.',
                                detail: 'Please try refreshing your browser.',
                                url: window.location.href.split('#')[0],
                                errors: []
                            };
                            _this.playerData.state = 'showMessaging';
                            break;
                    }

                    if (_this.playerData.errorRetriesRemaining > 0) {
                        setTimeout(function () {
                            _this.itemSelect(_this.currentVideo);
                            --_this.playerData.errorRetriesRemaining;
                        }
                            , 10000);
                    }
                });
                //TODO: For testing. Remove
                player.on(['loadstart', 'canplay', 'error', 'abort', 'playing', 'firstplay', 'pause', 'adplay', 'adplaying', 'adfirstplay',
                    'adpause', 'adended', 'contentplay', 'contentplaying', 'contentfirstplay', 'contentpause',
                    'contentupdate', 'loadeddata', 'loadedmetadata', 'emptied', 'stalled', 'durationchange'], function (e) {
                        //console.log('@ca372: VIDEOJS player event: ', e.type);
                        //console.log(e);
                    });
                player.on('play', function () {
                    _this.implementplayanalytics(_this.currentVideo.id);
                });
                //we have a currentVideo but its not ready yet
            } else if (this.currentVideo.hls_url) {
                this.currentVideo.isLoaded = false;
                this.playerData.state = 'showCountDown';
            }
        },
        template: '<div class="divds-video" v-show="playerData.state == \'showVideo\'">' +
            '<video webkit-playsinline playsinline disablePictureInPicture :id="playerId" :muted="playerData.config.muted" class="video-js vjs-default-skin">' +
            '<source :src="currentVideo.hls_url" type="application/x-mpegURL">' +
            '</video>' +
            '<img class="video-bug" v-if="currentVideo.hls_url && configuration.dleDNNSettings.toggleLiveEventVideoBug && configuration.dleDNNSettings.selectedVideoBug" :src="configuration.dleDNNSettings.selectedVideoBug" :data-position="configuration.dleDNNSettings.liveEventVideoBugPosition" alt="" />' +
            '</div>'

    });
    vConfig = function ($this) {
        return {
            el: '#' + $this.attr('id'),
            computed: {
                useTestData: function () {
                    if (!this.configuration || !this.configuration.dleTestSettings) return false;
                    return this.configuration.dleTestSettings.testUseTestData;
                },
                liveTodayVideoList: function () {
                    var _this = this;
                    if (DEBUG) console.log("liveTodayVideoList");
                    var filtered =  _this.videoList.filter(
                        function (item, i) {
                            return _this.isToday(item.begin) && _this.endsInFuture(item.end) && (item.type === "live_webcasts" || item.type === "snippets");
                        });
                    return filtered;
                },
                liveVideoList: function () {
                    return this.liveTodayVideoList; // backward compatible renaming
                },
                liveNowVideoList: function () {
                    var _this = this;
                    var filtered = _this.videoList.filter(
                        function (item, i) {
                            return _this.isLiveNow(item)
                                && (item.type === "live_webcasts"
                                    || item.type === "snippets");
                        });
                    return filtered;
                },
                liveLaterVideoList: function () {
                    var _this = this;
                    var filtered = _this.videoList.filter(
                        function (item, i) {
                            return !(_this.isLiveNow(item)
                                && (item.type === "live_webcasts"
                                    || item.type === "snippets"));
                        });
                    return filtered;
                },
                upcomingVideoList: function () {
                    var _this = this;
                    var filtered = _this.videoList.filter(function (item) { return _this.isAfterToday(item.begin); });
                    return filtered;
                }
            },
            methods: {
                isToday: function (d) {
                    var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');
                    return new Date(d).toDateString() === new Date(adjustedNow).toDateString();
                },
                isAfterToday: function (d) {
                    var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');
                    return new Date(new Date(d).toDateString()) > new Date(new Date(adjustedNow).toDateString());
                },
                endsInFuture: function (d) {
                    var _this = this;
                    var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');
                    return moment(new Date(d)).isAfter(adjustedNow);
                },
                isLiveNow: function (item) {
                    var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');
                    var start = moment(new Date(item.begin));
                    var end = moment(new Date(item.end));
                    return adjustedNow.isAfter(start) && adjustedNow.isBefore(end);
                },
                itemSelect: function (item) {
                    //item is a webcast, is not already the current video OR we aren't already showing video (may be selected but in countdown)
                    //item may be a currentVideo object which doesnt contain the type field
                    //TODO: write a videoSelect and snippetSelect methods instead

                    if (DEBUG) console.log("s553: itemSelect", item)
                    if (DEBUG) console.trace();

                    if ((item.hls_url || item.type === 'live_webcasts') && (item.id !== this.currentVideo.id || this.playerData.state !== 'showVideo')) {
                        this.currentSnippet = {};
                        this.getCurrentVideo(item);
                        this.updateUrl({ "currentVideo": item.id });
                        //snippet items
                    } else if ((item.embed || item.type === 'snippets') && (item.id !== this.currentSnippet.id || this.playerData.state !== 'showSnippet')) {
                        this.currentVideo = {};
                        this.getCurrentSnippet(item);
                        this.updateUrl({ "currentSnippet": item.id });
                        //already selected and shown (?)
                    } else {
                        //console.warn(['Item selected. Nothing done ', item]);
                        //console.warn(['current values: ', this.currentVideo, this.currentSnippet]);
                    }

                },
                updateUrl: function (params) {
                    //using a pound to prevent url rewriting (does this work everywhere, not just dev?)
                    var paramString = '/#/?' + Object.keys(params).reduce(function (a, k) { a.push(k + '=' + encodeURIComponent(params[k])); return a }, []).join('&');
                    var path = window.location.pathname;
                    //lets not double up on a trailing slash
                    path = path[path.length - 1] === '/' ? path.slice(0, -1) : path;
                    if (DEBUG) console.log("s576: updateUrl", path, paramString);
                    history.replaceState(params, null, path + paramString);
                },
                getUrlParam: function (name, url) {
                    if (!url) url = location.href;
                    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
                    var regexS = "[\\?&]" + name + "=([^&#]*)";
                    var regex = new RegExp(regexS);
                    var results = regex.exec(url);
                    return results == null ? null : results[1];
                },
                getConfiguration: function (callback) {
                    let config = playerConfig && playerConfig.data ? playerConfig.data : {};
                    console.debug('s509: config', this.configuration);
                    this.configuration = config;

                    if (!videojs.browser.IS_IOS && !videojs.browser.IS_ANDROID) {
                        this.playerData.config.autoplay = this.configuration.dvidsParams.autoplay;
                    }
                    typeof callback === 'function' && callback();
                },
                getVideoList: function (callback) {
                    var toDate = new Date();
                    var fromDate = new Date();
                    var _this = this;
                    this.requestStatus = "starting";
                    // This used for date range. The from date starts back minus 4 hours
                    // and the to date is the custom number of days added to the current date.
                    toDate.setDate(toDate.getDate() + this.configuration.dvidsParams.eventListToDays);

                    // Dynamic added parameters to params object.
                    // Passing null or blank parameters to DVIDS will have them return bad results.
                    var params = {};
                    params.include_snippets = _this.configuration.dvidsParams.includeExternals ? 1 : 0;
                    _this.configuration.dvidsParams.apiKey ? params.api_key = _this.configuration.dvidsParams.apiKey : null;
                    _this.configuration.dvidsParams.toggleEventHashtags ? params.hashtag = _this.configuration.dvidsParams.eventHashtags : null;
                    _this.configuration.dvidsParams.toggleEventSort ? params.sortdir = _this.configuration.dvidsParams.eventSort : null;
                    _this.configuration.dvidsParams.toggleEventListToDateRange ? params.from_date = fromDate.toISOString() : null;
                    _this.configuration.dvidsParams.toggleEventListToDateRange ? params.to_date = toDate.toISOString() : null;
                    params.max_results = _this.configuration.dvidsParams.toggleEventListMaxResults ? _this.configuration.dvidsParams.eventListMaxResults : 50;
                    //IE11 will try and cheat and use cached call so add param to force new get
                    isIE11 ? params.ie11RequestTime = encodeURI(new Date().toLocaleString()) : 0;

                    // FAKE_RESPONSE allows for developer tests
                    if (this.useTestData) {
                        params.from_date = "2019-03-09T00:24:00+00:00";
                    }

                    var apiUrl = this.configuration.dvidsParams.dvidsURL + '/live/list',
                        config = {};
                    config.params = params;

                    this.$http.get(apiUrl, config)
                        .then(function (response) {
                            var _this = this;
                            this.videoList = response.body.results;

                            if (this.useTestData) {
                                this.videoList = getFakeData(
                                    this.configuration.dleTestSettings.testLiveNowEventsCount,
                                    this.configuration.dleTestSettings.testLiveTodayEventsCount,
                                    this.configuration.dleTestSettings.testUpcomingEventsCount
                                ).results.slice(0, params.max_results);
                            }

                            this.requestStatus = "complete";
                            // if we are in the loading state the page was not initialized.
                            // Once we get the list we can default to no event selected
                            if (this.playerData.state == 'showLoading') {
                                this.playerData.messaging = {
                                    title: 'There are currently no scheduled events.',
                                    detail: 'Please click here to view video on demand.',
                                    url: this.configuration.dleDNNSettings.noEventsLink,
                                    errors: []
                                };
                                this.playerData.state = 'showMessaging';
                            }
                            // keep track of any offset between user and server time
                            this.playerData.secondsServerTimeOffset = moment.duration(moment(new Date()).diff(moment(new Date(response.body.current_time)))).asSeconds();

                            //If we have a video selected make sure we keep the data in sync
                            this.syncCurrentVideo();
                            typeof callback === 'function' && callback();
                        }, function (response) {
                            this.requestStatus = "error";
                            switch (response.status) {
                                case 0:
                                    this.playerData.messaging = {
                                        title: 'The Following Error Was Detected:',
                                        detail: '',
                                        url: window.location.href.split('#')[0],
                                        errors: ['There was a connectivity issue.']
                                    };
                                    this.playerData.state = 'showMessaging';
                                    break;
                                case 404:
                                    this.playerData.messaging = {
                                        title: 'The Following Error Was Detected:',
                                        detail: '',
                                        url: window.location.href.split('#')[0],
                                        errors: [apiUrl + ' Returned the status code 404.']
                                    };
                                    this.playerData.state = 'showMessaging';
                                    break;
                                default:
                                    if (response.body && response.body.errors) {
                                        this.playerData.messaging = {
                                            title: 'The Following Error Was Detected:',
                                            detail: '',
                                            url: window.location.href.split('#')[0],
                                            errors: response.body.errors
                                        };
                                    } else {
                                        this.playerData.messaging = {
                                            title: 'The Following Error Was Detected:',
                                            detail: '',
                                            url: window.location.href.split('#')[0],
                                            errors: ['Undetermined error.']
                                        };
                                    }
                                    this.playerData.state = 'showMessaging';
                            }
                        });
                },
                getCurrentSnippet: function (item, callback) {
                    var _this = this,
                        apiUrl = apiUrl = this.configuration.dvidsParams.dvidsURL + '/snippets/' + item.id;
                    //console.log('get current snippet');
                    this.$http.get(apiUrl, {
                        params: {
                            api_key: this.configuration.dvidsParams.apiKey
                        }
                    })
                        .then(function (response) {
                            //console.log(response);
                            if (response.body && response.body && response.body.length) {
                                _this.currentSnippet = response.body[0];
                                //console.log(this.currentSnippet);
                                //_this.playerData.state = 'showSnippet';
                            } else {
                                _this.playerData.messaging = {
                                    title: 'The Following Error Was Detected:',
                                    detail: '',
                                    url: window.location.href.split('#')[0],
                                    errors: ['DVIDS did not return a usable snippet.']
                                };
                                _this.playerData.state = 'showMessaging';
                            }

                        }, function (response) {
                            //console.log(response);
                            _this.playerData.messaging = {
                                title: 'The Following Error Was Detected:',
                                detail: '',
                                url: window.location.href.split('#')[0],
                                errors: ['There was an error contacting the DVIDS API.']
                            };
                            _this.playerData.state = 'showMessaging';
                        });
                },
                getCurrentVideo: function (item, callback) {
                    var _this = this,
                        apiUrl = this.configuration.dvidsParams.dvidsURL + '/live/get';
                    this.$http.get(apiUrl, {
                        params: {
                            api_key: this.configuration.dvidsParams.apiKey,
                            id: item.id
                        }
                    })
                        .then(function (response) {
                            //do we have an archived video? If so we need to show the redirect message
                            if (response.body && response.body.results && response.body.results.video_id) {
                                _this.playerData.redirectUrl = this.configuration.dleDNNSettings.dvidsVideoPlayerUrl + response.body.results.video_id;
                                this.currentVideo = {
                                    title: response.body.results.title,
                                    description: response.body.results.description
                                };

                                this.playerData.messaging = {
                                    title: 'This live event has concluded.',
                                    detail: 'Please click here to watch the video on demand.',
                                    url: this.playerData.redirectUrl,
                                    errors: []
                                };
                                this.playerData.state = 'showMessaging';
                            } else {
                                response.body && response.body.results && response.body.results.hls_url ? response.body.results.hls_url = response.body.results.hls_url.replace('http:', 'https:') : 0;
                                this.currentVideo = response.body && response.body.results ? response.body.results : {};
                                typeof callback === 'function' && callback();
                            }

                        }, function (response) {
                            //console.log(response);
                            this.playerData.requestOpen = false;
                            switch (response.status) {
                                case 0:
                                    this.playerData.messaging = {
                                        title: 'The Following Error Was Detected:',
                                        detail: '',
                                        url: window.location.href.split('#')[0],
                                        errors: ['There was a connectivity issue.']
                                    };
                                    this.playerData.state = 'showMessaging';
                                    break;
                                case 404:
                                    this.playerData.messaging = {
                                        title: 'The Following Error Was Detected:',
                                        detail: '',
                                        url: window.location.href.split('#')[0],
                                        errors: [apiUrl + 'Returned the status code 404.']
                                    };
                                    this.playerData.state = 'showMessaging';
                                    break;
                                default:
                                    //console.log(response.body);
                                    //console.log(response.body.errors);
                                    //console.log(response.body && response.body.errors);
                                    if (response.body && response.body.errors) {
                                        this.playerData.messaging = {
                                            title: 'The Following Error Was Detected:',
                                            detail: '',
                                            url: window.location.href.split('#')[0],
                                            errors: response.body.errors
                                        };
                                    } else {
                                        this.playerData.messaging = {
                                            title: 'The Following Error Was Detected:',
                                            detail: '',
                                            url: window.location.href.split('#')[0],
                                            errors: ['Undetermined error']
                                        };
                                    }
                                    this.playerData.state = 'showMessaging';
                            }

                        });
                },
                syncCurrentVideo: function () {
                    if (!this.currentVideo.id && !this.currentSnippet.id) { return; }
                    var videoInList = false;
                    for (var i = 0; i < this.videoList.length; i++) {
                        if (this.videoList[i].id == this.currentVideo.id) {
                            videoInList = true;
                            this.currentVideo.begin = this.videoList[i].begin;
                            this.currentVideo.end = this.videoList[i].end;
                            this.currentVideo.description = this.videoList[i].description;
                            this.currentVideo.title = this.videoList[i].title;
                        } else if (this.videoList[i].id == this.currentSnippet.id) {
                            videoInList = true;
                            this.currentSnippet.begin = this.videoList[i].begin;
                            this.currentSnippet.end = this.videoList[i].end;
                            this.currentSnippet.description = this.videoList[i].description;
                            this.currentSnippet.title = this.videoList[i].title;
                        }
                    }
                    if (!videoInList && this.playerData.state == 'showCountDown') {
                        this.selectFirstItem();
                    }

                    //if video not in list lets make sure it's still valid? Maybe not
                },
                selectFirstItem: function () {
                    this.liveVideoList.length ? this.itemSelect(this.liveVideoList[0]) : 0;
                },
                pollVideoList: function () {
                    var _this = this;
                    setTimeout(function () {
                        _this.getVideoList();
                        _this.pollVideoList();
                    }, pollVideoListInterval);
                },
                implementloadanalytics: function (id) {
                    var analyticsParams = {
                        domain: window.location.hostname,
                        type_id: parseInt(id),
                        original_referrer: window.location.href,
                        type: 'webcast'
                    };
                    if (DEBUG) console.debug('analyticsParams', analyticsParams);

                    DVIDSVideoAnalytics.track('loaded', analyticsParams);
                    if (DEBUG) console.debug('DVIDSVideoAnalytics LOAD EVENT');
                },
                implementplayanalytics: function (id) {
                    var analyticsParams = {
                        domain: window.location.hostname,
                        type_id: parseInt(id),
                        original_referrer: window.location.href,
                        type: 'webcast'
                    };

                    DVIDSVideoAnalytics.track('play', analyticsParams);
                    if (DEBUG) console.debug('DVIDSVideoAnalytics PLAY EVENT');
                },
                implementendanalytics: function (id) {
                    var analyticsParams = {
                        domain: window.location.hostname,
                        type_id: parseInt(id),
                        original_referrer: window.location.href,
                        type: 'webcast'
                    };

                    DVIDSVideoAnalytics.track('ended', analyticsParams);
                    if (DEBUG) console.debug('DVIDSVideoAnalytics ENDED EVENT');
                }
            },
            watch: {
                currentVideo: {
                    handler: function () {
                        //console.log('resetting player');
                        //Need to properly dispose of the player before removing the element.
                        //element then has to go because it can't be re-used by video js. Doesn't fully release? I don't know
                        if (player) { player.dispose(); }     //tell videojs to let go
                        this.$nextTick(function () {          //throw to top of stack because it has to unload itself and all plugins
                            player = null;                    //dispose doesnt actually null out the player so if we call dispose again it will throw an error
                            this.resetPlayer = true;          //turn off the component
                            if (!videojs.browser.IS_IOS && !videojs.browser.IS_ANDROID) {
                                this.playerData.config.autoplay = this.configuration.dvidsParams.autoplay; //something selected, lets play it if autoplay
                            }
                            this.$nextTick(function () {      //re-render the component in the next digest
                                this.resetPlayer = false;     //turn back on the component
                            });
                        });
                    },
                    deep: true
                },
                currentSnippet: {
                    handler: function () {
                        //console.log("snippet");
                        this.resetSnippet = true;
                        this.$nextTick(function () {
                            this.resetSnippet = false;
                        });
                    },
                    deep: true
                }

            },
            mounted: function () {
                var _this = this;

                if (isIE11) {
                    //only allow html5 as we disabled flash, so no flash in techOrder
                    this.playerData.config.techOrder = ["html5"];

                    //update the messaging to denote no flash
                    if (!hasFlash) {
                        this.playerData.messaging = {
                            title: 'Flash Player Not Available',
                            detail: 'HTML5 compatible browser required to watch livestream, try viewing in a different browser.',
                            errors: []
                        };
                        this.playerData.state = 'showMessaging';
                    }
                } else if (videojs.browser.IS_EDGE || videojs.browser.IS_ANDROID) {
                    this.playerData.config.html5 = this.playerData.config.html5 || {};
                    this.playerData.config.html5.hls = this.playerData.config.html5.hls || {};
                    this.playerData.config.html5.hls.overrideNative = true;
                    this.playerData.config.html5.nativeAudioTracks = false;
                    this.playerData.config.html5.nativeVideoTracks = false;
                    this.playerData.config.html5.nativeCaptions = false;
                }

                this.getConfiguration(function () {
                    //callback
                    //check for a video id on the URL
                    if (_this.getUrlParam('currentVideo')) {
                        _this.itemSelect({ id: _this.getUrlParam('currentVideo'), type: 'live_webcasts' });
                    } else if (_this.getUrlParam('currentSnippet')) {
                        _this.itemSelect({ id: _this.getUrlParam('currentSnippet'), type: 'snippets' });
                    }

                    _this.getVideoList(function () {
                        _this.pollVideoList();
                        if (!_this.getUrlParam('currentSnippet') && !_this.getUrlParam('currentVideo')) {
                            const moduleMode = _this.configuration.dleDNNSettings.moduleMode
                            if (DEBUG) console.log("s931: moduleMode", moduleMode);
                            if (moduleMode != 'LiveBar') {
                                _this.selectFirstItem();
                            }
                        }
                    });
                });
            },
            data: {
                requestStatus: 'none',
                moduleId: $this.data('module-id'),
                tabId: $this.data('tab-id'),
                resetPlayer: false,
                resetSnippet: false,
                playerData: {
                    config: {
                        autoplay: false,  //default. can be overridden in dnn configuration
                        controls: true,
                        muted: isMuted,
                        debug: false, //TODO: remove this post dev
                        hls: {
                            withCredentials: false
                        }
                    },
                    isMobile: isMobile.any,
                    state: 'showLoading',
                    messaging: { title: '', detail: '', url: '', errors: [] },
                    redirectUrl: '',
                    secondsServerTimeOffset: 0,
                    errorRetriesRemaining: 0, // Set to zero for now when the text is configurable for technical difficulties this can be set back to 6
                    flashUrl: 'https://get.adobe.com/flashplayer/'
                },
                configuration: {
                    dleDNNSettings: {},
                    dvidsParams: {}
                },
                videoList: [],
                currentVideo: {},
                currentSnippet: {}
            }
        };
    };


    $(document).ready(function () {
        //invoke this way to accomodate n players kicked out of a CMS
        var init = function () {
            $('.dvids-wrap').each(function () {
                var $this = $(this), v;
                v = new Vue(vConfig($this));
            });
        };


        //This was a conditional loading of the plugin in an attempt to fix issues with Android players
        //TODO: Remove completely when mobile issues addressed if possible and
        //      load script in regular way
        //if (!isMobile.any) {
        //desktop only gets this
        //dynamically included because having it on the page breaks mobile. I dont know why (yet)
        var script = document.createElement('script');
        script.onload = function () {
            init();
        };
        //script.src = '/DesktopModules/MVC/DVIDSLiveEvents2/Resources/js/videojs-dvrseekbar-fork.js';
        script.src = '/DesktopModules/SharedLibrary/Plugins/videojs/7.8.3/js/videojs-dvrseekbar-fork.js';
        document.head.appendChild(script); //or something of the likes
        //} else {
        //no seekbar
        //TODO: tabs functionality to switch between live and VOD
        //init();
        //}

    });

    function getFakeResult(type, index, start, end) {
        var id = Math.random() * (30000 - 20000) + 20000;
        return {
            "type": "live_webcasts",
            "id": id,
            "title": "This is "+type+" event #" + (index + 1),
            "description": "This is only a test.",
            "hashtag": "dgovtest",
            "begin": start.toISOString(),
            "end": end ? end : start.add('hours', 2).toISOString(),
            "url": "https:\/\/www.dvidshub.net\/webcast\/27769",
            "hls_url": "https:\/\/live-cdn.dvidshub.net\/webcast\/" + id + "\/master.m3u8",
            "unit_id": "127"
        };
    }

    // Modify this data to your needs.
    function getFakeData(liveNowCount, liveTodayCount, upcomingCount) {
        var results = [];

        liveNowCount = parseInt(liveNowCount);
        liveTodayCount = parseInt(liveTodayCount);
        upcomingCount = parseInt(upcomingCount);

        for (var i = 0; i < liveNowCount; i++) {
            results.push(getFakeResult("LIVE NOW", i, moment(new Date()).subtract('minutes', 30)));
        }

        for (var i = 0; i < liveTodayCount; i++) {
            results.push(getFakeResult("LIVE TODAY", i, moment(new Date()).add('hours', 3 + i)));
        }

        for (var i = 0; i < upcomingCount; i++) {
            results.push(getFakeResult("UPCOMING", i, moment(new Date()).add('days', 1 + i).add('minutes', i)));
        }

        return {
            "messages": [
                "max_results was not supplied.  A maximum of 50 results per page will be returned."
            ],
            "results": results,
            "current_time": moment(new Date()).format(),
        };
    }

})(window, videojs, moment, jQuery);



/*
https://gist.github.com/mdaverde/11305773

Friendly timezone abbreviations in client-side JavaScript

`tzAbbr()` or `tzAbbr(new Date(79,5,24))`
=> "EDT", "CST", "GMT", etc.!

There's no 100% reliable way to get friendly timezone names in all
browsers using JS alone, but this tiny function scours a
stringified date as best it can and returns `null` in the few cases
where no friendly timezone name is found (so far, just Opera).

Device tested & works in:
* IE 6, 7, 8, and 9 (latest versions of all)
* Firefox 3 [through] 16 (16 = latest version to date)
* Chrome 22 (latest version to date)
* Safari 6 (latest version to date)
* Mobile Safari on iOS 5 & 6
* Android 4.0.3 stock browser
* Android 2.3.7 stock browser
* IE Mobile 9 (WP 7.5)

Known to fail in:
* Opera 12 (desktop, latest version to date)

For Opera, I've included (but commented out) a workaround spotted
on StackOverflow that returns a GMT offset when no abbreviation is
found. I haven't found a decent workaround.

If you find any other cases where this method returns null or dodgy
results, please say so in the comments; even if we can't find a
workaround it'll at least help others determine if this approach is
suitable for their project!
*/
var tzAbbr = function (dateInput) {
    var dateObject = dateInput || new Date(),
        dateString = dateObject + "",
        tzAbbr = (
            // Works for the majority of modern browsers
            dateString.match(/\(([^\)]+)\)$/) ||
            // IE outputs date strings in a different format:
            dateString.match(/([A-Z]+) [\d]{4}$/)
        );

    if (tzAbbr) {
        // Old Firefox uses the long timezone name (e.g., "Central
        // Daylight Time" instead of "CDT")
        tzAbbr = tzAbbr[1].match(/[A-Z]/g).join("");
    }

    // Uncomment these lines to return a GMT offset for browsers
    // that don't include the user's zone abbreviation (e.g.,
    // "GMT-0500".) I prefer to have `null` in this case, but
    // you may not!
    // First seen on: http://stackoverflow.com/a/12496442
    // if (!tzAbbr && /(GMT\W*\d{4})/.test(dateString)) {
    // 	return RegExp.$1;
    // }

    return tzAbbr;
};

var debug = new function () {
    this.active = false;
    this.location = window.location.href;
    this.environment = "afpimsstaging.mil"; // or localhost or etc...

    this.log = function (message) {

        if (this.active && this.location.includes(this.environment)) {
            //console.log(message);
        }
    };

    this.warn = function (message) {

        if (this.active && this.location.includes(this.environment)) {
            //console.warn(message);
        }
    };
}
