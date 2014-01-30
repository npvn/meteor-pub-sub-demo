if (Meteor.isClient) {

    Meteor.subscribe('serverTime', function() {
        // onReady callback
        document.body.appendChild(Meteor.render(Template.home));
    });

    var Time = new Meteor.Collection('time');

    Handlebars.registerHelper('getServerTime', function() {
        var serverTime = Time.findOne();
        var hh = serverTime.hour >= 10 ? serverTime.hour : '0' + serverTime.hour.toString();
        var mm = serverTime.minute >= 10 ? serverTime.minute : '0' + serverTime.minute.toString();
        var ss = serverTime.second >= 10 ? serverTime.second : '0' + serverTime.second.toString();
        return {hour: hh, minute: mm, second: ss};
    });

}



if (Meteor.isServer) {

    // Current active client subscriptions
    var activeSubscriptions = { };

    // Publication
    Meteor.publish('serverTime', function() {

       var randomID = Math.round(Math.random() * 10000000000000);

       // 'this' inside publish function is the subscription object for each particular subscribed client
       var subscription = this;

       // Each time a new client subscribe, store the subscription object for later management
       subscription._documentID = randomID; // save this for using changed() method later
       activeSubscriptions[subscription._session.id] = subscription;

       // Push initial time value to client
       var initialTime = getTime();
       subscription.added('time', randomID, {
           hour: initialTime[0],
           minute: initialTime[1],
           second: initialTime[2]
       });
       // Trigger subscriber's onReady callback
       subscription.ready();

       // Push new time to client every second
       var pushInterval = Meteor.setInterval(function() {

           /* This approach of using activeSubscriptions is for demonstrative purpose only
            * A leaner approach is commented below */
           for (var subscriptionID in activeSubscriptions) {
               var subscription = activeSubscriptions[subscriptionID];
               var newTime = getTime();
               subscription.changed('time', subscription._documentID, {
                   hour: newTime[0],
                   minute: newTime[1],
                   second: newTime[2]
               });
               // Trigger subscriber's onReady callback
               subscription.ready();
           }


           /*** Leaner way ***/
           /*var newTime = getTime();
           subscription.changed('time', randomID, {
               hour: newTime[0],
               minute: newTime[1],
               second: newTime[2]
           });
           // Trigger subscriber's onReady callback
           subscription.ready();*/

       }, 1000);


       // Remove the subscription and clear pushing interval on client disconnect
       subscription.onStop(function() {
          delete activeSubscriptions[subscription._session.id];
          Meteor.clearInterval(pushInterval);
       });

    });


    getTime = function() {
        var d = new Date();
        return [ d.getHours(), d.getMinutes(), d.getSeconds() ];
    };

}


