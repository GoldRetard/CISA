(function (window) {
    $(document).ready(function () {
        // STATE ------------------------------------------------------------------------------------------------------
        var isOverMainNav = false;
        var $header = $("#header-main");
        var $html = $("html");
        var lastScrollTop = 0;
        var delta = { up: 200, down: 2 };
        var resizeTimer;

        // FUNCTIONS --------------------------------------------------------------------------------------------------
        /**
         * Toggles the open/close state of the mobile nav and the fade state of the overlay
         */
        function toggleMobileNav() {
            $html.toggleClass("nav-open");
            $("#mobile-overlay").fadeToggle(200);
        }

        /**
         * Hides or shows the down arrows depending on if mobile menu icon is visible or not
         */
        function processChevronDown() {
            $("nav.main .fa-chevron-down").hide();

            if ($("#nav-burger").is(":hidden")) {
                $("nav.main li.parent.top-level .fa-chevron-down").show();
            }
            else {
                $("nav.main li.parent.top-level .fa-chevron-down").hide();
            }
        }

        /**
         * Turns on hover state for current item and header
         * @param {Object} currentItem jquery object of nav item
         */
        function overMainNav(currentItem) {
            //resets
            isOverMainNav = true;
            $(".main .top-level.hover").removeClass("hover");
            $("#header-main .main").removeClass("parent");

            currentItem.addClass("hover");
            currentItem.closest(".main").addClass("hover");
            $("#header-main").addClass("hover"); //.addClass("border");          

            $("nav.main > ul > li.top-level.parent").on(
                "scroll touchmove mousewheel",
                function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            );
            setTimeout(function () {
                $("#header-main .main").addClass("already-open");
            }, 150);
        }

        /**
         * Removes the hover state for main menu items
         */
        function offMainNav() {
            isOverMainNav = false;
            setTimeout(function () {
                if (!isOverMainNav) {
                    $("#header-main .main").removeClass("already-open");
                }
            }, 100);
            setTimeout(function () {
                if (!isOverMainNav) {
                    $("#header-main .hover").removeClass("hover");
                    $("#header-main").removeClass("border");
                    $(".top-level.hover").removeClass("hover");
                }
            }, 200);
        }

        /**
         * Display the desktop version of the search controls
         */
        function showSearch() {
            var searchOverlayWidth = $(".header-inner .main").outerWidth(true);
            var searchOverlayRight = -60;
            var isIE11 = !!navigator.userAgent.match(/Trident.*rv\:11\./);
            if (isIE11) {
                var navMainWidth = $("nav.main").width();
                var navSearchWidth = $(".nav-search").width();
                searchOverlayRight = -1 * (navMainWidth - navSearchWidth + 10);
            }
            $(".nav-search-icon").hide();
            $(".nav-search").show().animate({ right: searchOverlayRight });
            $(".nav-search").width(searchOverlayWidth);
        }

        /**
         * Hides the desktop version of the search controls
         */
        function hideSearch() {
            var searchOverlayWidth = $(".header-inner .main").outerWidth(true);
            $(".nav-search").hide().animate({ right: -Math.abs(searchOverlayWidth + 200) });
            $(".nav-search-icon").show();
        }

        /**
         * Toggles the focus state of the mobile search controls
         */
        function toggleMobileSearch() {
            $(".search-wrap").toggleClass("focus");
        }

        /**
         * Sets the position of level 2 container elements based on the horizontal space available
         */
        function setLevel2Position() {
            $("nav.main .level2-container").each(function () {
                var w = Math.floor(document.body.getBoundingClientRect().right - $(this).parent("li")[0].getBoundingClientRect().left - 10);
                var thisWidth = $(this).outerWidth();
                if (w < thisWidth) $(this).addClass("pin-right");
                else $(this).removeClass("pin-right");
            });
        }

        function calculateHeaderClass() {
            var y = window.pageYOffset;
            if (y - delta.down > lastScrollTop) {
                //keep track of tucked
                if (y > 1) {
                    $header.addClass("tucked");
                }
                lastScrollTop = y;
            } else if (y + delta.up < lastScrollTop || y < delta.down) {
                $header.removeClass("tucked");
                lastScrollTop = y;
            }

            if (y < delta.down) {
                //keep track of top
                $header.addClass("top");
                top = true;
            } else if (y > delta.down) {
                $header.removeClass("top");
                top = false;
            }

            if (y - delta.down > lastScrollTop || y + delta.up < lastScrollTop)
                //keep track only outside of delta range
                lastScrollTop = y;

        }

        // this function is used to go back to the parent level on the mobile menu
        function closeMobileNavWithDelay(delay) {
            $(".mobile-back, .mobile-level1-placeholder").hide();
            $(".show-active li").hide("slide", { direction: "right" }, delay);
            $(".top-level").show("slide", { direction: "left" }, delay);
            $(".mobile-home").show("slide", { direction: "left" }, delay);
        }

        // EVENTS -----------------------------------------------------------------------------------------------------

        // when the mobile menu icon is clicked, hide all of the down arrows used in the desktop menu
        $("#nav-burger").on("click", function () {
            $("#nav-drawer .fa-chevron-down").hide();
            $("body").addClass("fixed");
            toggleMobileNav();
        });

        // when the mobile menu close (X) icon is clicked, show all of the down arrows used in the desktop menu
        $("#nav-burger.internal").on("click", function () {
            $("#nav-drawer .fa-chevron-down").show();
            $("body").removeClass("fixed");
            closeMobileNavWithDelay(0);
            toggleMobileNav();
        });

        // resize events for the mobile menu
        $(window).on("resize", function () {
            if ($('nav.main').is(":visible") && $html.hasClass("nav-open")) {
                toggleMobileNav();
                closeMobileNavWithDelay(0);
                $("body").removeClass("fixed");
            } else {
                // reset the position of level 2 menus when the screen is resized 
                //(they move left or right aligned depending horizontal space available)
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function () {
                    setLevel2Position();
                }, 250);
            }

            processChevronDown();
        });

        // Hover/focus events for top level menu items
        $("nav.main > ul > li.top-level").on('mouseenter focusin',
            function () {
                overMainNav($(this));
            }
        );
        $("nav.main > ul > li.top-level").on('mouseleave focusout',
            function () {
                offMainNav();
            }
        );

        // When the mouse leaves the document window, turn off the main nav
        $(document).mouseleave(function () {
            offMainNav();
        });

        $(".nav-search-icon").on("click keypress", function (e) {
            if (e.type === "keypress" && e.which === 13 || e.type === "click") {
                showSearch();
            }
        });

        $(".close-icon").on("click keypress", function (e) {
            if (e.type === "keypress" && e.which === 13 || e.type === "click") {
                hideSearch();
            }
        });

        // Mobile menu primary link click event
        $(".drawer-inner .primary > ul > li > a").on("click", function (e) {
            var hasChildren = $(this).parent().hasClass("parent");
            if (
                $(this).parent().hasClass("mobile-level1-placeholder") ||
                $(this).parent().hasClass("mobile-back") ||
                $(this).attr("href") === "/" ||
                !hasChildren
            ) {
                return;
            }

            // Remove href from second level entries.
            $("ul.level2 > li > a").removeAttr("href");

            e.preventDefault();

            $("#nav-drawer .social").hide();

            $(".primary").hide();

            $(".top-level").hide();

            var menuToShow = $(this).parent().find("> .level2-container > ul");
            $(this).parent().find("ul, li").show();
            menuToShow.addClass("show-active");

            var activeParent = $(this);
            $(".mobile-level1-placeholder a").text(activeParent.text());
            // First-level with children must be clickable. Overriding hard-coded href # in Menu.txt for placeholder.
            $(".mobile-level1-placeholder a").attr("href", activeParent.attr("href"));
            $(".mobile-level1-placeholder").show();
            $(".mobile-back").show();
            $(".mobile-home").hide();

            var menuContainer = $("#nav-drawer nav .primary");
            menuToShow.clone().appendTo(menuContainer);

            $(".primary").show("slide", { direction: "right" }, 200);

            $("#nav-drawer .social").delay(200).fadeIn();
        });

        // Mobile menu back button click event
        $(".mobile-back").on("click", function () {
            const delay = 200;
            closeMobileNavWithDelay(delay);
        });

        $(".mobile-back a").on("click", function (e) {
            e.preventDefault();
        });

        // Focus and blur events for the mobile search controls
        $("#header-main input[type=search]").on('focus blur', function () {
            toggleMobileSearch();
        });

        $('#search-main-icon').on('click', function () {
            $('#mobile-search').focus();
        });

        // INITIAL ACTIONS --------------------------------------------------------------------------------------------
        processChevronDown();
        setLevel2Position();

        $("nav.main .top-level .level2 > li > a").attr("tabindex", -1);

        // PW_KYMST-1325: Add external link icons in menu
        $("#header-main > div > nav.main ul li a, #header-main > div > div > nav > div.primary > ul li a").each(function () {
            var a = this;
            if (a.hostname !== window.location.hostname && a.target === "_blank") {
                $(a).append('<i class="fas fa-external-link-alt"></i>');
            }
        });

        // Initially hide the Home button on the primary mobile menu
        $("div.primary > ul > li.top-level a:contains('Home')").hide();

        // Initially hide the mobile-arrow elements for top level elements in the mobile menu that are not parents
        $(".drawer-inner .top-level:not(.parent)").find(".mobile-arrow").remove();


        // If there is a jquery header object, set up the window scroll event, set the header visible and set its class
        // Cases where there might not be a header include landing page style layouts
        if ($header.length > 0) {

            window.onscroll = function () {
                calculateHeaderClass();
            };

            $header.css("visibility", "visible");
            calculateHeaderClass();
        }
    });
})(window);