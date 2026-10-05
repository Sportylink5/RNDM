RNDM Chat v24.2 — Admin button visibility

The Admin Center link is hidden natively with the HTML hidden attribute.
It is shown only after Supabase confirms app_role is owner, admin or moderator.
Ordinary users and logged-out visitors never see the button.
The admin.html page still performs its own server-backed role check; hiding the button is only UI, not the security boundary.
