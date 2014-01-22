# Cute

Angular has some great ideas, but it's not cute. It's huge.

Cute doesn't try to do nearly as much. It aims to be familar to AngularJS developers. It wants to fit inside your head, and tries not to surprise you.

    <div te-init='s.hello = "hi"'>
      <a href='' te-click='alert(s.hello)'>Click me</a>
      <button te-click='s.counter += 1'>Add one</button>
      <span te-bind='return s.counter'></span>
    </div>

Check out a [demo page](http://timruffles.github.io/cute.js).

## Anti-goals

- JS has a great way to do dependecy injection: functions and prototypes
- Configuarability costs too much. One attribute style for cute core components: 'te-'
- It's Just Javascript. No "Angular script".
- Plays badly with "legacy code". Bet on Javascript: all frameworks will be legacy code, JS won't
- Avoid problems around identity but enforcing clean code. If you want non-strict equality, supply a hashing fn for good performance

## Goals

- Small
- Sole dependency: underscore.js
- Native DOM: there's not much to do
- Your own AJAX + simple wrapper functions to update scopes correctly





