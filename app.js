const express=require('express');
const app=express();
const {PORT,maxAge,name,secret,resave,saveUninitialized}=require('./assets/utils');
const con=require('./config/sql');
const path=require('path');
const cookieParser=require('cookie-parser');
const crypto = require("crypto");           //Using crypto to generate ID
const session=require('express-session');   //express-session for flash messages
const passport=require('passport')  
const passportLocal=require('./config/passport-local-strategy');
const flash=require('connect-flash');

//Creating express session
app.use(session({ cookie: { maxAge },name,secret,resave,saveUninitialized}));
    
app.use(passport.initialize())
app.use(passport.session())
app.use(passport.setAuthicateduser)
app.use(flash());
app.use(require('./config/setupFlash').setFlash);

app.use(cookieParser());                                    //cookie parser for cookies
app.use(express.urlencoded({extended:true}));               //to encode form data
app.set('view engine','ejs');                               //setting up template engine
app.set('views',path.join(__dirname,'./views'))             //setting up views directory
app.use(express.static(path.join(__dirname,'./assets')));   //setting up assets directory consisting img,css,js files


//Home(login) route handler
app.get('/',(req,res)=>{
    return res.render('home');
});

//Route handler for login request
app.post('/login',passport.authenticate('local',{failureRedirect:'/'}),async (req,res)=>{
    req.flash('success','Logged In Successfully.');
    return res.redirect('/userPage');
});

//Logout route handler
app.get('/logout',(req,res,next)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success','Logged Out Successfully ... ')
        res.redirect('/');
    });
});

//Block user route handler
app.get('/blockuser',(req,res)=>{
    return res.render('blockuser');
});

//Route handler for User Management View
app.get('/userPage',(req,res)=>{
    try{
        //We can only access User Management View only after we logged in with any user
        if(req.isAuthenticated())
        {
            con.query(`SELECT * FROM USERS`,(err,getAllUsers)=>{
                if(err) throw err;
                if(getAllUsers.length>=1){
                    let users=getAllUsers
                    return res.render('userPage',{users});
                }
            });
        }
        else{
            return res.redirect('/');
        }
    }
    catch(error){
        return console.log('Error',error);
    }
});

//Route handler for add user request
app.post('/add_user',async (req,res)=>{
    try{
        if(req.isAuthenticated()){
            if(req.body.password!=req.body.confirm_password){
                req.flash('error','Password does not match');
                return res.redirect('back'); 
            }
            //If we want to update, first check if we have ID of user
            if(req.body.userid){
                //Updating user 
                con.query(`UPDATE USERS SET NAME='${req.body.name}', PASSWORD='${req.body.password}' WHERE ID='${req.body.userid}'`,
                    (err,updatedUser)=>{
                        if(err){
                            req.flash('error','Unable to update !!!');
                            throw err
                        }
                        req.flash('success','User updated successfully !!!');
                        return res.redirect('back');
                    }
                );
            }
            //If we are dont have ID of user, then we add user
            else{
                //Check if email already exist
                con.query(`SELECT * FROM users where email='${req.body.email}'`,(err,isExistingUser)=>{
                    if(err){
                        req.flash('error',err);
                        throw err
                    }
                    if(isExistingUser.length>=1){
                        console.log('This email is already registered');
                        req.flash('success','This email is already registered ... ');
                        return res.redirect('back');
                    }else{
                        //Creating new user
                        const id = crypto.randomBytes(12).toString("hex");
                        con.query(`INSERT INTO USERS VALUES('${id}','${req.body.name}','${req.body.email}','${req.body.password}',0,0)`,
                            (err,createdUser)=>{
                                if(err){
                                    req.flash('error',err);
                                    throw err
                                }
                                req.flash('success','User Signed Up Successfully ... ');
                                return res.redirect('back');
                            }
                        );
                    }
                });
            }
        }
    }
    catch(error){
        return console.log('Error',error);
    }
});

// Route handler for delete user request
app.get('/delete_user',async (req,res)=>{
    try{
        if(req.isAuthenticated())
        {
        //Deleting user
        con.query(`DELETE FROM USERS WHERE id='${req.query.id}'`,(err,deleteUser,fields)=>{
            if(err){
                req.flash('error',err);
                throw err
            }
        });
        }
        req.flash('success','Deleted User Successfully ... ');
        return res.redirect('back');
    }
    catch(error){
        return console.log('Error',error);
    }
}); 

app.listen(PORT,(error)=>{
    if(error)
    return console.log(error)
    console.log(`Server started listening on port : ${PORT}`);
});