import subprocess

class SisPMError(Exception):
    pass

class SisPM:
    OFF = 0
    ON = 1
    TOGGLE = 2

    def __init__(self):
        self.serial = "01:01:53:2c:20"
        self.binary = "/usr/bin/sispmctl"

    def get(self, outlet='all'):
        if outlet != 'all':
            try:
                outlet = str(int(outlet))
            except TypeError, v:
                raise SisPMError('Invalid outlet: ' + str(v))

        command = [self.binary, '-qnD', self.serial, '-g', outlet]

        try:
            result = subprocess.check_output(command, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError, v:
            raise SisPMError('Querying outlets failed: ' + v.output)
        status = tuple(bool(int(bit)) for bit in result.split('\n')[:-1])
        if outlet != 'all':
            return status[0]
        else:
            return status

    def get_schedule(self, outlet='all'):
        # only works with patched version of sispmctl
        if outlet != 'all':
            try:
                outlet = str(int(outlet))
            except TypeError, v:
                raise SisPMError('Invalid outlet: ' + str(v))

        command = [self.binary, '-qnD', self.serial, '-a', outlet]

        try:
            result = subprocess.check_output(command, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError, v:
            raise SisPMError('Querying outlets failed: ' + v.output)
        if outlet != 'all':
            return result[:-2]
        else:
            return '[\n' + result[:-2] + '\n]'

    def off(self, outlet):
        self.set(self.OFF, outlet)
        return False

    def on(self, outlet):
        self.set(self.ON, outlet)
        return True

    def toggle(self, outlet):
        self.set(self.TOGGLE, outlet)
        return self.get(outlet)

    def set(self, status, outlet):
        if outlet != 'all':
            try:
                outlet = str(int(outlet))
            except TypeError:
                raise SisPMError("Invalid outlet %s " % outlet)

        if status == self.ON:
            action = "-o"
        elif status == self.OFF:
            action = "-f"
        elif status == self.TOGGLE:
            action = "-t"
        else:
            raise SisPMError("Invalid status '%s'." % status)


        command = [self.binary, '-qD', self.serial, action, outlet]

        try:
            result = subprocess.check_output(command, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError, v:
            raise SisPMError('Failed to set outlets:' + v.output)
