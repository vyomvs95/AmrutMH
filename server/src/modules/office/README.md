# office — the shell

Signing in and out, the home screen, and your own account.

`handleAnonymous(ctx)` runs before anyone is known: it is what serves the sign-in
page, checks the password and sets the cookie. It also holds the limit of 8
attempts per e-mail and address per 15 minutes.

`handle(ctx)` runs for people already signed in, and builds the home screen from
each module's `summary(user)`.

Not built yet: changing your own password, and a way to reset a forgotten one.
