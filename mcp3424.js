var Wire = require('i2c'),
    MCP342X_GAIN_FIELD = 0x03,
    MCP342X_GAIN_X1 = 0x00,
    MCP342X_GAIN_X2 = 0x01,
    MCP342X_GAIN_X4 = 0x02,
    MCP342X_GAIN_X8 = 0x03,
    MCP342X_RES_FIELD = 0x0C,
    MCP342X_RES_SHIFT = 2,
    MCP342X_12_BIT = 0x00,
    MCP342X_14_BIT = 0x04,
    MCP342X_16_BIT = 0x08,
    MCP342X_18_BIT = 0x0C,
    MCP342X_CONTINUOUS = 0x10,
    MCP342X_CHAN_FIELD = 0x60,
    MCP342X_CHANNEL_1 = 0x00,
    MCP342X_CHANNEL_2 = 0x20,
    MCP342X_CHANNEL_3 = 0x40,
    MCP342X_CHANNEL_4 = 0x60,
    MCP342X_START = 0x80,
    MCP342X_BUSY = 0x80,
    MCP3424;

MCP3424 = (function() {
    MCP3424.prototype.address = 0x0;

    MCP3424.prototype.gain = 0x0;

    MCP3424.prototype.res = 0x0;

    MCP3424.prototype.channel = [];

    MCP3424.prototype.currChannel = 0;

    function MCP3424(address, gain, res1, device) {
        this.address = address;
        this.gain = gain;
        this.res = res1;
        this.device = device != null ? device : '/dev/i2c-1';
        this.wire = new Wire(this.address, {
            device: this.device
        });
        this._readDataContiuously();
    }

    MCP3424.prototype.getMv = function(chan) {
        return this.channel[chan];
    };

    MCP3424.prototype.getVoltage = function(chan) {
        return ((this.getMv(chan) * (0.0005 / this._getPga())) * 2.471)
    };

    MCP3424.prototype._getMvDivisor = function() {
        var mvDivisor;
        return mvDivisor = 1 << (this.gain + 2 * this.res);
    };

    MCP3424.prototype._getAdcConfig = function(chan) {
        var adcConfig;
        adcConfig = MCP342X_CHANNEL_1 | MCP342X_CONTINUOUS;
        return adcConfig |= chan << 5 | this.res << 2 | this.gain;
    };

    MCP3424.prototype._changeChannel = function(chan) {
        var command;
        command = this._getAdcConfig(chan);
        return this.wire.writeByte(command, function(err) {
            if (err !== null) {
                return console.log(err);
            }
        });
    };

    MCP3424.prototype._readDataContiuously = function() {
        var self;
        self = this;
        return setInterval((function() {
            self._readData(self.currChannel);
        }), 10);
    };

    MCP3424.prototype._nextChannel = function() {
        this.currChannel++;
        if (this.currChannel === 4) {
            return this.currChannel = 0;
        }
    };

    MCP3424.prototype._readData = function(chan) {
        var adcConfig, result, self, statusByte;
        self = this;
        adcConfig = this._getAdcConfig(chan);
        result = 0;
        statusByte = 0;
        return this.wire.readBytes(adcConfig, 4, function(err, res) {
            var byte0, byte1, byte2;
            if (err !== null) {
                console.log(err);
            }
            if ((adcConfig & MCP342X_RES_FIELD) === MCP342X_18_BIT) {
                byte0 = res[0];
                byte1 = res[1];
                byte2 = res[2];
                statusByte = res[3];
                result = byte2 | byte1 << 8 | byte0 << 16;
            } else {
                byte0 = res[0];
                byte1 = res[1];
                statusByte = res[2];
                result = byte1 | byte0 << 8;
            }
            if ((statusByte & MCP342X_BUSY) === 0) {
                self.channel[self.currChannel] = result / self._getMvDivisor();
                self._nextChannel();
                return self._changeChannel(self.currChannel);
            } else {
                return "err";
            }
        });
    };

    MCP3424.prototype._getPga = function() {
        var gain = this.gain;

        if (gain == MCP342X_GAIN_X1) {
            return 0.5;
        }

        if (gain == MCP342X_GAIN_X2) {
            return 1;
        }

        if (gain == MCP342X_GAIN_X4) {
            return 2;
        }

        if (gain == MCP342X_GAIN_X8) {
            return 4;
        }
    };

    return MCP3424;

})();

module.exports = MCP3424;
