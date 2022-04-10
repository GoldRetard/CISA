(function (window, videojs, moment, $) {
    // requires templates in Shared/_templates-events-panel.cshtml
    const DEBUG = false;

    function liveBarGetDateFormat(d) {
        //Nov. 10, 2017 - 9:45 AM EST
        if (DEBUG) console.log("shared getDateFormat", this.isToday());
        var dateToUse = new Date(d);
        var monthNum = dateToUse.getMonth();
        var formatToUse = 'MMM. D, YYYY - h:mma ';
        if (monthNum > 1 && monthNum < 7) {
            formatToUse = 'MMMM D, YYYY - h:mma ';
        }
        else if (monthNum === 8) {
            formatToUse = '[Sept]. D, YYYY - h:mma ';
        }

        if (this.isToday(d)) {
            formatToUse = 'h:mma ';
        }
        return moment(d).format(formatToUse) + tzAbbr(dateToUse).replace('US', '');
    }

    function liveBarIsToday(d) {
        var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');
        return new Date(d).toDateString() === new Date(adjustedNow).toDateString();
    }

    Vue.component('events-panel', {
        props: ['moduleMode', 'itemSelect',
            'liveVideoList', 'upcomingVideoList',
            'liveNowVideoList', 'liveLaterVideoList',
            'configuration', 'currentVideo', 'currentSnippet',
            'playerData', 'requestStatus'
        ],
        template: '#dleTemplate-events-panel',
        data: function () {
            return {
                numLiveEventToShow: 0,
                numUpcomingEventsToShow: 0,
                dataLoaded: false,
            }
        },
        watch: {
            'requestStatus': {
                handler: function () {
                    // we catch the status b/c the the status will
                    // continue to change between "starting" and "complete" 
                    // b/c the module polls DVIDSAPI `live/list`
                    if (this.requestStatus === "complete") {
                        this.dataLoaded = true;
                    }
                }
            },
            'configuration.dvidsParams.liveTodayEventMaxResultView': {
                handler: function () {
                    if (DEBUG) console.log("s38: live-events-list", this.configuration.dvidsParams.liveTodayEventMaxResultView);

                    this.numLiveEventsToShow = this.configuration.dvidsParams.liveTodayEventMaxResultView || 0;
                },
            },
            'configuration.dvidsParams.upcomingEventMaxResultView': {
                handler: function () {
                    if (DEBUG) console.log("s45: live upcoming-events-list", this.configuration.dvidsParams.upcomingEventMaxResultView);
                    this.numUpcomingEventsToShow = this.configuration.dvidsParams.upcomingEventMaxResultView || 0;
                },

            }
        },
    });

    Vue.component('live-bar', {
        template: '#dleTemplate-live-bar',
        props: ['liveNowVideoList', 'liveLaterVideoList', 'configuration', 'playerData'],
        data: function () {
            return {
                showLiveBar: true,
                collapsed: true
            };
        },
        computed: {
            isCollapsed: function () {
                return this.collapsed;
            },
            // Display all live now events or the first live later video
            liveBarVideoList: function () {
                if (!this.hasLiveNowVideos && this.liveLaterVideoListFiltered.length > 0) {
                    return this.liveLaterVideoListFiltered.slice(0, 1);
                }

                return this.liveNowVideoList;
            },
            // Creates the video list for collapsible drop down this list will only contain 
            // live later events because all of the live now events will show in the bar
            // if there are any
            expandedVideoList: function () {
                // then return all the later events
                return this.liveNowVideoList.length === 0
                    ? this.liveLaterVideoListFiltered.slice(1)
                    : this.liveLaterVideoListFiltered;
            },
            // Filters the live now video list based on show / hide settings in config 
            liveNowVideoListFiltered: function () {
                if (this.hasLiveNowVideos)
                    return this.liveNowVideoList;

                return [];
            },
            // Filters the live later video list based on show/hide settings in config
            liveLaterVideoListFiltered: function () {
                if (this.configuration.dvidsParams.showLiveTodayList &&
                    this.configuration.dvidsParams.showUpcomingEventsList)
                    return this.liveLaterVideoList;

                if (!this.configuration.dvidsParams.showLiveTodayList &&
                    !this.configuration.dvidsParams.showUpcomingEventsList)
                    return [];

                if (this.configuration.dvidsParams.showLiveTodayList)
                    return this.liveLaterVideoList.filter(function (item) {
                        return this.isLiveToday(item);
                    }.bind(this));

                return this.liveLaterVideoList.filter(function (item) {
                    return !this.isLiveToday(item);
                }.bind(this));
            },
            // Returns the correct title for the live bar
            liveBarTitle: function () {
                if (this.hasLiveNowVideos || (
                    !this.configuration.dvidsParams.showUpcomingEventsList &&
                    !this.configuration.dvidsParams.showLiveTodayList
                ))
                    return this.configuration.dleDNNSettings.liveNowListTitle.trim();

                if (this.hasLiveTodayVideos || !this.configuration.dvidsParams.showUpcomingEventsList) {
                    return this.configuration.dleDNNSettings.liveTodayListTitle.trim();
                }

                return this.configuration.dleDNNSettings.upcomingEventsListTitle.trim();
            },
            // Returns true if the option to show the live now list is true and the list has items
            hasLiveNowVideos: function () {
                return this.configuration.dvidsParams.showLiveNowList && this.liveNowVideoList.length > 0;
            },
            // Returns true if the option to show the live today list is true and if the first item in the list is live today
            hasLiveTodayVideos: function () {
                return this.configuration.dvidsParams.showLiveTodayList && this.isLiveToday(this.liveLaterVideoList[0]);
            },
            // Returns true if there are any videos to display
            hasVideos: function () {
                return this.liveNowVideoListFiltered.length > 0 || this.liveLaterVideoListFiltered.length > 0;
            },
            // Returns the showPanelWhenEmpty config option
            showWhenEmpty: function () {
                return this.configuration.dvidsParams.showPanelWhenEmpty;
            },
            // Returns the length of the expanded video list
            expandedEventsNum: function () {
                return Array.isArray(this.expandedVideoList) ? this.expandedVideoList.length : 0;
            },
            // Returns the correct no events message for the live bar
            liveBarNoEventsMessage: function () {
                if (this.liveNowVideoListFiltered.length > 0 || this.liveLaterVideoListFiltered.length > 0)
                    return '';

                if (this.configuration.dvidsParams.showUpcomingEventsList)
                    return this.configuration.dleDNNSettings.upcomingEventsDefaultText;

                if (this.configuration.dvidsParams.showLiveTodayList)
                    return this.configuration.dleDNNSettings.liveTodayDefaultText;

                return this.configuration.dleDNNSettings.liveNowDefaultText;
            },
            // Returns the liveTodayEventMaxResultView config option
            liveTodayEventLimit: function () {
                return this.configuration.dvidsParams.liveTodayEventMaxResultView;
            },
            // Returns the upcomingEventMaxResultView config option
            upcomingEventLimit: function () {
                return this.configuration.dvidsParams.upcomingEventMaxResultView;
            },
            // Returns the toggleLiveTodayEventMaxResultView config option
            useLiveTodayEventLimit: function () {
                return this.configuration.dvidsParams.toggleLiveTodayEventMaxResultView;
            },
            // Returns the toggleUpcomingEventMaxResultView config option
            useUpcomingEventLimit: function () {
                return this.configuration.dvidsParams.toggleUpcomingEventMaxResultView;
            },
            // Returns true if the eventFilterType config option equals "man"
            useFilter: function () {
                const eventFiltering = this.configuration.dvidsParams.eventFilterType;
                if (eventFiltering === "man") {
                    return true;
                }
                return false;
            }
        },
        methods: {
            closeLiveBar: function () {
                this.showLiveBar = false;
            },
            getDateFormat: liveBarGetDateFormat, // shareable function above
            isEmpty: function (obj) {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key))
                        return false;
                }
                return true;
            },
            isSingleLine: function () {
                if (this.liveNowVideoList.length <= 1) {
                    return true
                }
                return false;
            },
            isLiveNow: function (item) {
                var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');
                var start = moment(new Date(item.begin));
                var end = moment(new Date(item.end));
                return adjustedNow.isAfter(start) && adjustedNow.isBefore(end);
            },
            // Test for if a video starts before midnight today and ends sometime after now
            isLiveToday: function (item) {
                if (!item) return false;
                var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');
                const midnight = new Date();
                midnight.setHours(23, 59, 59, 0);
                var start = moment(new Date(item.begin));
                var end = moment(new Date(item.end));
                var eod = moment(midnight);
                return start.isBefore(eod) && end.isAfter(adjustedNow);
            },
            isToday: liveBarIsToday, // shareable function above 
            toggleCollapse: function (event) {
                if (event.type === 'keyup') {
                    $('.live-bar-container .more').click();
                    return;
                }
                this.collapsed = !this.collapsed;
                if (!this.collapsed) {
                    $(".drop-item").hide().fadeIn(750);
                }
            },
            urlForEvent: function (item) {
                return this.configuration.dleDNNSettings.dvidsLiveEventsUrl + item.id;
            }
        },
    });

    Vue.component('live-bar-list', {
        template: '#dleTemplate-live-bar-list',
        props: ['liveVideoList', 'upcomingVideoList'],

    })
    // live events listing
    Vue.component('live-events-list', {
        template: "#dleTemplate-live-events-list",
        props: ['liveVideoList', 'configuration', 'currentVideo',
            'currentSnippet', 'playerData', 'upcoming-video-list',
            'module-mode'],
        data: function () {
            if (DEBUG) console.log("d-ep22: upcomingNum", this.configuration.dvidsParams.upcomingEventMaxResultView);
            return { eventsToShow: 0 }
        },
        computed: {
            activeClasses: function () {
                return {
                    'live-events-list': this.configuration.dleDNNSettings.liveNowActiveClick === 'on' || this.configuration.dleDNNSettings.liveNowActiveClick === 'man',
                    'upcoming-events-list': this.configuration.dleDNNSettings.liveNowActiveClick === 'off',
                    'events-list': true
                }
            },
        },
        watch: {
            'configuration.dvidsParams.liveTodayEventMaxResultView': {
                handler: function () {
                    if (DEBUG) console.log("s38: live-events-list", this.configuration.dvidsParams.liveTodayEventMaxResultView);

                    this.eventsToShow = this.configuration.dvidsParams.liveTodayEventMaxResultView || 0;
                },
            },
        },
        methods: {
            itemSelect: function (item) {
                if (DEBUG) console.log("dep127: item-select");
                this.$emit('item_select', item);
            },
            activeEvent: function (item, index) {

                return {
                    'active': this.configuration.dleDNNSettings.liveNowActiveClick.toLowerCase() === 'man' ? ((item.id === this.currentVideo.id || item.id == this.currentSnippet.id) && this.isInActiveTimeRange(item)) : (item.id == this.currentVideo.id || item.id == this.currentSnippet.id),
                    'not-active': !(this.configuration.dleDNNSettings.liveNowActiveClick.toLowerCase() == 'man' ? ((item.id == this.currentVideo.id || item.id == this.currentSnippet.id) && this.isInActiveTimeRange(item)) : (item.id == this.currentVideo.id || item.id == this.currentSnippet.id)) && this.configuration.dleDNNSettings.liveNowActiveClick.toLowerCase() != 'off',
                    'customActive': this.configuration.dleDNNSettings.liveNowActiveClick === 'man' && !this.isInActiveTimeRange(item),
                    'all-off': this.configuration.dleDNNSettings.liveNowActiveClick.toLowerCase() === 'off',
                    'fade-in': true,
                    'live-now': this.isLiveNow(item)
                }
            },
            getDateFormat: function (d) {
                var dateToUse = new Date(d);
                var monthNum = dateToUse.getMonth();
                var formatToUse = 'MMM. D, YYYY - h:mma ';
                if (monthNum > 1 && monthNum < 7) {
                    formatToUse = 'MMMM D, YYYY - h:mma ';
                }
                else if (monthNum == 8) {
                    formatToUse = '[Sept]. D, YYYY - h:mma ';
                }
                return moment(d).format(formatToUse) + tzAbbr(dateToUse).replace('US', '');
            },
            isLiveNow: function (item) {
                var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');
                var start = moment(new Date(item.begin));
                var end = moment(new Date(item.end));
                return adjustedNow.isAfter(start) && adjustedNow.isBefore(end);
            },
            isComingUpSoon: function (item) {
                var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');
                var start = moment(new Date(item.begin)).subtract(15, 'minutes');
                var end = moment(new Date(item.end));
                return adjustedNow.isAfter(start) && adjustedNow.isBefore(end);
            },
            isInCustomTime: function (item, numMins) {
                var adjustedNow = moment(new Date()).subtract(this.playerData.secondsServerTimeOffset, 'seconds');
                var start = moment(new Date(item.begin)).subtract(numMins, 'minutes');
                var end = moment(new Date(item.end));
                return adjustedNow.isAfter(start) && adjustedNow.isBefore(end);
            },
            isInActiveTimeRange: function (item) {

                switch (this.configuration.dleDNNSettings.liveNowActiveManualTime) {
                    case 'fifteenMin':
                        return this.isComingUpSoon(item);
                    case 'thirtyMin':
                        return this.isInCustomTime(item, 30);
                    case 'sixtyMin':
                        return this.isInCustomTime(item, 60);
                    case 'niintyMin':
                    case 'ninetyMin':
                        return this.isInCustomTime(item, 90);
                    case 'oneTwentyMin':
                        return this.isInCustomTime(item, 120);
                    default:
                        return false;
                }
            },
            isClickDisabled: function (item) {

                if (this.configuration.dleDNNSettings.liveNowActiveClick == 'on') {
                    this.itemSelect(item);
                } else if (this.configuration.dleDNNSettings.liveNowActiveClick == 'man') {


                    if (this.isInActiveTimeRange(item)) {
                        this.itemSelect(item);
                    }
                }
            },
        },
    });
    // upcoming events listing  
    Vue.component('upcoming-events-list', {
        props: ['module-mode', 'upcomingVideoList', 'configuration', 'playerData',
            'initial-events-to-show'],
        data: function () {
            return { eventsToShow: this.initialEventsToShow }
        },
        watch: {
            // having trouble with this when nested in slot in live-events-list, thus the initial-events-to-show prop 
            'configuration.dvidsParams.upcomingEventMaxResultView': {
                handler: function () {
                    if (DEBUG) console.log("s535: upcoming-events-list", this.configuration.dvidsParams.upcomingEventMaxResultView);
                    this.eventsToShow = this.configuration.dvidsParams.upcomingEventMaxResultView || 0;
                }
            },
        },
        methods: {

            getDateFormat: function (d) {
                //Nov. 10, 2017 - 9:45 AM EST
                var dateToUse = new Date(d);
                var monthNum = dateToUse.getMonth();
                var formatToUse = 'MMM. D, YYYY - h:mma ';
                if (monthNum > 1 && monthNum < 7) {
                    formatToUse = 'MMMM D, YYYY - h:mma ';
                }
                else if (monthNum == 8) {
                    formatToUse = '[Sept]. D, YYYY - h:mma ';
                }
                return moment(d).format(formatToUse) + tzAbbr(dateToUse).replace('US', '');
            }
        },
        template: '#dleTemplate-upcoming-events-list',
    });

})(window, videojs, moment, jQuery);