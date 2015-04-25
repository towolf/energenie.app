"use strict";
var submit = function(args, el) {
  XHR.get('/gembird', args, function(x, r) {
      if (r.response === true) {
          el.classList.add('powered');
          el.classList.remove('unpowered');
      } else if (r.response === false) {
          el.classList.add('unpowered');
          el.classList.remove('powered');
      } else if (Array.isArray(r.response)) {
          updatePlugs(r.response);
      } else {
          console.error('returned strange object: \n\n', r.response);
          //debugger;
      }

      el.classList.remove('pulse');
      setTimeout(function() {
          el.classList.add('pulse');
      }, 1);
  });
};

var pollStatus = function() {
  XHR.poll(1, '/gembird', {'action': 'get'}, function(x, r) {
    if (Array.isArray(r.response)) {
        updatePlugs(r.response);
    } else {
        console.warn('While polling status:', r.response);
    }
  });
};

var pollSchedules = function() {
  XHR.get('/gembird', {'action': 'get_schedule'}, function(x, r) {
        updateSchedules(r.response);
  });
  XHR.poll(5, '/gembird', {'action': 'get_schedule'}, function(x, r) {
    if (Array.isArray(r.response)) {
        updateSchedules(r.response);
    } else {
        console.warn('While polling schedules:', r.response);
    }
  });
};

var updatePlugs = function(state) {
    var buttons = document.getElementsByTagName('button');
    for (var i = 0; i < buttons.length; i++) {
        var e = buttons[i].parentElement;
        if (state[i] === true) {
            e.classList.add('powered');
            e.classList.remove('unpowered');
        } else if (state[i] === false) {
            e.classList.add('unpowered');
            e.classList.remove('powered');
        } else {
            debugger;
        }
    }
};

var updateSchedules = function(data) {
    var schedules = document.getElementsByClassName('schedule');
    for (var i = 0; i < schedules.length; i++) {
        var s = schedules[i];
        var string = '';
        var d = data[i];
        var t = 0;
        var ts = moment.unix(d['ts']);
        var now = moment();
        ts.seconds(0);

        moment.relativeTimeThreshold('s', 5); 

        if (d.schedule.length == 0) {
            s.innerText = '';
        } else {
            if (d.loop) {
                var first = d.schedule[0].sleep * 60000;
                for (var j = 1; j < d.schedule.length; j++) {
                    t += d.schedule[j].sleep * 60000;
                }
                var period = d.loop * 60000 + t; 
                if (ts.clone().add(first + t).isBefore(now)) {
                     var count = Math.ceil((now - (ts + first + t)) / period);
                     ts.add(count * period);
                }
            }
            string = 'Scheduled to power';
            for (var j = 0; j < d.schedule.length; j++) {
                ts.add(d.schedule[j].sleep, 'minutes');
                string += ' <span class=sched' + (d.schedule[j].power ? 'on>on' : 'off>off') + '</span> '
                string += '<span class=time title="' + ts.calendar() + '">' + ts.fromNow() + '</span>, ';
            }
            if (d.loop) {
                string += ' and loop after ' + moment.duration(period).humanize() + ' (' + moment.duration(period).toString() + ')';
            }
            s.innerHTML = string;
        }
    }
};

var togglePlug = function(outlet) {
    submit({'action': 'toggle', 'outlet': outlet},
           document.getElementById('outlet' + outlet).parentElement);
};

Mousetrap.bind(['1'], function(e) {
    togglePlug(1);
});

Mousetrap.bind(['2'], function(e) {
    togglePlug(2);
});

Mousetrap.bind(['3'], function(e) {
    togglePlug(3);
});

Mousetrap.bind(['4'], function(e) {
    togglePlug(4);
});


// Suspend XHR requests when tab is not visible
(function() {
  var hidden = 'hidden';

  if (hidden in document)
    document.addEventListener('visibilitychange', onchange);
  else if ((hidden = 'mozHidden') in document)
    document.addEventListener('mozvisibilitychange', onchange);
  else if ((hidden = 'webkitHidden') in document)
    document.addEventListener('webkitvisibilitychange', onchange);

  function onchange(evt) {
    if (document[hidden]) {
      XHR.halt();
    } else {
      XHR.run();
    }
  }
})();

window.onload = function() {

    (function() {
        var buttons = document.getElementsByTagName('button');
        for (let i = 0; i < buttons.length; i++) {
            let e = buttons[i].parentElement;

            e.addEventListener('click', function() {
                var t = this;
                if (t.classList.contains('locked')) {
                    t.classList.remove('locked');
                    t.classList.add('unlocking');
                    setTimeout(function() {
                        t.classList.remove('unlocking');
                        t.classList.add('unlocked');
                    }, 300);
                }
            });

            buttons[i].addEventListener('click', function(t) {

                t.preventDefault(), t.stopPropagation();

                submit({'action': 'toggle', 'outlet': i + 1}, e);
            });
        }
    })();

    pollStatus();
    pollSchedules();

};
