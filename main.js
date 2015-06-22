var mcp3424 = require('./lib/mcp3424');

var address = 0x68;
var gain = 0; //{0,1,2,3} represents {x1,x2,x4,x8}
var resolution = 3; //{0,1,2,3} and represents {12,14,16,18} bits

var mcp = new mcp3424(address, gain, resolution, '/dev/i2c-1');

setInterval(function(){
    console.log('Reading: ' + mcp.getVoltage(0));
}, 1000);

