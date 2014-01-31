if (Meteor.isClient) {

    Meteor.subscribe('serverTime', function() {
        // onReady callback: render 'home' template
        Handlebars._default_helpers.renderHome();
    });

    var Time = new Meteor.Collection('time');

    Handlebars.registerHelper('getServerTime', function() {
        var serverTime = Time.findOne();
        var hh = serverTime.hour >= 10 ? serverTime.hour : '0' + serverTime.hour.toString();
        var mm = serverTime.minute >= 10 ? serverTime.minute : '0' + serverTime.minute.toString();
        var ss = serverTime.second >= 10 ? serverTime.second : '0' + serverTime.second.toString();
        return {hour: hh, minute: mm, second: ss};
    });

    Handlebars.registerHelper('renderHome', function() {
        document.body.appendChild(Meteor.render(Template.home));
    });

}



if (Meteor.isServer) {


    // Current active client subscriptions
    var activeSubscriptions = { };


    // Publication
    Meteor.publish('serverTime', function() {

       var randomID = Random.id();

       // 'this' inside publish function is the subscription object for each particular subscribed client
       var subscription = this;

       // Each time a new client subscribe, store the subscription object for later management
       subscription._documentID = randomID;
       activeSubscriptions[subscription._session.id] = subscription;

       // Push initial time value to client
       subscription.added('time', randomID, getTime());

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
            subscription.changed('time', subscription._documentID, getTime());
        }
    }, 1000);


    // Generate new server time
    getTime = function() {
        var d = new Date();
        return { hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() };
    };

}