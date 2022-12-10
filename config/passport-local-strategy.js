const passport=require('passport');
const con = require('./sql');
const LocalStrategy=require('passport-local').Strategy;     //Using Passport Local Strategy
const {msToTime}=require('../assets/utils');

passport.use( new LocalStrategy({
    usernameField:'email',
    passReqToCallback:true      //Here req is for flash messages
},  (req, email,password,done)=>{
        con.query(`SELECT * FROM USERS WHERE EMAIL='${email}'`,(err,isExistingUser)=>{
            if(err) {
                req.flash('error',err);
                return done(err);
            };
            //If we dont have record with this email
            if(!isExistingUser[0]){
                console.log('User with email does not exist ... ');
                req.flash('error','User with email does not exist ... ');
                return done(null,false);
            }
            else if(parseInt(isExistingUser[0].timeout) + parseInt(86400000) > Date.now()){
                req.flash('error',`You are blocked for ${msToTime(86400000- (Date.now() - isExistingUser[0].timeout))}`);
                return done(null,false);  
            }
            //If we dont have record with this email and password.
            else if(isExistingUser[0].password!=password){
                isExistingUser[0].attempt++;
                con.query(`UPDATE USERS SET ATTEMPT='${isExistingUser[0].attempt}' 
                    WHERE EMAIL='${isExistingUser[0].email}' `);
                if(isExistingUser[0].attempt>=5){
                    con.query(`UPDATE USERS SET TIMEOUT='${Date.now()}' 
                    WHERE EMAIL='${isExistingUser[0].email}' `);
                    console.log('You are blocked for 24 hours ... ');
                    req.flash('error',`You are blocked for 24 hours ... `);
                }
                else{
                    console.log('Invalid password. Try Again ... ');
                    req.flash('error','Invalid password. Try Again ... ');   
                }
                return done(null,false);
            }
            con.query(`UPDATE USERS SET ATTEMPT='0',TIMEOUT='0' 
                    WHERE EMAIL='${isExistingUser[0].email}' `);
            return done(null,isExistingUser[0]);
        })
}
));

//Serializing
passport.serializeUser((user,done)=>{
    done(null,user.email);
});

//Deserializing
passport.deserializeUser((email,done)=>{
    con.query(`SELECT * FROM USERS WHERE EMAIL='${email}'`,(err,isUser)=>{
        if(err) {
            console.log('Error while finding user --> passport');
            req.flash('error','Error while finding user --> passport');
            return done(err)
        }
        return done(null,isUser[0]);
    })
});

//Check if user is athenticated ...
passport.checkAuthentication=(req,res,next)=>{
    if(req.isAuthenticated()){  //isAuthenticated() is provided by passport
        return next();
    }
    //if user is not signed in
    return res.redirect('/login');
}

//SettingUp user info in local.
passport.setAuthicateduser=(req,res,next)=>{
    if(req.isAuthenticated())
        res.locals=req.user;
    next();
}

module.exports=passport;