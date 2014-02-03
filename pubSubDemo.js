if (Meteor.isClient) {

    Meteor.subscribe('serverTime');

    var Time = new Meteor.Collection('time', {
        // Return a nicely formatted object containing server time
        transform: function(doc) {
            var serverTime = doc.date;
            // We assume that server time is a standard UTC value (offset = 0)
            var hh = serverTime.getUTCHours() >= 10 ? serverTime.getUTCHours() : '0' + serverTime.getUTCHours().toString();
            var mm = serverTime.getUTCMinutes() >= 10 ? serverTime.getUTCMinutes() : '0' + serverTime.getUTCMinutes().toString();
            var ss = serverTime.getUTCSeconds() >= 10 ? serverTime.getUTCSeconds() : '0' + serverTime.getUTCSeconds().toString();
            return {hour: hh, minute: mm, second: ss};
        }
    });

    Handlebars.registerHelper('getServerTime', function() {
        if ( Time.findOne() ) return Time.findOne();
        else return false;
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
       subscription.added( 'time', 'not_a_random_id', {date: new Date()} );

       // Remove the subscription on client disconnect
       subscription.onStop(function() {
          delete activeSubscriptions[subscription._session.id];
       });

    });


    // Publish new server time to all active subscribers every one second
    Meteor.setInterval(function() {
        var currentTime = new Date();
        for (var subscriptionID in activeSubscriptions) {
            var subscription = activeSubscriptions[subscriptionID];
            subscription.changed( 'time', 'not_a_random_id', {date: currentTime} );
        }
    }, 1000);

}