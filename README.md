# EventSync

## wtf?
Syncs events across browsers and machines etc.

## But...but why?
It is a part of Nucleus(IDE), which is an in-browser IDE for collaboratively editting meteor apps. Nucleus has this feature which allow you to follow other users. You can see where other user clicks, what page they navigate etc. You log in when they log in, you log out when they do so. It even work in the editor itself so you can see which file other user has opened, what they are editting etc. For science of course, nothing creepy about it.

Although it is built as a part of Nucleus, I thoght of making it an independent package so it could be used outside Nucleus as well. For testing etc. There's that browser-sync thingy for other apps (this package is "inspired" from browser-sync).

This package basically make your app collaborative in real time. It don't have user support yet though. So once activated, all the users are following each other, what one user does, all the (activated) users do the same thing. Don't think in terms of "users" when you use this package, think in terms of "clients". They are all same in event-sync's eyes.

Still useful for testing purposes (may be).

## How to install it?
```sh
meteor add nucleuside:event-sync
```

## How to use it?
It exposes `EventSync` global to your app. Two methods for general purpose usage.
- `EventSync.start()` - start syncing events
- `EventSync.stop()`  - stop syncing events

## Which events do it sync?
- Click
- Form (text input, checkboxe/radio toggles, submit events)
- Login/logout
- Location change (for iron-router)
- Scroll

## Can I sync only selected events?
Nope. Not implemented yet (not gonna implement any time soon). If you need something, please go ahead and fork it, create a PR. Fee free to ask for feature requests, I'll give detailed reply about how you can implement it, but probably won't implement it for you. You might be lazy but you can't beat me.

## You are a jerk
😢 You broke my heart 💔
