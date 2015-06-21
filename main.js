var mcp3424 = require('./lib/mcp3424');

var address = 0x68;
var gain = 0; //{0,1,2,3} represents {x1,x2,x4,x8}
var resolution = 3; //{0,1,2,3} and represents {12,14,16,18} bits

var pga = 0.5; // {x1,x2,x4,x8}gain represents {0.5, 1, 2, 4}
var lsb = 0.0005; // {12,14,16,18}bits {0.0005, 0.000125, 0.00003125, 0.0000078125}lsb

var mcp = new mcp3424(address, gain, resolution, '/dev/i2c-1');

setInterval(function(){
    var voltage = ((mcp.getMv(0) * (lsb / pga)) * 2.471);
    console.log('Reading: ' + voltage);
}, 1000);

