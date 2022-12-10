const mysql = require('mysql');
const {host,user,password,database}=require('../assets/utils')

const con = mysql.createConnection({host,user,password,database});

con.connect(function(err) {
  if (err) throw err;  
    console.log('Connected to cointab_database');
});

module.exports=con;