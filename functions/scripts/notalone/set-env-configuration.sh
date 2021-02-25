#!/bin/sh
firebase functions:config:set circle.key="{BEARER}"

firebase functions:config:set circle.notifications.reminder.de.title="Bonjour!" circle.notifications.reminder.de.body="Wie fühlen Sie sich heute?"
firebase functions:config:set circle.notifications.reminder.en.title="Bonjour!" circle.notifications.reminder.en.body="How are you today?"

firebase functions:config:set circle.notifications.emergency.de.title="Bonjour!" circle.notifications.emergency.de.body="{0} meldet sich nicht!"
firebase functions:config:set circle.notifications.emergency.en.title="Bonjour!" circle.notifications.emergency.en.body="{0} did not report!"

firebase functions:config:set circle.notifications.state.de.title="Bonjour!"
firebase functions:config:set circle.notifications.state.de.body.super="{0} fühlt sich heute sehr gut." circle.notifications.state.de.body.well="{0} fühlt sich heute gut." circle.notifications.state.de.body.okay="{0} fühlt sich heute soso lala." circle.notifications.state.de.body.not_well="{0} fühlt sich heute nicht so gut." circle.notifications.state.de.body.bad="{0} fühlt sich heute nicht gut."
firebase functions:config:set circle.notifications.state.en.title="Bonjour!"
firebase functions:config:set circle.notifications.state.en.body.super="{0} feels super today." circle.notifications.state.en.body.well="{0} feels well today." circle.notifications.state.en.body.okay="{0} feels okay today." circle.notifications.state.en.body.not_well="{0} feels not so well today." circle.notifications.state.en.body.bad="{0} feels not well today."

firebase functions:config:set circle.notifications.connection.de.title="Bonjour!" circle.notifications.connection.de.body="{0} ist dem Team beigetreten!"
firebase functions:config:set circle.notifications.connection.en.title="Bonjour!" circle.notifications.connection.en.body="{0} joined the team!"

firebase functions:config:get