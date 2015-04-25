#!/usr/bin/env python

import web
import json
from sispmctl import SisPM, SisPMError
import os

gb = SisPM()

urls = (
    '/gembird', 'gembird'
)

class gembird:

    def GET(self):
        input = web.input(action = None)
        web.header('Content-Type', 'application/json')

        action = input.action
        if action is None:
            return json.dumps({'response': 'specify ?action=<action>', 'input': input})
        else:
            del input['action']

        if action not in ('get', 'get_schedule', 'on', 'off', 'toggle'):
            return json.dumps({'response': 'unknown action', 'input': input})
        else:
            try:
                response = getattr(gb, action)(**input)
            except SisPMError, v:
                response = str(v)
                return json.dumps({'response': response, 'action': action, 'input': input})
            except AttributeError, v:
                response = 'action failed to execute: ' + str(v)
                return json.dumps({'response': response, 'action': action, 'input': input})
            except TypeError, v:
                response = 'Incorrect args: ' + str(v)
                return json.dumps({'response': response, 'action': action, 'input': input})
            if action == 'get_schedule':
                return '{"response": ' + response + '}'
            else:
                return json.dumps({'response': response, 'action': action, 'input': input})

wsgi_app = web.application(urls, globals()).wsgifunc()

if __name__ == '__main__':
    app = web.application(urls, globals())
    app.run()
