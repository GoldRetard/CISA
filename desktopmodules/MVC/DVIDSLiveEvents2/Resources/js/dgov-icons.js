(function () {
    // requires templates in Shared/_templates-dgov-icons.cshtml 
    const DEBUG = false; 
    if (DEBUG) console.log("dgov-icon-load"); //NOSONAR
    Vue.component('dgov-chevron-down', {
        template: '#dgovTemplate-dgov-chevron-down',
    });
    Vue.component('dgov-chevron-up', {
        template: '#dgovTemplate-dgov-chevron-up',
    });
    Vue.component('dgov-close', {
        template: '#dgovTemplate-dgov-close',
    });
    Vue.component('dgov-live-now', {
        template: '#dgovTemplate-dgov-live-now',
    });
})();
