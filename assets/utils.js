module.exports.PORT=process.env.PORT||8000;
module.exports.host= "localhost";
module.exports.user= "root";
module.exports.password= "password";
module.exports.database= "cointab";
module.exports.name='cointab';
module.exports.secret='blahblahblah';
module.exports.maxAge= 60000;
module.exports.resave=false;
module.exports.saveUninitialized=false;

module.exports.msToTime=(s)=>{
    s = (s - s % 1000) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;
    return hrs + 'hour:' + mins + 'min:' + secs + 'sec';
  }