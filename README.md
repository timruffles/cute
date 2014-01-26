# Cute

Angular has some great ideas, but it's not cute. It's huge.

Cute doesn't try to do nearly as much. It aims to be familar to AngularJS developers. It wants to fit inside your head, and tries not to surprise you.

    <div te-init='s.hello = "hi"'>
      <a href='' te-click='alert(s.hello)'>Click me</a>
      <button te-click='s.counter += 1'>Add one</button>
      <span te-bind='s.counter'></span>
    </div>

Check out a [demo page](http://timruffles.github.io/cute.js).

## Anti-goals

- Dependency injection. JS has a great way to do DI: functions and prototypes
- Configuarability. Costs too much. One attribute style for cute core components: hyphenated. One way to bind data: `te-bind`
- Parsers. It's Just Javascript. No "Angular script".
- Making everything else "legacy code". Bet on Javascript: all frameworks will be legacy code, JS won't
- 'Deep equality'. Identity is easy with clean code. If you want non-strict equality, supply a `.isEqual(to)` function on your objects.

## Goals

- Small
- Sole dependency: underscore.js
- Native DOM: there's not much to do
- Your own AJAX + simple wrapper functions to update scopes correctly
- Well tested

## Coding standards

- Negative (don't do this) style is enforced by `jshint`
- The compiler can add those semicolons for you - remember to prefix any lines starting with `[]` literals or `()` expressions, and start files with a semi. PRs won't be rejected if they contain semis tho, but give it a try, perhaps you'll like it (your fingers will)
- Prefer clarity to concision. This is a library for reading as much as using


