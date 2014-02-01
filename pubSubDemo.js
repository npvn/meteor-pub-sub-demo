if (Meteor.isClient) {

    Meteor.subscribe('serverTime', function() {
        // onReady callback: trigger 'home' template rendering
        Session.set('subscriptionIsReady', true);
    });

    var Time = new Meteor.Collection('time');

    Handlebars.registerHelper('getServerTime', function() {
        var serverTime = Time.findOne();
        var hh = serverTime.hour >= 10 ? serverTime.hour : '0' + serverTime.hour.toString();
        var mm = serverTime.minute >= 10 ? serverTime.minute : '0' + serverTime.minute.toString();
        var ss = serverTime.second >= 10 ? serverTime.second : '0' + serverTime.second.toString();
        return {hour: hh, minute: mm, second: ss};
    });

    Handlebars.registerHelper('subscriptionIsReady', function() {
        return Session.get('subscriptionIsReady');
    });

}



if (Meteor.isServer) {


    // Current active client subscriptions
    var activeSubscriptions = { };


    // Publication
    Meteor.publish('serverTime', function() {

       // 'this' inside publish function is the subscription object for each particular subscribed client
       var subscription = this;

       // Each time a new client subscribe, store the subscription object for later management
       activeSubscriptions[subscription._session.id] = subscription;

       // Push initial time value to client
       subscription.added('time', 'not_a_random_id', getTime());

       // Trigger subscriber's onReady callback
       subscription.ready();

       // Remove the subscription on client disconnect
       subscription.onStop(function() {
          delete activeSubscriptions[subscription._session.id];
       });

    });


    // Publish new server time to all active subscribers every one second
    Meteor.setInterval(function() {
        for (var subscriptionID in activeSubscriptions) {
            var subscription = activeSubscriptions[subscriptionID];
            subscription.changed('time', 'not_a_random_id', getTime());
        }
    }, 1000);


    // Generate new server time
    getTime = function() {
        var d = new Date();
        return { hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() };
    };

}