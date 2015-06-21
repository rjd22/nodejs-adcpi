Wire          = require 'i2c'

#rewrite for node from https://github.com/abelectronicsuk/MCP3424/blob/master/

# Define configuration register bits and addresses
MCP342X_GAIN_FIELD = 0x03 # PGA field
MCP342X_GAIN_X1    = 0x00 # PGA gain X1
MCP342X_GAIN_X2    = 0x01 # PGA gain X2
MCP342X_GAIN_X4    = 0x02 # PGA gain X4
MCP342X_GAIN_X8    = 0x03 # PGA gain X8

MCP342X_RES_FIELD  = 0x0C # resolution/rate field
MCP342X_RES_SHIFT  = 2    # shift to low bits
MCP342X_12_BIT     = 0x00 # 12-bit 240 SPS
MCP342X_14_BIT     = 0x04 # 14-bit 60 SPS
MCP342X_16_BIT     = 0x08 # 16-bit 15 SPS
MCP342X_18_BIT     = 0x0C # 18-bit 3.75 SPS

MCP342X_CONTINUOUS = 0x10 # 1 = continuous, 0 = one-shot
#MCP342X_SINGLESHOT = 0x00 # 1 = continuous, 0 = one-shot # NOT WORKING RIGHT NOW!!!

MCP342X_CHAN_FIELD = 0x60 # channel field
MCP342X_CHANNEL_1  = 0x00 # select MUX channel 1
MCP342X_CHANNEL_2  = 0x20 # select MUX channel 2
MCP342X_CHANNEL_3  = 0x40 # select MUX channel 3
MCP342X_CHANNEL_4  = 0x60 # select MUX channel 4

MCP342X_START      = 0x80 # write: start a conversion (Continuous Conversion mode: No effect)
MCP342X_BUSY       = 0x80 # read: output not ready


class MCP3424
	#------------ Class variables --------------
  	address: 0x0
  	gain: 0x0
  	res: 0x0
  	channel: []
  	currChannel: 0
  	oldChannel: 100;
  	
	#------------ Public functions -------------
  	constructor: (@address, @gain, @res, @device = '/dev/i2c-1') ->
    	@wire = new Wire(@address, device: @device)
    	@_readDataContiuously()
    
    getMv: (chan) ->
    	return @channel[chan]
    
    #------------- Private functions ------------	
    _getMvDivisor: () ->
    	mvDivisor = 1 << (@gain + 2*@res);
    
    _getAdcConfig: (chan) ->
    	adcConfig = MCP342X_CHANNEL_1 | MCP342X_CONTINUOUS ;
    	adcConfig |= chan << 5 | @res << 2 | @gain;
    
    _changeChannel: (chan) ->
    	command = @_getAdcConfig(chan)
    	@wire.writeByte command, (err) ->
    		if err isnt null
        		console.log err
    	
    _readDataContiuously: () ->
    	self = this
    	setInterval (->
    		self._readData(self.currChannel)
    		return
    	), 10  
    	
    _nextChannel: () ->
    	@currChannel++
    	@currChannel = 0 if @currChannel is 4
    	
    _readData: (chan) ->
    	self = this
    	adcConfig = @_getAdcConfig(chan)
    	result = 0	
    	statusbyte = 0
    	
    	@wire.readBytes adcConfig, 4, (err,res) ->
    		if err isnt null
        		console.log err
        	if (adcConfig & MCP342X_RES_FIELD) is MCP342X_18_BIT
        		byte0 = res[0]
        		byte1 = res[1]
        		byte2 = res[2]
        		statusbyte = res[3]
        		result = byte2 | byte1 << 8 | byte0 << 16
        	else
        		byte0 = res[0]
        		byte1 = res[1]
        		statusbyte = res[2]
        		result = byte1 | byte0 << 8
        	if ((statusbyte & MCP342X_BUSY) is 0)
        		self.channel[self.currChannel] = result / self._getMvDivisor()
        		self._nextChannel()
        		self._changeChannel self.currChannel
        	else
        		"err"
       
	 	

module.exports = MCP3424
